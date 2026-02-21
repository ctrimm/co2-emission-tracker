import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

// Returns pre-aggregated stats for the homepage so it doesn't need to
// download and process the full /emissions-unique payload.
export async function handler(_evt) {
  try {
    // Run three queries in parallel:
    //   1. Total active monitored sites
    //   2. Total emission measurements ever recorded (the 850 K number)
    //   3. Most recent date that has at least one non-zero CO2 reading
    //      (skips days where Puppeteer failed and wrote all-zero records)
    const [activeSitesResult, totalScansResult, latestValidDateRow] = await Promise.all([
      supabase
        .from('monitored_sites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('website_emissions')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('website_emissions')
        .select('date')
        .gt('estimated_co2_grams', 0)
        .order('date', { ascending: false })
        .limit(1)
        .single(),
    ]);

    if (latestValidDateRow.error) throw latestValidDateRow.error;

    const latestDate = latestValidDateRow.data?.date;

    // Fetch lightweight rows for the latest *valid* date to compute aggregates.
    // Supabase PostgREST caps responses at max_rows (commonly 1000), so we
    // paginate in 1000-row pages until all rows for the date are retrieved.
    const PAGE_SIZE = 1000;
    const allEmissions: { estimated_co2_grams: number; is_green: boolean }[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('website_emissions')
        .select('estimated_co2_grams, is_green')
        .eq('date', latestDate)
        .gt('estimated_co2_grams', 0)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allEmissions.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    const scanCount = allEmissions.length;
    const avgCO2 = scanCount > 0
      ? allEmissions.reduce((sum, e) => sum + (e.estimated_co2_grams || 0), 0) / scanCount
      : 0;
    const greenCount = allEmissions.filter(e => e.is_green).length;
    const greenPercent = scanCount > 0 ? (greenCount / scanCount) * 100 : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalActiveSites: activeSitesResult.count || 0,
        latestScanDate: latestDate,
        totalIndexesRun: totalScansResult.count || 0,
        averageCO2Grams: parseFloat(avgCO2.toFixed(3)),
        greenHostedPercent: parseFloat(greenPercent.toFixed(2)),
      }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
