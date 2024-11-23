import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

export async function handler(_evt) {
  try {
    // First, get the total count of monitored sites
    const { data, count: totalSites } = await supabase
      .from('monitored_sites')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get the latest emission for each unique domain
    const { data: emissions, error } = await supabase
      .from('website_emissions')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .or('domain.not.is.null')
      .limit(totalSites || 20000); // Adjust limit as needed

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ emissions }),
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