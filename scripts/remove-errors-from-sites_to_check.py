import json

# Load sites_to_check.json
with open('./public/data/sites_to_check.json', 'r') as file:
    sites_to_check_file = json.load(file)

# Load Error Log
with open('./public/data/error_log.json', 'r') as file:
    error_log_file = json.load(file)

# Extract URLs from Error Log
urls_to_remove = {item['url'] for item in error_log_file}

# Remove any entries in File A that match the URLs in File B
sites_to_check_modified_file = [item for item in sites_to_check_file if item not in urls_to_remove]

# Save the modified File A to a new file
with open('./public/data/sites_to_check_mod.json', 'w') as file:
    json.dump(sites_to_check_modified_file, file, indent=4)
