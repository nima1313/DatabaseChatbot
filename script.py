import sys
from groq import Groq
import os
import json

# Your API key
api_key = "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"

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
            "content": """Create a model that receives a description and generates an aggregation pipeline for MongoDB. don't say anything. the response should be only a JSON file. I repeat, do not give any sentences back describing the result. just a JSON file. also keep in mind that this is the log schema const logSchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    time: Joi.date().iso().required(),
    temperature: Joi.number().required(),
    sensorID: Joi.string().guid({ version: 'uuidv4' }).required()


    also this is an example : [{"$match":{"time":{"$gte":"2024-07-23T00:00:00.000Z","$lt":"2024-07-24T00:00:00.000Z"}}},{"$group":{"_id":null,"avgTemperature":{"$avg":"$temperature"}}}]
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
