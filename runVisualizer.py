import jsonItemLoader

# Extract the Python code from the JSON
python_code = jsonItemLoader.loadItem('visualizerCode.json','code')

# Execute the Python code
exec(python_code)


print("finished running the visualizer")