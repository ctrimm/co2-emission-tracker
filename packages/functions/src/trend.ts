import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

// Returns average CO2 per day for the last N days (default 30, max 90).
// Used by the homepage trend chart.
export async function handler(event) {
  try {
    const rawDays = event.queryStringParameters?.days;
    const days = Math.min(Math.max(parseInt(rawDays || '30', 10) || 30, 7), 90);

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    // Fetch lightweight rows for the date range. At ~1 000 sites × 90 days
    // this is at most ~90 000 rows with 3 small fields — manageable in Lambda.
    const { data, error } = await supabase
      .from('website_emissions')
      .select('date, estimated_co2_grams, is_green')
      .gte('date', sinceStr)
      .order('date', { ascending: true })
      .limit(100000);

    if (error) throw error;

    // Aggregate by date in Lambda.
    const byDate: Record<string, { sum: number; count: number; greenCount: number }> = {};
    for (const row of data || []) {
      if (!byDate[row.date]) byDate[row.date] = { sum: 0, count: 0, greenCount: 0 };
      byDate[row.date].sum += row.estimated_co2_grams || 0;
      byDate[row.date].count++;
      if (row.is_green) byDate[row.date].greenCount++;
    }

    const trend = Object.entries(byDate).map(([date, { sum, count, greenCount }]) => ({
      date,
      averageCO2: parseFloat((sum / count).toFixed(3)),
      siteCount: count,
      greenPercent: parseFloat(((greenCount / count) * 100).toFixed(1)),
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ trend }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    };
  } catch (error) {
    console.error('Error fetching trend:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
