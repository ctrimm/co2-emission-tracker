import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { hosting, co2 } from '@tgwf/co2';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit';

// Limit the number of concurrent domain processing operations
const limit = pLimit(10); // Assuming you want to have 10 operations in parallel at most

// Initialize the CO2 estimation library
const co2Emission = new co2();

// Define the path for the JSON files
const jsonEmissionsOutputPath = './public/data/emissions_results.json';
const jsonErrorLogPath = './public/data/error_log.json';
const outputCSV = 'src/content/emissions_results.csv';

// Function to get page size
async function getPageDataSize(url) {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    let totalBytes = 0;

    page.on('response', async (response) => {
      const headers = response.headers();
      if (headers['content-length']) {
        totalBytes += parseInt(headers['content-length'], 10);
      }
    });

    // Timeout is set to 10 seconds
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    return totalBytes;
  } catch (error) {
    // Here, you handle the error, e.g., logging or appending it to a file
    appendToJson(jsonErrorLogPath, { url, type: 'Timeout or navigation error', error: JSON.stringify(error) });
    // It's important to rethrow the error if you want the calling function to be aware of it
    throw error;
  } finally {
    // This block executes regardless of whether an exception occurred or not
    await browser.close();
  }
}

// Gets the current date in DD-MM-YYYY format
function getCurrentDate() {
  const today = new Date();
  return `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
}

// Check if a domain is hosted green
async function checkGreenHosting(domain) {
  try {
    console.log(`Checking green hosting for ${domain}`);
    const result = await hosting.check(domain, "myGreenWebApp");
    return result;
  } catch (error) {
    // Log the error to a file
    appendToJson(jsonErrorLogPath, { domain,  type: 'Error Checking Green Hosting', error: JSON.stringify(error) });
    // console.error(`Error checking green hosting for ${domain}: ${error}`);
    return false;
  }
}

// Estimate CO2 emissions for a given number of bytes and hosting type
function estimateEmissions(bytes, isGreen) {
  return parseFloat(co2Emission.perByte(bytes, isGreen).toFixed(3));
}

// Append data to the CSV file
function appendToCSV(filePath, data) {
  const csvContent = `${data.date},${data.domain},${data.isGreen},${data.totalBytes},${data.estimatedCO2}\n`;
  appendFileSync(filePath, csvContent, 'utf8');
}

// Function to add data to the JSON file
function appendToJson(filePath, data) {
  let jsonData = [];

  // Check if the JSON file already exists and has content
  if (existsSync(filePath)) {
    // Read the current data and parse it
    const existingData = readFileSync(filePath, 'utf8');
    jsonData = existingData ? JSON.parse(existingData) : [];
  }

  // Add the new data
  jsonData.push(data);

  // Write the updated data back to the JSON file
  writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
}

// Process each domain from the file
async function processDomains(filePath) {
  // Check if the CSV file exists; if not, create it with headers
  if (!existsSync(outputCSV)) {
    writeFileSync(outputCSV, 'Date,Domain,Name,IsGreen,EstimatedBytes,EstimatedCO2Grams\n', 'utf8');
  }

  // Read / parse the JSON file
  const domains = JSON.parse(readFileSync(filePath, 'utf8'));
  const promises = [];

  for (const domain of domains) {
    const promise = limit(() => processDomain(domain)); // processDomain would be an async function handling the processing for a single domain
    promises.push(promise);
  }

  // Wait for all the promises to resolve
  await Promise.all(promises);
}

async function processDomain(domain) {
  try {
    const isGreen = await checkGreenHosting(domain.website);
    const totalBytes = await getPageDataSize(`http://${domain.website}`);
    const estimatedCO2 = estimateEmissions(totalBytes, isGreen);
    const record = {
      date: getCurrentDate(),
      domain: domain.website,
      name: domain.name,
      industry: domain.industry,
      domainType: domain.domainType || '',
      agency: domain.agency || '',
      organization: domain.organization || '',
      isGreen,
      estimatedCO2,
      totalBytes
    };
    appendToCSV(outputCSV, record);
    appendToJson(jsonEmissionsOutputPath, record);
  } catch (error) {
    console.error(`Error processing domain ${domain.website}: ${error}`);
    appendToJson(jsonErrorLogPath, {url: domain.website, error: JSON.stringify(error)});
  }
}

// File path should be passed as a command-line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path containing the JSON blob of domains to check.');
  process.exit(1);
}

processDomains(filePath);
