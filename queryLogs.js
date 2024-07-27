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

app.post('/process-data', async (req, res) => {
  try {
    await generatePipeline(req.body.query);
    await runAggregation();
    const imagePath = await generateImage();
    res.json({imagePath}).end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing data');
  }
});

function generatePipeline(userQuery) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['./script.py', userQuery]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject('Error in triggering pipeline generation');
      }
    });
  });
}

async function runAggregation() {
  try {
    const pipeline = JSON.parse(fs.readFileSync('output.json', 'utf-8'));

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const collection = mongoose.connection.collection(collectionName);
    const result = await collection.aggregate(pipeline).toArray();

    fs.writeFileSync('output.json', JSON.stringify(result, null, 2), 'utf-8');

    return result;
  } catch (err) {
    throw new Error('Error running aggregation');
  } finally {
    await mongoose.disconnect();
  }
}

function generateImage() {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['./visualizer.py']);

    pythonProcess.stdout.on('data', () => {
      const imagePath = path.join(__dirname, 'public', 'temperature_over_time.png');
      resolve(imagePath);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject('Error in generating image');
      }
    });
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
