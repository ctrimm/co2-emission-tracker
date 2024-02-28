import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { hosting, co2 } from '@tgwf/co2';
import puppeteer from 'puppeteer';

// Initialize the CO2 estimation library
const co2Emission = new co2();

// Define the path for the JSON file
const jsonOutputPath = './public/data/emissions_results.json';

const errorLogPath = './public/data/error_log.json';

// Function to log errors to a file
function logErrorToFile(filePath, domain, error) {
  let errorLog = [];

  // Check if the error log file already exists and has content
  if (existsSync(filePath)) {
    // Read the current data and parse it
    const existingData = readFileSync(filePath, 'utf8');
    errorLog = existingData ? JSON.parse(existingData) : [];
  }

  // Add the new error
  errorLog.push({ domain, error: JSON.stringify(error) });

  // Write the updated error log back to the file
  writeFileSync(filePath, JSON.stringify(errorLog, null, 2), 'utf8');
}

// Function to get page size
async function getPageDataSize(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let totalBytes = 0;

  page.on('response', async (response) => {
    const headers = response.headers();
    if (headers['content-length']) {
      totalBytes += parseInt(headers['content-length'], 10);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (error) {
    console.error(`Timeout or navigation error: ${error}`);
  }

  await browser.close();
  return totalBytes;
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
    console.error(`Error checking green hosting for ${domain}: ${error}`);
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
  const outputCSV = 'src/content/emissions_results.csv'; // Current output file path

  // Check if the CSV file exists; if not, create it with headers
  if (!existsSync(outputCSV)) {
    writeFileSync(outputCSV, 'Date,Domain,Name,IsGreen,EstimatedBytes,EstimatedCO2Grams\n', 'utf8');
  }

  // Read / parse the JSON file
  const domains = JSON.parse(readFileSync(filePath, 'utf8'));

  // const data = readFileSync(filePath, 'utf8');
  // const domains = data.split(/\r?\n/);

  for (let domain of domains) {
    try {
      if (domain) {
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
        appendToJson(jsonOutputPath, record);
      }
    } catch (error) {
      console.error(`ERROR PROCESSING DOMAIN: ${domain.website}: ${error}`);
      logErrorToFile(errorLogPath, domain.website, error);
    }
  }
}

// File path should be passed as a command-line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path containing the JSON blob of domains to check.');
  process.exit(1);
}

processDomains(filePath);
