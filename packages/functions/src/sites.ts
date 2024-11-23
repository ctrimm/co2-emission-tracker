import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

export async function handler(_evt) {
  try {
    // Get all monitored sites with their latest emission data
    const { data: sites, error } = await supabase
      .from('monitored_sites')
      .select(`
        domain,
        name,
        industry,
        domain_type,
        agency,
        organization,
        website_emissions!inner (
          date,
          estimated_co2_grams,
          is_green,
          total_bytes
        )
      `)
      .order('date', { foreignTable: 'website_emissions', ascending: false })
      .limit(1, { foreignTable: 'website_emissions' });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ sites }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300" // Cache for 5 minutes
      }
    };
  } catch (error) {
    console.error('Error fetching sites:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" }
    };
  }
};
