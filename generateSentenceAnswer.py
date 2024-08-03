import sys
from groq import Groq
import os
from dotenv import load_dotenv
import json
load_dotenv()


# The function that gives answer.
def giveAnswer(completion):
    print(completion.encode('utf-8', errors='replace').decode('utf-8'))
    return
    


# Your API key
api_key = os.getenv('GROQ_API_KEY2')

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
            I will provide you with a question and a JSON containing the answer of that question. now answer the question in natural language based on the question and answer, ensuring the response is in Persian.
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
# Check if completion is empty
if not json_content:
    raise ValueError("The completion did not return any content.")

jsonObject = { "answer": json_content }
# print(json_content)
# Define the file path
file_path = "sentenceAnswer.json"

# Write the JSON content to the file, overwriting if it already exists
with open(file_path, "w") as json_file:
    json.dump(jsonObject, json_file)

# print(f"JSON content written to {file_path}")
