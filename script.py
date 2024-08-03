import sys
from groq import Groq
import os
import json
from dotenv import load_dotenv
import re
from datetime import datetime


load_dotenv()

def fix_isodate_in_aggregation(aggregation: str) -> str:
    # Regular expression to find ISODate instances
    iso_date_pattern = re.compile(r'ISODate\("([^"]+)"\)')

    # Function to replace ISODate with the proper string format
    def replace_isodate(match):
        date_str = match.group(1)
        # Convert to datetime object to ensure it's a valid date
        try:
            datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
        except ValueError:
            raise ValueError(f"Invalid ISODate format: {date_str}")
        # Return the date string without ISODate
        return f'"{date_str}"'

    # Replace all ISODate occurrences in the aggregation string
    fixed_aggregation = re.sub(iso_date_pattern, replace_isodate, aggregation)
    
    return fixed_aggregation

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
            Schema :{
  serial: Joi.string().required(),
  data: Joi.string().required().description("this is the temperature"),
  dateTime: Joi.date().required()
}
keep in mind that data is the same as temperature. also if the user asked for graph, it means plot.
Example Pipeline:
    [
  {
    "$match": {
      "dateTime": {
        "$gt": ISODate("2024-07-29T12:40:03.011Z")
      }
    }
  }
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

json_content = fix_isodate_in_aggregation(json_content)
print('json content :',json_content)
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
