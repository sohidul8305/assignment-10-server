const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==============================
// MongoDB Connection
// ==============================
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hz6ypdj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected");

    // ✔ Correct DB and Collections
    const db = client.db(process.env.DB_NAME);
    const studyCollection = db.collection("study");
    const requestCollection = db.collection("partnerRequests");

    // ==============================
    // GET ALL STUDY PROFILES
    // ==============================
    app.get("/study", async (req, res) => {
      const list = await studyCollection.find().toArray();
      res.json(list);
    });

    // ==============================
    // GET STUDY BY ID
    // ==============================
    app.get("/study/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id))
          return res.status(400).json({ message: "Invalid ID" });

        const study = await studyCollection.findOne({ _id: new ObjectId(id) });

        if (!study)
          return res.status(404).json({ message: "Profile not found" });

        res.json(study);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
      }
    });

    // ==============================
    // CREATE STUDY PROFILE
    // ==============================
    app.post("/study", async (req, res) => {
      const data = req.body;

      if (typeof data.subject === "string") {
        data.subject = data.subject.split(",").map((s) => s.trim());
      }

      const result = await studyCollection.insertOne({
        ...data,
        partnerCount: 0,
        createdAt: new Date(),
      });

      res.json({ insertedId: result.insertedId });
    });

    // ==============================
    // UPDATE STUDY PROFILE
    // ==============================
    app.put("/study/:id", async (req, res) => {
      const updated = req.body;

      const result = await studyCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updated }
      );

      res.json({ modifiedCount: result.modifiedCount });
    });

    // ==============================
    // DELETE STUDY PROFILE
    // ==============================
    app.delete("/study/:id", async (req, res) => {
      const result = await studyCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });

      res.json({ deletedCount: result.deletedCount });
    });

    // ==============================
    // GET BY EMAIL
    // ==============================
    app.get("/studyByEmail", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.json([]);

      const result = await studyCollection.find({ email }).toArray();
      res.send(result);
    });

    // ==============================
    // SEND PARTNER REQUEST + INCREMENT partnerCount
    // ==============================
// Increment partnerCount
// Increment partnerCount
app.post("/study/:id/incrementCount", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

    // MongoDB increment operator ব্যবহার করে count +1
    const result = await studyCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { partnerCount: 1 } }, // ✅ increment operator
      { returnDocument: "after" } // updated document ফেরত দেবে
    );

    res.json({ success: true, partner: result.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});






    // ==============================
    // Delete Request
    // ==============================
    app.delete("/partnerRequests/:id", async (req, res) => {
      const id = req.params.id;
      const result = await requestCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.json({ deletedCount: result.deletedCount });
    });

    // ==============================
    // ROOT
    // ==============================
    app.get("/", (req, res) => {
      res.send("Server Running Successfully!");
    });

  } catch (err) {
    console.error("Mongo Error:", err);
  }
}

run();

// Start Server
app.listen(port, () => console.log(`Server running on port ${port}`));
