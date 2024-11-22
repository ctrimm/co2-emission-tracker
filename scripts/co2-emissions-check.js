import { hosting, co2 } from '@tgwf/co2';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    page.on('response', async (response) => {
      const headers = response.headers();
      if (headers['content-length']) {
        totalBytes += parseInt(headers['content-length'], 10);
      }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
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

// Append to CSV (keeping for backward compatibility)
function appendToCSV(filePath, data) {
  const csvContent = `${data.date},${data.domain},${data.name},${data.isGreen},${data.totalBytes},${data.estimatedCO2}\n`;
  writeFileSync(filePath, csvContent, { flag: 'a' });
}

async function processDomain(site) {
  try {
    const isGreen = await checkGreenHosting(site.domain);
    const totalBytes = await getPageDataSize(`http://${site.domain}`);
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
    // Get current day of week (0 = Sunday, 6 = Saturday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Fetch active sites based on monitoring frequency
    const { data: sites, error } = await supabase
      .from('monitored_sites')
      .select('*')
      .eq('is_active', true)
      .or([
        'monitoring_frequency.eq.daily',
        `and(monitoring_frequency.eq.weekly,date_part('dow',now()).eq.${dayOfWeek})`
      ]);

    if (error) {
      throw error;
    }

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
