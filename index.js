// index.js
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hz6ypdj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  // await client.connect();
  isConnected = true;
  console.log("MongoDB Connected");
}
    // Root
    app.get("/", (req, res) => res.send("Local Server Running"));
// Run server
async function run() {
  try {
    await connectDB();
    const db = client.db(process.env.DB_NAME);
    const studyCollection = db.collection("study");

    // Add missing requestCount
    await studyCollection.updateMany(
      { requestCount: { $exists: false } },
      { $set: { requestCount: 0 } }
    );



    // Routes

    // Get all studies
    app.get("/study", async (req, res) => {
      try {
        const studies = await studyCollection.find().toArray();
        res.json(studies);
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // Get single study by ID
    app.get("/study/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const study = await studyCollection.findOne({ _id: new ObjectId(id) });
        if (!study) return res.status(404).json({ message: "Not found" });
        res.json(study);
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // Add new study
    app.post("/study", async (req, res) => {
      try {
        const data = req.body;
        if (!data.email) return res.status(400).json({ error: "Email required" });
        const result = await studyCollection.insertOne(data);
        res.json({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // Update study
    app.put("/study/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await studyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: req.body }
        );
        res.json({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // Delete study
    app.delete("/study/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await studyCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true, result });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });



    app.listen(port, () => console.log(`Local Server running on port ${port}`));
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);
