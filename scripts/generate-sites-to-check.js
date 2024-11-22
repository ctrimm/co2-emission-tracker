import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateSitesList(filePath) {
  try {
    // Read the websites list
    const websites = JSON.parse(readFileSync(filePath, 'utf8'));

    // Get existing sites from Supabase
    const { data: existingSites, error: fetchError } = await supabase
      .from('monitored_sites')
      .select('domain');

    if (fetchError) throw fetchError;

    const existingDomains = new Set(existingSites.map(site => site.domain));

    // Filter and prepare new sites
    const newSites = websites
      .filter(website => !existingDomains.has(website.website))
      .map(website => ({
        domain: website.website,
        name: website.name,
        industry: website.industry,
        domain_type: website.domainType || null,
        agency: website.agency || null,
        organization: website.organization || null,
        monitoring_frequency: filePath.includes('weekly') ? 'weekly' : 'daily',
        created_at: new Date().toISOString()
      }));

    if (newSites.length > 0) {
      // Insert new sites into Supabase
      const { error: insertError } = await supabase
        .from('monitored_sites')
        .upsert(newSites, {
          onConflict: 'domain',
          ignoreDuplicates: false
        });

      if (insertError) throw insertError;
      console.log(`Added ${newSites.length} new sites to monitoring list`);
    } else {
      console.log('No new sites to add');
    }

  } catch (error) {
    console.error('Error generating sites list:', error);
    throw error;
  }
}

// Get file path from command line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path to the websites list JSON file');
  process.exit(1);
}

generateSitesList(filePath)
  .catch(error => {
    console.error('Error in main process:', error);
    process.exit(1);
  });
