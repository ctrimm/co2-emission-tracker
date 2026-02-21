import { hosting, co2 } from '@tgwf/co2';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Limit concurrent operations
const limit = pLimit(10);

// Initialize CO2 estimation library
const co2Emission = new co2();

async function logError(url, errorType, errorMessage, severity = 'error', details = null) {
  try {
    const { error } = await supabase
      .from('error_log')
      .insert({
        url,
        error_type: errorType,
        error_message: errorMessage,
        error_severity: severity,
        error_details: details ? JSON.stringify(details) : null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log error to Supabase:', error);
    }
  } catch (e) {
    console.error('Exception while logging error:', e);
  }
}

async function getPageDataSize(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    let totalBytes = 0;

    // Buffer each response body to get its actual byte length.
    // Relying solely on the content-length header misses chunked transfer
    // encoding responses (the majority of modern sites), which return 0.
    page.on('response', async (response) => {
      try {
        const buffer = await response.buffer();
        totalBytes += buffer.length;
      } catch {
        // Some responses (e.g. streams, aborted) cannot be buffered — skip them.
        const headers = response.headers();
        if (headers['content-length']) {
          totalBytes += parseInt(headers['content-length'], 10);
        }
      }
    });

    // networkidle2 waits until no more than 2 in-flight requests for 500ms,
    // giving async resources (images, fonts, scripts) time to load and be
    // counted. 30s timeout is generous enough for slow government sites.
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    return totalBytes;
  } catch (error) {
    await logError(
      url,
      'Timeout or navigation error',
      error.message,
      'error',
      {
        stack: error.stack,
        timestamp: new Date().toISOString(),
        browserVersion: await browser?.version() || 'unknown'
      }
    );
    return 0;
  } finally {
    if (browser) await browser.close();
  }
}

function getCurrentDate() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

async function checkGreenHosting(domain) {
  try {
    console.log(`Checking green hosting for ${domain}`);
    return await hosting.check(domain, "myGreenWebApp");
  } catch (error) {
    await logError(
      domain,
      'Green Hosting Check Error',
      error.message,
      'warning',
      {
        timestamp: new Date().toISOString(),
        hostingCheckVersion: hosting.version || 'unknown'
      }
    );
    return false;
  }
}

function estimateEmissions(bytes, isGreen) {
  return parseFloat(co2Emission.perByte(bytes, isGreen).toFixed(3));
}

async function processDomain(site) {
  try {
    const isGreen = await checkGreenHosting(site.domain);
    const totalBytes = await getPageDataSize(`https://${site.domain}`);
    const estimatedCO2 = estimateEmissions(totalBytes, isGreen);
    
    const record = {
      date: getCurrentDate(),
      domain: site.domain,
      name: site.name,
      industry: site.industry,
      domain_type: site.domain_type,
      agency: site.agency,
      organization: site.organization,
      is_green: isGreen,
      estimated_co2_grams: estimatedCO2,
      total_bytes: totalBytes,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('website_emissions')
      .upsert(record, {
        onConflict: 'date,domain',
        ignoreDuplicates: true
      });

    if (error) {
      console.error(`Error inserting record for ${site.domain}:`, error);
      throw error;
    }

    console.log(`Successfully processed ${site.domain}`);

  } catch (error) {
    console.error(`Error processing domain ${site.domain}:`, error);
    await logError(
      site.domain,
      'Domain Processing Error',
      error.message,
      'error',
      {
        timestamp: new Date().toISOString(),
        details: error.stack
      }
    );
  }
}

async function processSites() {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Get daily sites
    const { data: dailySites, error: dailyError } = await supabase
      .from('monitored_sites')
      .select('*')
      .eq('is_active', true)
      .eq('monitoring_frequency', 'daily');

    if (dailyError) throw dailyError;

    // Get weekly sites for current day.
    // Rather than relying on an optional check_day column, we distribute sites
    // deterministically across days of the week using a hash of the domain name.
    // This guarantees each weekly site is scanned on exactly one day per week
    // without requiring any additional database schema changes.
    const { data: allWeeklySites, error: weeklyError } = await supabase
      .from('monitored_sites')
      .select('*')
      .eq('is_active', true)
      .eq('monitoring_frequency', 'weekly');

    if (weeklyError) throw weeklyError;

    function getDayForDomain(domain) {
      let hash = 0;
      for (let i = 0; i < domain.length; i++) {
        hash = (hash * 31 + domain.charCodeAt(i)) & 0x7fffffff;
      }
      return hash % 7;
    }

    const weeklySites = (allWeeklySites || []).filter(
      site => getDayForDomain(site.domain) === dayOfWeek
    );

    // Combine the results
    const sites = [...(dailySites || []), ...(weeklySites || [])];

    console.log(`Processing ${sites.length} sites...`);

    const promises = sites.map(site => limit(() => processDomain(site)));
    await Promise.all(promises);
    
    console.log('All sites processed successfully');
  } catch (error) {
    console.error('Error processing sites:', error);
    throw error;
  }
}

// Main execution
processSites()
  .catch(error => {
    console.error('Error in main process:', error);
    process.exit(1);
  });
