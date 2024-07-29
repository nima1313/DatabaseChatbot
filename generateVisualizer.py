import sys
from groq import Groq
import os
import json
import jsonItemLoader
from dotenv import load_dotenv

load_dotenv()

# Your API key
api_key = os.getenv('GROQ_API_KEY')

# Initialize the Groq client with the API key
client = Groq(api_key=api_key)

# Get the user query from the command-line arguments
user_query = sys.argv[1]

# Create a completion request
completion = client.chat.completions.create(
    model="llama-3.1-70b-versatile",
    messages=[
        {
            "role": "system",
            "content": """
            Instructions:
1. Input Details: You will receive a JSON file named output.json containing 1 to 5 objects. Note that the total amount of objects may exceed 5, but only the first 5 objects will be provided to help you understand the schema.
2. Analyze the JSON: Examine the JSON file's structure to understand the objects' schema.
3. Python Code Requirements:
Write a Python code snippet that reads the JSON file output.json.
Use a popular data visualization library, such as Matplotlib or Plotly, to process and visualize the data.
Ensure the code processes the data appropriately and generates a relevant chart or graph based on the data structure. also make it beautiful.
also, there is no need to show that graph but you have to save the image in the same directory with the name "result"


Output:
The only output should be the Python code snippet. no natural language description or anything. just and only just a Python code snippet.
});"""
        },
        {
            "role": "user",
            "content": user_query
        }
    ],
    temperature=1,
    max_tokens=1024,
    top_p=1,
    stream=True,
    stop=None,
)

# Collect the JSON content from the completion
json_content = ""
for chunk in completion:
    chunk_content = chunk.choices[0].delta.content or ""
    json_content += chunk_content

json_content = json_content[10:len(json_content)-3:]
jsonObject = { "code": json_content }
print(json_content)
# Define the file path
file_path = "visualizerCode.json"

# Write the JSON content to the file, overwriting if it already exists
with open(file_path, "w") as json_file:
    json.dump(jsonObject, json_file)

print(f"JSON content written to {file_path}")