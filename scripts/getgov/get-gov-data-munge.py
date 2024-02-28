# NOTE - This script is not used in the main application. 
# It is only used to transform the data from the original 
# GET.GOV CSV file into a JSON file that can be used in the
# application. The JSON file is then used to seed the 'database' with the data.

import csv
import re
from io import StringIO
import json

# OPTIONAL METHOD CALL
# Function to format the domain name into a readable format
def format_domain_name(domain_name):
  name = domain_name.split('.')[0]  # Remove the top-level domain
  name = re.sub(r"(\d+)", r" \1", name)  # Add space before any numbers
  name = name.replace('-', ' ').title()  # Replace hyphens with spaces and title-case each word
  return name

# Initialize an empty list to hold the transformed data
transformed_data = []

# Open the CSV file and read data
with open('scripts/getgov/get-gov-data.csv', mode='r', encoding='utf-8') as file:
  reader = csv.DictReader(file)

  for row in reader:
    # Constructing the desired object format for each row
    obj = {
      "website": row["Domain name"],
      "name": row["Domain name"],
      "industry": "Public Sector",
      "domainType": row["Domain type"],
      "agency": row["Agency"],
      "organization": row["Organization name"]
    }
    transformed_data.append(obj)

# At this point, transformed_data contains all the formatted objects
# Now, we'll write the transformed data to a JSON file
output_file_path = 'scripts/getgov/get-gov-munge-output.json'
with open(output_file_path, 'w', encoding='utf-8') as output_file:
  json.dump(transformed_data, output_file, indent=2)

print(f"Data has been written to {output_file_path}")
