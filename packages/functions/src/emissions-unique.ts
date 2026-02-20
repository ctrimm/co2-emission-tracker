import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

// NOTE - this is just for the index page since we dont want to get all the data
// it will just return the latest emission for each unique domain
export async function handler(_evt) {
  try {
    // First, get the total count of monitored sites
    const { count: totalSites } = await supabase
      .from('monitored_sites')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get the most recent date that has emission data.
    // The cron job uses upsert with onConflict: 'date,domain', so there is
    // exactly one row per domain per date — fetching all rows for the latest
    // date gives us one unique record per domain without any GROUP BY magic.
    const { data: latestDateRow, error: dateError } = await supabase
      .from('website_emissions')
      .select('date')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (dateError) throw dateError;

    const latestDate = latestDateRow?.date;

    const { data: emissions, error, count } = await supabase
      .from('website_emissions')
      .select('*', { count: 'exact' })
      .eq('date', latestDate)
      .order('domain', { ascending: true })
      .limit(totalSites || 20000);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ emissions, count }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300" // Cache for 5 minutes
      }
    };
  } catch (error) {
    console.error('Error fetching emissions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
};