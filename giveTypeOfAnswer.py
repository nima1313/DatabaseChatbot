import sys
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()


# The function gives us the type of preffered answer we want based on the question (plot or sentence)
def giveType(completion:str):
    wordForPlot = "plot"
    wordForSentence = "sentence"

    if wordForPlot.lower() in completion.lower() :
        print(wordForPlot)
        return
    if wordForSentence.lower() in completion.lower():
        print(wordForSentence)
        return
    


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
            I want you to analyze my questions and determine the appropriate response type: either "plot" or "sentence."

Here are a few examples:

"Give me all the logs that have a temperature above 37": "Plot"
"Give me all the logs that have a temperature above 323": "Plot"
"Give me the average temperature of yesterday": "Sentence"
"Give me the average temperature for each hour of yesterday": "Plot"
Guidelines:

Choose "sentence" if the response requires fewer than 3 items.
Choose "plot" if the response involves all data or a significant portion of it.
if you were unsure between sentence and plot, choose plot.

Your response should only contain "sentence" or "plot" without additional descriptions.

Double-check your answer to ensure accuracy.
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

# Check if completion is empty
if not completion:
    raise ValueError("The completion did not return any content.")

giveType(completion)

