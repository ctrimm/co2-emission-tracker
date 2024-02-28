import { readFileSync, writeFileSync } from 'fs';

// Define the path for the JSON file
const jsonOutputPath = './public/data/sites_to_check.json';

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

// File path should be passed as a command-line argument
const filePath = process.argv[2];
if (!filePath) {
    console.error('Please provide a file path containing the JSON blob of domains to check.');
    process.exit(1);
}

generateSitesToCheck(filePath);
