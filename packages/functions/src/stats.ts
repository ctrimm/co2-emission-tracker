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
    // Get active site count and the most recent scan date in parallel.
    const [activeSitesResult, latestDateRow] = await Promise.all([
      supabase
        .from('monitored_sites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('website_emissions')
        .select('date')
        .order('date', { ascending: false })
        .limit(1)
        .single(),
    ]);

    if (latestDateRow.error) throw latestDateRow.error;

    const latestDate = latestDateRow.data?.date;

    // Fetch lightweight rows for the latest date to compute aggregates.
    // Supabase PostgREST caps responses at max_rows (commonly 1000), so we
    // paginate in 1000-row pages until all rows are retrieved.
    const PAGE_SIZE = 1000;
    const allEmissions: { estimated_co2_grams: number; is_green: boolean }[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('website_emissions')
        .select('estimated_co2_grams, is_green')
        .eq('date', latestDate)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allEmissions.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    const emissions = allEmissions;

    const totalIndexesRun = emissions.length;
    const avgCO2 = totalIndexesRun > 0
      ? emissions.reduce((sum, e) => sum + (e.estimated_co2_grams || 0), 0) / totalIndexesRun
      : 0;
    const greenCount = emissions?.filter(e => e.is_green).length || 0;
    const greenPercent = totalIndexesRun > 0 ? (greenCount / totalIndexesRun) * 100 : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalActiveSites: activeSitesResult.count || 0,
        latestScanDate: latestDate,
        totalIndexesRun,
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
