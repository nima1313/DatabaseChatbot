const mongoose = require("mongoose");
const fs = require("fs");
const express = require("express");
const { spawn } = require("child_process");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const { exec } = require("child_process");
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Replace the following with your MongoDB connection string
const uri = "mongodb://localhost:27017/testProjectDatabase";

// Database and collection names
const collectionName = "logsDatabase";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint to ask for a query and run the Python script
app.post("/generate-pipeline", (req, res) => {
  const userQuery = req.body.query;

  const pythonProcess = spawn("python", ["./script.py", userQuery]); // Ensure the correct path to your Python script

  pythonProcess.stdout.on("data", (data) => {
    console.log(`Python output: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.send(
        "Pipeline generation triggered successfully. You can now run the aggregation."
      );
    } else {
      res.status(500).send("Error in triggering pipeline generation");
    }
  });
});

// Endpoint to run the MongoDB aggregation
app.get("/run-aggregation", async (req, res) => {
  try {
    // Read the JSON file containing the aggregation pipeline
    const pipeline = JSON.parse(fs.readFileSync("output.json", "utf-8"));

    // Connect to the MongoDB cluster
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Access the collection
    const collection = mongoose.connection.collection(collectionName);

    // Run the aggregation pipeline
    const result = await collection.aggregate(pipeline).toArray();

    // Output the result
    console.log(result);

    // Write the result to the JSON file
    fs.writeFileSync("output.json", JSON.stringify(result, null, 2), "utf-8");

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error running aggregation");
  } finally {
    // Close the connection
    await mongoose.disconnect();
  }
});

app.get("/get-image", (req, res) => {
  const pythonProcess = spawn("python", ["./visualizer.py"]); // Ensure the correct path to your Python script

  pythonProcess.stdout.on("data", (data) => {
    const imagePath = path.join(
      __dirname,
      "public",
      "temperature_over_time.png"
    );
    res.sendFile(imagePath);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.send(
        "Pipeline generation triggered successfully. You can now run the aggregation."
      );
    } else {
      res.status(500).send("Error in triggering pipeline generation");
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
