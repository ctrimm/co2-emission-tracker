import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

// Returns the top 10 cleanest and top 10 heaviest sites from the most
// recent scan date. Sites with zero CO2 (failed/timed-out scans) are excluded.
export async function handler(_evt) {
  try {
    const { data: latestDateRow, error: dateError } = await supabase
      .from('website_emissions')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (dateError) throw dateError;

    const latestDate = latestDateRow?.date;

    const [cleanestResult, heaviestResult] = await Promise.all([
      supabase
        .from('website_emissions')
        .select('domain, estimated_co2_grams, is_green, total_bytes')
        .eq('date', latestDate)
        .gt('estimated_co2_grams', 0)
        .order('estimated_co2_grams', { ascending: true })
        .limit(10),
      supabase
        .from('website_emissions')
        .select('domain, estimated_co2_grams, is_green, total_bytes')
        .eq('date', latestDate)
        .gt('estimated_co2_grams', 0)
        .order('estimated_co2_grams', { ascending: false })
        .limit(10),
    ]);

    if (cleanestResult.error) throw cleanestResult.error;
    if (heaviestResult.error) throw heaviestResult.error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        date: latestDate,
        cleanest: cleanestResult.data || [],
        heaviest: heaviestResult.data || [],
      }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
