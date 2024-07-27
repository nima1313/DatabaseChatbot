import json
import pandas as pd
import matplotlib.pyplot as plt

# Load JSON data from the file
file_path = './output.json'
with open(file_path, 'r') as file:
    data = json.load(file)

# Convert JSON data to DataFrame
df = pd.DataFrame(data)


# Convert 'time' column to datetime
df['time'] = pd.to_datetime(df['time'])

# Plot the data
plt.figure(figsize=(10, 6))
plt.plot(df['time'], df['temperature'], marker='o', linestyle='-')
plt.title('Temperature Over Time')
plt.xlabel('Time')
plt.ylabel('Temperature (°C)')
plt.grid(True)
plt.xticks(rotation=45)
plt.tight_layout()

# Save the plot as an image
image_path = './temperature_over_time.png'
plt.savefig(image_path)

print("Image generation complete")  #do not remove this. somehow the image generation gets stuck without this xD.
