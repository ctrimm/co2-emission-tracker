import { readFileSync, writeFileSync, existsSync } from 'fs';

// Define the path for the JSON files
const jsonOutputPath = './public/data/sites_to_check.json';
const jsonErrorLogPath = './public/data/error_log.json';

// Function to generate sites to check
function generateSitesToCheck(filePath) {
  const websites = JSON.parse(readFileSync(filePath, 'utf8'));

  for (let website of websites) {
    if (website) {
      // Add the website data to the JSON file
      appendToJson(jsonOutputPath, website.website);
    }
  }
}

// Function to add domain to the JSON file
function appendToJson(filePath, domain) {
  let jsonData = [];

  // Check if the JSON file already exists and has content
  if (existsSync(filePath)) {
    // Read the current data and parse it
    const existingData = readFileSync(filePath, 'utf8');
    jsonData = existingData ? JSON.parse(existingData) : [];
  }

  // Check if the domain already exists in the sites_to_check JSON file
  if (!jsonData.includes(domain)) {
    // Check if the domain exists in the error_log JSON file
    if (existsSync(jsonErrorLogPath)) {
      const errorLogData = readFileSync(jsonErrorLogPath, 'utf8');
      const errorLogJsonData = errorLogData ? JSON.parse(errorLogData) : [];

      // Check if the URL exists in the error log
      if (errorLogJsonData.some(errorLogEntry => errorLogEntry.url === domain)) {
        // If the domain/data exists in the error_log, do not add it to the sites_to_check
        return;
      }
    }

    // Add the new data
    jsonData.push(domain);

    // Write the updated data back to the JSON file
    writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
  }
}

// File path should be passed as a command-line argument
const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a file path containing the JSON blob of domains to check.');
    process.exit(1);
}

generateSitesToCheck(filePath);
