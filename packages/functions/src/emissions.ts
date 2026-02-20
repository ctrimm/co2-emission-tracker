import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

export async function handler(_evt) {
  try {
    // Get the most recent emissions, capped to prevent unbounded response sizes.
    // At ~1000 sites/day this covers over a week of data.
    const { data: emissions, error, count } = await supabase
      .from('website_emissions')
      .select('*', { count: 'exact' })
      .order('date', { ascending: false })
      .limit(5000);

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
