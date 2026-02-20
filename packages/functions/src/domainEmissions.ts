import { createClient } from '@supabase/supabase-js';
import { Resource } from "sst";

const supabase = createClient(
  Resource.MySupabaseUrl.value,
  Resource.MySupabaseAnonRoleKey.value
);

export async function handler(event) {
  const domain = event.pathParameters?.domain;

  if (!domain) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Domain parameter is required' }),
      headers: { "Content-Type": "application/json" }
    };
  }

  // ?limit= controls how many historical scans are returned for the chart.
  // Default 30 (one month), capped at 90 to keep response sizes reasonable.
  const rawLimit = event.queryStringParameters?.limit;
  const limit = Math.min(Math.max(parseInt(rawLimit || '30', 10) || 30, 1), 90);

  try {
    // Get site data and emissions count in parallel
    const [siteData, emissionsCount] = await Promise.all([
      supabase
        .from('monitored_sites')
        .select(`
          industry,
          domain_type,
          website_emissions!inner (
            date,
            estimated_co2_grams,
            is_green,
            total_bytes
          )
        `)
        .eq('domain', domain)
        .order('date', { foreignTable: 'website_emissions', ascending: false })
        .limit(limit, { foreignTable: 'website_emissions' })
        .single(),
      
      supabase
        .from('website_emissions')
        .select('*', { count: 'exact', head: true })
        .eq('domain', domain)
    ]);

    if (siteData.error) throw siteData.error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        siteData: siteData.data,
        totalScans: emissionsCount.count
      }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300" // Cache for 5 minutes
      }
    };
  } catch (error) {
    console.error('Error fetching domain emissions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { "Content-Type": "application/json" }
    };
  }
};
