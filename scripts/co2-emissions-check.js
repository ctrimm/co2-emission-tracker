import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { hosting, co2 } from '@tgwf/co2';

// Initialize the CO2 estimation library
const co2Emission = new co2();

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
  const csvContent = `${currentDate},${data.domain},${data.isGreen},${data.estimatedCO2}\n`;
  appendFileSync(filePath, csvContent, 'utf8');
}

// Process each domain from the file
async function processDomains(filePath) {
  const outputCSV = 'emissions_results.csv'; // Adjust this path as needed

  // Check if the CSV file exists; if not, create it with headers
  if (!existsSync(outputCSV)) {
    writeFileSync(outputCSV, 'Date,Domain,IsGreen,EstimatedCO2Grams\n', 'utf8');
  }

  const data = readFileSync(filePath, 'utf8');
  const domains = data.split(/\r?\n/);

  for (let domain of domains) {
    if (domain) {
      const isGreen = await checkGreenHosting(domain);
      // Example bytes value for demonstration; adjust as needed
      const exampleBytes = 1000 * 1000 * 1000; // 1GB in bytes
      const estimatedCO2 = estimateEmissions(exampleBytes, isGreen);
      appendToCSV(outputCSV, { domain, isGreen, estimatedCO2 });
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
