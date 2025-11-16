const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config()

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hz6ypdj.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const db = client.db("assignment-10");
    const studyCollection = db.collection("study");

    console.log("MongoDB connected");


    await studyCollection.updateMany(
      { requestCount: { $exists: false } },
      { $set: { requestCount: 0 } }
    );


    app.get("/study", async (req, res) => {
      try {
        const studies = await studyCollection.find().toArray();
        res.json(studies);
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });
    app.get("/connections/:id", async (req, res) => {
  const id = req.params.id;
  const connection = await studyCollection.findOne({ _id: new ObjectId(id) });
  res.send(connection);
});



    app.get("/search", async (req, res) => {
      try {
        const searchTerm = req.query.search || "";
        if (!searchTerm) return res.json([]);

        const keywords = searchTerm.split(",").map((k) => k.trim());

        const regexQueries = keywords.map((k) => ({
          skills: { $elemMatch: { $regex: k, $options: "i" } },
        }));

        const results = await studyCollection.find({ $or: regexQueries }).toArray();
        res.json(results);
      } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Server error" });
      }
    });



    app.put("/partner-request/:id", async (req, res) => {
      try {
        const id = req.params.id;

        const result = await studyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { requestCount: 1 } }
        );

        res.json({ success: true, result });
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

  
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

    app.get("/", (req, res) => {
      res.send("Server is running");
    });

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

run().catch(console.dir);
