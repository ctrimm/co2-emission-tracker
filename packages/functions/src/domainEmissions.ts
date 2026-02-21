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
  // NOTE: Using a direct query on website_emissions (not an embedded join) so that
  // the limit is properly respected — Supabase's foreignTable limit in embedded
  // queries is capped server-side at 7 regardless of the requested value.
  const rawLimit = event.queryStringParameters?.limit;
  const limit = Math.min(Math.max(parseInt(rawLimit || '30', 10) || 30, 1), 90);

  try {
    const [siteResult, emissionsResult, emissionsCount] = await Promise.all([
      supabase
        .from('monitored_sites')
        .select('industry, domain_type')
        .eq('domain', domain)
        .single(),

      supabase
        .from('website_emissions')
        .select('date, estimated_co2_grams, is_green, total_bytes')
        .eq('domain', domain)
        .order('date', { ascending: false })
        .limit(limit),

      supabase
        .from('website_emissions')
        .select('*', { count: 'exact', head: true })
        .eq('domain', domain),
    ]);

    // PGRST116 = no rows — domain not yet in monitored_sites, treat gracefully
    if (siteResult.error && siteResult.error.code !== 'PGRST116') throw siteResult.error;
    if (emissionsResult.error) throw emissionsResult.error;

    if (!emissionsResult.data?.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No data found for this domain' }),
        headers: { "Content-Type": "application/json" }
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        siteData: {
          industry: siteResult.data?.industry ?? null,
          domain_type: siteResult.data?.domain_type ?? null,
          website_emissions: emissionsResult.data,
        },
        totalScans: emissionsCount.count ?? 0,
      }),
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
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
}
