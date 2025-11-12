const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://assignment-10:SOq9BlazKPpRzI8Z@cluster0.hz6ypdj.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("assignment-10");
    const studyCollection = db.collection("study");

    console.log("MongoDB connected");

    // 🔹 GET: all studies
    app.get("/study", async (req, res) => {
      try {
        const studies = await studyCollection.find().toArray();
        res.json(studies);
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // 🔹 GET: logged-in user's studies
    app.get("/connections", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.json([]);

        const studies = await studyCollection.find({ email }).toArray();
        res.json(studies);
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // 🔹 POST: create new study profile
    app.post("/study", async (req, res) => {
      try {
        const data = req.body;
        if (!data.email) return res.status(400).json({ error: "Email required" });

        const result = await studyCollection.insertOne(data);
        res.json({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // 🔹 DELETE: remove a study by _id
    app.delete("/connections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await studyCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // 🔹 UPDATE: update a study by _id
    app.put("/connections/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await studyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.json(result);
      } catch (error) {
        console.error(error);
        
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    // 🔹 Simple server test
    app.get("/", (req, res) => {
      res.send("Server is running");
    });

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);
