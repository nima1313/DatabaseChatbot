const mongoose = require('mongoose');
const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;


// Replace the following with your MongoDB connection string
const uri = "mongodb://localhost:27017/testProjectDatabase";

// Read the JSON file containing the aggregation pipeline
const pipeline = JSON.parse(fs.readFileSync('output.json', 'utf-8'));

// Database and collection names
const collectionName = "logsDatabase";

async function run() {
    try {
        // Connect to the MongoDB cluster
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        // Access the collection
        const collection = mongoose.connection.collection(collectionName);

        // Run the aggregation pipeline
        const result = await collection.aggregate(pipeline).toArray();

        // Output the result
        console.log(result);

    } catch (err) {
        console.error(err);
    } finally {
        // Close the connection
        await mongoose.disconnect();
    }
}

// Execute the function
run().catch(console.dir);
