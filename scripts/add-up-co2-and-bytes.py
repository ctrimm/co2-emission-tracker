import json

# Load the JSON data from a file
with open('./public/data/emissions_results.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Check if data is correctly parsed as a list of dictionaries
if not all(isinstance(item, dict) for item in data):
    raise ValueError("Data is not formatted as expected: Not all entries are dictionaries.")

# Initialize the sum variables
total_estimatedCO2 = 0
total_totalBytes = 0

# Iterate through each object in the data and sum up the values
for item in data:
    # Ensuring that each item is a dictionary before attempting to access its values
    if isinstance(item, dict):
        total_estimatedCO2 += item.get("estimatedCO2", 0)
        total_totalBytes += item.get("totalBytes", 0)
    else:
        print("Skipping an item that is not a dictionary:", item)


# Calculate the equivalent values
total_estimatedCO2_kg = total_estimatedCO2 / 1000  # Convert grams to kilograms

# Source = https://www.co2everything.com/ + ChatGPT
total_megabytes = total_totalBytes / 1048576  # Convert bytes to megabytes
total_cups_of_coffee = total_estimatedCO2_kg / 0.021  # Convert CO2 to equivalent cups of coffee (1 cup = 0.31 kg CO2)
total_distance_driven_mi = total_estimatedCO2_kg / 0.404  # Convert CO2 emissions into equivalent distance in miles (1 mile = 0.404 kg CO2)
total_distance_driven_km = total_distance_driven_mi * 1.60934   # Convert CO2 to equivalent distance driven in KM (1 km = 0.636 kg CO2)

print("Total estimated CO2 in grams:", total_estimatedCO2)
print("Total estimated CO2 in Kilos:", total_estimatedCO2_kg)
print("Total bytes:", total_totalBytes)
print("Total megabytes:", total_megabytes)
print("Equivalent cups of coffee:", total_cups_of_coffee)
print("Miles driven:", total_distance_driven_mi)
print("Kilometers driven:", total_distance_driven_km)
