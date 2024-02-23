import { appendFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { hosting, co2 } from '@tgwf/co2';

const co2Emission = new co2();

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

function estimateEmissions(bytes, isGreen) {
  return co2Emission.perByte(bytes, isGreen).toFixed(3);
}

function appendToCSV(filePath, data) {
  const csvContent = `${data.domain},${data.isGreen},${data.estimatedCO2}\n`;
  appendFileSync(filePath, csvContent, 'utf8');
}

async function processDomains(filePath) {
  const outputCSV = 'co2_emissions_results.csv';

  // Check if the CSV file exists; if not, create it with headers
  if (!existsSync(outputCSV)) {
    writeFileSync(outputCSV, 'Domain,IsGreen,EstimatedCO2Grams\n', 'utf8');
  }

  const data = readFileSync(filePath, 'utf8');
  const domains = data.split(/\r?\n/);

  for (let domain of domains) {
    if (domain) {
      const isGreen = await checkGreenHosting(domain);
      const exampleBytes = 1000 * 1000 * 1000; // 1GB expressed in bytes
      const estimatedCO2 = estimateEmissions(exampleBytes, isGreen);
      console.log(`Domain: ${domain}, Green: ${isGreen}, CO2: ${estimatedCO2} grams`);

      // Append the results to the CSV
      appendToCSV(outputCSV, { domain, isGreen, estimatedCO2 });
    }
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Please provide a file path containing URLs');
  process.exit(1);
}

processDomains(filePath);
