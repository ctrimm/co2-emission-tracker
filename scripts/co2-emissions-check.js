import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { hosting, co2 } from '@tgwf/co2';
import puppeteer from 'puppeteer';

// Initialize the CO2 estimation library
const co2Emission = new co2();

// Method to get page size
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
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
    const isGreen = await hosting.check(domain, "myGreenWebApp");
    console.log(`${domain} is green hosted: ${isGreen}`);
    return isGreen;
  } catch (error) {
    console.error(`Error checking green hosting for ${domain}: ${error}`);
    return false;
  }
}

// Estimate CO2 emissions for a given number of bytes and hosting type
function estimateEmissions(bytes, isGreen) {
  return co2Emission.perByte(bytes, isGreen).toFixed(3);
}

// Append data to the CSV file
function appendToCSV(filePath, data) {
  const currentDate = getCurrentDate();
  const csvContent = `${currentDate},${data.domain},${data.isGreen},${data.totalBytes},${data.estimatedCO2}\n`;
  appendFileSync(filePath, csvContent, 'utf8');
}

// Process each domain from the file
async function processDomains(filePath) {
  const outputCSV = 'data/emissions_results.csv'; // Adjust this path as needed

  // Check if the CSV file exists; if not, create it with headers
  if (!existsSync(outputCSV)) {
    writeFileSync(outputCSV, 'Date,Domain,IsGreen,EstimatedCO2Grams\n', 'utf8');
  }

  const data = readFileSync(filePath, 'utf8');
  const domains = data.split(/\r?\n/);

  for (let domain of domains) {
    if (domain) {
      const isGreen = await checkGreenHosting(domain);
      const totalBytes = await getPageDataSize(`http://${domain}`);
      const estimatedCO2 = estimateEmissions(totalBytes, isGreen);
      appendToCSV(outputCSV, { domain, isGreen, totalBytes, estimatedCO2 });
    }
  }
}

// File path should be passed as a command-line argument
const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path containing URLs');
  process.exit(1);
}

processDomains(filePath);
