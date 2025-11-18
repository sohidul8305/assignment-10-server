const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.hz6ypdj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1 }
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB Connected");

    const db = client.db(process.env.DB_NAME);
    const studyCollection = db.collection("study");
    const requestCollection = db.collection("partnerRequests");

    // GET ALL STUDY PROFILES
    app.get("/study", async (req, res) => {
      const list = await studyCollection.find().toArray();
      res.json(list);
    });

    // Get connections / partner requests for a user
app.get("/study/connections", async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ message: "Email required" });

  // Find user first
  const userProfile = await studyCollection.findOne({ email });
  if (!userProfile) return res.json([]); // user not found

  // Find requests received by this user
  const requests = await requestCollection
    .find({ receiverId: userProfile._id.toString() })
    .toArray();

  // Map requests to study profiles
  const connections = await Promise.all(
    requests.map(async (reqItem) => {
      const sender = await studyCollection.findOne({
        _id: new ObjectId(reqItem.senderId),
      });
      return sender;
    })
  );

  res.json(connections);
});


    // GET SINGLE PROFILE
    app.get("/study/:id", async (req, res) => {
      const study = await studyCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

      if (!study) return res.status(404).json({ message: "Not found" });
      res.json(study);
    });

    // ----------------------------
    // SEND PARTNER REQUEST + COUNT UPDATE
    // ----------------------------
    app.post("/partnerRequests", async (req, res) => {
      try {
        const { senderId, receiverId } = req.body;

        await requestCollection.insertOne({
          senderId,
          receiverId,
          status: "pending",
          createdAt: new Date(),
        });

        // Increase count in DB
        await studyCollection.updateOne(
          { _id: new ObjectId(receiverId) },
          {
            $inc: { partnerCount: 1 }
          }
        );

        res.json({ message: "Request sent & partner count updated" });
      } catch (err) {
        res.status(500).json({ message: "Error sending request" });
      }
    });

    app.listen(port, () => console.log(`Server running on port ${port}`));
  } finally {}
}

run();
