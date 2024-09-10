# Convert from YYYY-MM-DD to DD-MM-YYYY

import json
from datetime import datetime

# Open the JSON file
with open('public/data/emissions_results-copy.json', 'r') as f:
  data = json.load(f)

# Loop through each item in the data
for item in data:
  # Get the date string in the DD-MM-YYYY format
  date_str = item['date']
  
  # Convert the date string to a datetime object
  date_obj = datetime.strptime(date_str, '%d-%m-%Y')
  
  # Convert the datetime object back to a string in the YYYY-MM-DD format
  new_date_str = date_obj.strftime('%Y-%m-%d')
  
  # Update the date in the item
  item['date'] = new_date_str

# Write the updated data back to the JSON file
with open('public/data/emissions_results-copy.json', 'w') as f:
  json.dump(data, f, indent=2)