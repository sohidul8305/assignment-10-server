const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hz6ypdj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function run() {
  try {
    // await client.connect();
    console.log("MongoDB Connected");

    const db = client.db(process.env.DB_NAME);
    const studyCollection = db.collection("study");
    const requestCollection = db.collection("partnerRequests");

    /** ===========================
     * Study APIs
     * =========================== */

    app.get("/study", async (req, res) => {
      const list = await studyCollection.find().toArray();
      res.json(list);
    });

    app.get("/study/:id", async (req, res) => {
      const study = await studyCollection.findOne({ _id: new ObjectId(req.params.id) });
      if (!study) return res.status(404).json({ success: false, message: "Profile not found" });
      res.json(study);
    });

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

      res.json({ success: true, insertedId: result.insertedId });
    });

    app.put("/study/:id", async (req, res) => {
      const updatedData = req.body;

      if (updatedData.subject && typeof updatedData.subject === "string") {
        updatedData.subject = updatedData.subject.split(",").map((s) => s.trim());
      }

      const result = await studyCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updatedData }
      );

      res.json({ success: true, modifiedCount: result.modifiedCount });
    });

    app.delete("/study/:id", async (req, res) => {
      const result = await studyCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });

      res.json({ success: result.deletedCount > 0 });
    });

    /** ===========================
     * Partner Request APIs
     * =========================== */

    app.get("/partnerRequests", async (req, res) => {
      const email = req.query.email;

      if (!email)
        return res.status(400).json({ success: false, message: "Email required" });

      const requests = await requestCollection.find({ userEmail: email }).toArray();

      res.json(requests);
    });

    app.delete("/partnerRequests/:id", async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;

      const existing = await requestCollection.findOne({ _id: new ObjectId(id) });

      if (!existing)
        return res.status(404).json({ success: false, message: "Request not found" });

      if (existing.userEmail !== email)
        return res.status(403).json({ success: false, message: "Not allowed" });

      const result = await requestCollection.deleteOne({ _id: new ObjectId(id) });
      res.json({ success: true, deletedCount: result.deletedCount });
    });

  } catch (err) {
    console.error("MongoDB Error:", err);
  }
}

run();


    // CREATE Profile (POST)
    app.post("/study", async (req, res) => {
      const result = await studyCollection.insertOne(req.body);
      res.send(result);
    });

    // GET all profiles
    app.get("/study", async (req, res) => {
      const result = await studyCollection.find().toArray();
      res.send(result);
    });

    // GET profile by email
    app.get("/study/email", async (req, res) => {
      const email = req.query.email;
      const result = await studyCollection.find({ email }).toArray();
      res.send(result);
    });

    // GET Partner Requests
    app.get("/partnerRequests", async (req, res) => {
      const email = req.query.email;
      if (!email)
        return res.status(400).json({ success: false, message: "Email required" });

      const requests = await requestCollection.find({ userEmail: email }).toArray();
      res.json(requests);
    });

    app.get("/", (req, res) => {
      res.send("Server Running Successfully!");
    });

app.listen(port, () => console.log(`Server running on port ${port}`));
app.get('/', (req, res) => {
res.send("Server is running fine")
})
