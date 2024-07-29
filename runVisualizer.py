import json

# Load the JSON file
with open('visualizerCode.json', 'r') as file:
    data = json.load(file)

# Extract the Python code from the JSON
python_code = data.get('code', '')

# Execute the Python code
exec(python_code)


print("finished running the visualizer")