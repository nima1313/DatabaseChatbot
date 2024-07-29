import sys
from groq import Groq
import os
import json
import jsonLoader
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
            Create an aggregation pipeline for MongoDB based on the following log schema and example. Only return a valid JSON file with the pipeline. Do not include any descriptive sentences, explanations, or additional text.
            Log Schema:
{
  "id": "Joi.string().guid({ version: 'uuidv4' }).required()",
  "time": "Joi.date().iso().required()",
  "temperature": "Joi.number().required()",
  "sensorID": "Joi.string().guid({ version: 'uuidv4' }).required()"
}
Example Pipeline:

[
  {"$match":{"time":{"$gte":"2024-07-23T00:00:00.000Z","$lt":"2024-07-24T00:00:00.000Z"}}},
  {"$group":{"_id":null,"avgTemperature":{"$avg":"$temperature"}}}
]
Instructions:

Return only the JSON file with the generated pipeline.
Ensure the JSON is properly formatted."

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


print(json_content)
# Check if json_content is empty
if not json_content:
    raise ValueError("The completion did not return any content.")

# Validate JSON content
try:
    json_data = json.loads(json_content)
except json.JSONDecodeError:
    raise ValueError("The completion returned invalid JSON content.")

# Define the file path
file_path = "output.json"

# Write the JSON content to the file, overwriting if it already exists
with open(file_path, "w") as json_file:
    json.dump(json_data, json_file)

print(f"JSON content written to {file_path}")
