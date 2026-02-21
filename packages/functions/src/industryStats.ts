import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

// Returns avg CO2, site count, and green % broken down by industry,
// computed from the most recent date that has valid (non-zero) CO2 data.
export async function handler(_evt) {
  try {
    // Find the most recent date with at least one valid CO2 reading.
    const { data: latestDateRow, error: dateError } = await supabase
      .from('website_emissions')
      .select('date')
      .gt('estimated_co2_grams', 0)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (dateError) throw dateError;

    const latestDate = latestDateRow?.date;

    // Paginate through all rows for that date.
    const PAGE_SIZE = 1000;
    const allRows: { industry: string | null; estimated_co2_grams: number; is_green: boolean }[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('website_emissions')
        .select('industry, estimated_co2_grams, is_green')
        .eq('date', latestDate)
        .gt('estimated_co2_grams', 0)
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    // Aggregate by industry in Lambda.
    const byIndustry: Record<string, { sum: number; count: number; greenCount: number }> = {};
    for (const row of allRows) {
      const key = row.industry?.trim() || 'Other';
      if (!byIndustry[key]) byIndustry[key] = { sum: 0, count: 0, greenCount: 0 };
      byIndustry[key].sum += row.estimated_co2_grams;
      byIndustry[key].count++;
      if (row.is_green) byIndustry[key].greenCount++;
    }

    const industries = Object.entries(byIndustry)
      .map(([industry, { sum, count, greenCount }]) => ({
        industry,
        avgCO2: parseFloat((sum / count).toFixed(3)),
        siteCount: count,
        greenPercent: parseFloat(((greenCount / count) * 100).toFixed(1)),
      }))
      .sort((a, b) => a.avgCO2 - b.avgCO2);  // cleanest first

    const overallSum = allRows.reduce((s, r) => s + r.estimated_co2_grams, 0);
    const overallAvgCO2 = allRows.length > 0
      ? parseFloat((overallSum / allRows.length).toFixed(3))
      : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({ industries, overallAvgCO2, scanDate: latestDate }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    };
  } catch (error) {
    console.error('Error fetching industry stats:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
