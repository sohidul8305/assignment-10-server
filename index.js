const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hz6ypdj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1 } });

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected");

    const db = client.db(process.env.DB_NAME);
    const studyCollection = db.collection("study");
    const requestCollection = db.collection("partnerRequests");

    /** ====================
     * Study Collection APIs
     * ==================== */

    // GET all study profiles
    app.get("/study", async (req, res) => {
      try {
        const list = await studyCollection.find().toArray();
        res.json(list);
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch study profiles" });
      }
    });

    // GET single study profile
    app.get("/study/:id", async (req, res) => {
      try {
        const study = await studyCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!study) return res.status(404).json({ success: false, message: "Profile not found" });
        res.json(study);
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch profile" });
      }
    });

    // UPDATE study profile
    app.put("/study/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        // Normalize subject to array
        if (updatedData.subject) {
          if (typeof updatedData.subject === "string") {
            updatedData.subject = updatedData.subject.split(",").map(s => s.trim()).filter(Boolean);
          } else if (!Array.isArray(updatedData.subject)) {
            updatedData.subject = [];
          }
        }

        const result = await studyCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        if (result.modifiedCount > 0) res.json({ success: true });
        else res.json({ success: false, message: "No changes made" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Update failed" });
      }
    });

    // DELETE study profile
    app.delete("/study/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const result = await studyCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount > 0) res.json({ success: true });
        else res.status(404).json({ success: false, message: "Profile not found" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Delete failed" });
      }
    });

    /** ==========================
     * Partner Requests APIs
     * ========================== */

    // CREATE partner request
    app.post("/partnerRequests", async (req, res) => {
      try {
        const data = req.body;
        if (!data.userEmail || !data.receiverId) {
          return res.status(400).json({ success: false, message: "userEmail and receiverId required" });
        }

        await requestCollection.insertOne({
          ...data,
          status: "pending",
          createdAt: new Date()
        });

        // Increment partnerCount in study collection
        await studyCollection.updateOne(
          { _id: new ObjectId(data.receiverId) },
          { $inc: { partnerCount: 1 } }
        );

        res.json({ success: true });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to create request" });
      }
    });

    // GET logged-in user's partner requests
    app.get("/partnerRequests", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const requests = await requestCollection.find({ userEmail: email }).toArray();

        const connections = await Promise.all(
          requests.map(async reqItem => {
            const partner = await studyCollection.findOne({ _id: new ObjectId(reqItem.receiverId) });
            return {
              ...reqItem,
              partnerName: partner?.name || "Unknown",
              partnerImage: partner?.profileimage || partner?.image || "",
              subject: partner?.subject || [],
              studyMode: partner?.studyMode || "",
              availabilityTime: partner?.availabilityTime || "",
              location: partner?.location || "",
              experienceLevel: partner?.experienceLevel || ""
            };
          })
        );

        res.json(connections);
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Failed to fetch requests" });
      }
    });

    // DELETE partner request
    app.delete("/partnerRequests/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const email = req.query.email;
        if (!email) return res.status(400).json({ success: false, message: "Email required" });

        const existing = await requestCollection.findOne({ _id: new ObjectId(id) });
        if (!existing) return res.status(404).json({ success: false, message: "Request not found" });
        if (existing.userEmail !== email) return res.status(403).json({ success: false, message: "Not allowed" });

        const result = await requestCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true, deletedCount: result.deletedCount });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Delete failed" });
      }
    });

    // UPDATE partner request
    app.put("/partnerRequests/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;
        const email = updatedData.userEmail;
        if (!email) return res.status(400).json({ success: false, message: "userEmail required" });

        const existing = await requestCollection.findOne({ _id: new ObjectId(id) });
        if (!existing) return res.status(404).json({ success: false, message: "Request not found" });
        if (existing.userEmail !== email) return res.status(403).json({ success: false, message: "Not allowed" });

        const result = await requestCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );

        res.json({ success: true, modifiedCount: result.modifiedCount });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Update failed" });
      }
    });

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

run();
