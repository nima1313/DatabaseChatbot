const mongoose = require("mongoose");
const fs = require("fs");
const express = require("express");
const { spawn } = require("child_process");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const { exec } = require("child_process");
const giveTime = require("./giveTime");
const { equal } = require("assert");
require('dotenv').config()
const port = 3001;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Replace the following with your MongoDB connection string
const uri = "mongodb://localhost:27017/AiQueryPrototype";

// Database and collection names
const collectionName = "logs";

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post('/process-data', async (req, res) => {
  try {
    await generatePipeline((req.body.query+` \n the date and time right now is: ${giveTime()}.also when I for example tell you give me the data of n days ago, I mean n days ago until n-1 days ago not n days ago till now`));
    await runAggregation();


    let typeOfAnswer = await giveTypeOfAnswer(req.body.query)
    .then((result)=>{
        return result;
    })
    .catch((err)=>{
      res.status(500).send(`Error in typeOfAnswer: ${err}`).end()
      return;
    })
    console.log("variable nefore recheck:",typeOfAnswer); 
    typeOfAnswer = await reCheckTypeOfAnswer(typeOfAnswer)
    .then((value)=>{
      return value;
    });
    console.log("variable after recheck:",typeOfAnswer); 

    // Plot

    if (typeOfAnswer===process.env.WORD_FOR_PLOT){
      const query = await getAiVisualizerQuery()
      .then(
        (value)=>{
          return value;
        }
      );

      spawnPromise('python', ['./generateVisualizer.py',query])
      .then(()=>{
      console.log("pain");

      spawnPromise('python', ['./runVisualizer.py'])
      .then(()=>{
        console.log("are we balling?");
        const imagePath = "../result.png";
        res.json({ imagePath: imagePath, typeOfAnswer: typeOfAnswer }).end();
      });
      
      });
    }

    // Sentence

    else {
      console.log("pain 2")
      const request = await makeRequestOfGenerateSentenceAnswer(req)
      .then((value)=>{
        return value;
      })
      console.log(request)
      const answer = await giveSentenceAnswer(request)
      .then((value) => {
        return value;
      });
      console.log(answer);
      res.json({ asnwerToQuestion: answer, typeOfAnswer: typeOfAnswer }).end();

  }
    
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

async function giveTypeOfAnswer(userQuery) {
  return await new Promise(async(resolve, reject) => {
    const pythonProcess = spawn('python', ['./giveTypeOfAnswer.py', userQuery]);
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
      const output = data.toString().toLowerCase();
      wordForPlot = process.env.WORD_FOR_PLOT;
      wordForSentence = process.env.WORD_FOR_SENTENCE;
      
      // Plot

      if (output.includes(wordForPlot.toLowerCase())) {
        resolve(wordForPlot);
      }

      // Sentence

      else if (output.includes(wordForSentence.toLowerCase())){
        resolve(wordForSentence);
      }

      else {
        reject("Error : the output doesn't contain any of the options");
      }
    });

    await pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    await pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject('Error in triggering pipeline generation');
      }
    });
  });
}

async function generateSentenceAnswer(userQuery){
  return await new Promise(async(resolve, reject) => {
    const pythonProcess = spawn('python', ['./generateSentenceAnswer.py', userQuery]);
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
      const output = data.toString().toLowerCase();
      
      if (output.length != 0) {
        resolve(output);
      }

      else {
        reject("Error : the output is invalid");
      }
    });

    await pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    await pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject('Error in triggering pipeline generation');
      }
    });
  });
}
async function giveSentenceAnswer(userQuery) {
  let newPormise;
  await generateSentenceAnswer(userQuery).then(async ()=>{
    newPormise =  await new Promise((resolve, reject) =>{
      fs.readFile('sentenceAnswer.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the file:', err);
          return;
        }
      
        // Parse the JSON data
        const jsonObject = JSON.parse(data);
      
        // Access the 'answer' property
        const answer = jsonObject.answer;
      
        // Log the answer to the console
        console.log(answer);
        resolve(answer);
      });
    })
  })

  return newPormise;
  
}

async function runAggregation() {
  try {
    const pipeline = await JSON.parse(fs.readFileSync('output.json', 'utf-8'));
    const newPipeline = await convertToISODate(pipeline);
    await mongoose.connect(uri);

    const collection = mongoose.connection.collection(collectionName);
    console.log(newPipeline[0]['$match']);
    const result = await collection.aggregate(newPipeline).toArray();
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
      const imagePath = path.join(__dirname, 'temperature_over_time.png');
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

function generateVisualizerCode(query){
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['./generateVisualizer.py',query]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject('Error in generating AiVisualizer');
      }
    });
    console.log("are we at the end of it?");
  });
}

function runVisualizerCode(){
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['./runVisualizer.py']);

    pythonProcess.stdout.on('data', () => {
      const imagePath = "./result.png";
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

function getAiVisualizerQuery(){
  return new Promise((resolve, reject) =>{
    fs.readFile('output.json', 'utf8', async (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          return;
      }
      
      try {
          // Parse the JSON data
          const jsonArray = JSON.parse(data);
          
          // Check if it's an array
          if (!Array.isArray(jsonArray)) {
              console.error('The file does not contain a JSON array.');
              return;
          }
          
          // Get the first five items or fewer if not available
          console.log(jsonArray.length);
          const newArray = jsonArray.slice(0, Math.min(5, jsonArray.length));
          // console.log(newArray);
          // Concatenate the items into a single string
          const query = JSON.stringify(newArray);
          console.log(query);
          resolve(query);
          // console.log('Concatenated String:', query);
      } catch (error) {
          console.error('Error parsing JSON:', error);
      }
  });
  })
  
}

function spawnPromise(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    process.on('close', (code) => {
      if (code !== 0) {
        // reject(new Error(`Process exited with code ${code}`));
      } else {
        resolve();
      }
    });
    process.on('error', (err) => {
      // reject(err);
    });
  }); 
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});


async function reCheckTypeOfAnswer(typeOfAnswer){
  
  return new Promise((resolve, reject) => {
    
  fs.readFile('output.json', 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Check the length of the JSON data as a string
    console.log(`data length is ${data.length}`);
    if (data.length > 500) {
        typeOfAnswer = process.env.WORD_FOR_PLOT;
    }
    resolve(typeOfAnswer);
})
  }); 
};



async function makeRequestOfGenerateSentenceAnswer(req){
  
  return new Promise((resolve, reject) => {
    fs.readFile('output.json', 'utf8', async (err, data) => {
      if (err) {
          console.error('Error reading file:', err);
          return;
      }
  
      resolve(`question : ${req.body.query} \n answer : ${data}`);
    });
  }); 
};

async function convertToISODate(obj) {
  if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = await convertToISODate(obj[i]);
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (key === "$gt" || key === "$gte" || key === "$lt" || key == "$lte") {
                    obj[key] = new Date(obj[key]);
                } else {
                    obj[key] = await convertToISODate(obj[key]);
                }
            }
        }
    }
  return obj;
}