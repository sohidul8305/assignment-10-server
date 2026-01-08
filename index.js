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
    // await client.connect();
    console.log("MongoDB Connected");

    const db = client.db(process.env.DB_NAME);
    const studyCollection = db.collection("study");
    const requestCollection = db.collection("partnerRequests");
    const itemsCollection = db.collection("items");


    // ==============================
    // GET STUDY (ALL or BY EMAIL)
    // ==============================
    app.get("/study", async (req, res) => {
      const email = req.query.email;

      const query = email ? { email } : {};
      const list = await studyCollection.find(query).toArray();

      res.json(list);
    });


    // ==============================
// ADD ITEM (NEW COLLECTION)
// ==============================
app.post("/items", async (req, res) => {
  const item = req.body;

  // basic validation
  if (!item.name || !item.category || !item.quantity) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const result = await itemsCollection.insertOne({
    ...item,
    quantity: Number(item.quantity),
    createdAt: new Date(),
  });

  res.json({
    success: true,
    insertedId: result.insertedId,
  });
});


// ==============================
// GET ALL ITEMS
// ==============================
app.get("/items", async (req, res) => {
  const items = await itemsCollection.find().toArray();
  res.json(items);
});


// ==============================
// DELETE ITEM
// ==============================
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const result = await itemsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.json({ deletedCount: result.deletedCount });
});


app.delete("/study/:id", async (req, res) => {
  const result = await studyCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });
  res.json({ deletedCount: result.deletedCount });
});


// GET ALL ITEMS
app.get("/items", async (req, res) => {
  const items = await itemsCollection.find().toArray();
  res.json(items);
});

// ADD ITEM
app.post("/items", async (req, res) => {
  const item = req.body;
  const result = await itemsCollection.insertOne({
    ...item,
    createdAt: new Date(),
  });
  res.json(result);
});

// DELETE ITEM
app.delete("/items/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const result = await itemsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.json({ deletedCount: result.deletedCount });
});




    // ==============================
    // GET STUDY BY ID
    // ==============================
    app.get("/study/:id", async (req, res) => {
      const { id } = req.params;
      if (!ObjectId.isValid(id))
        return res.status(400).json({ message: "Invalid ID" });

      const result = await studyCollection.findOne({ _id: new ObjectId(id) });
      if (!result)
        return res.status(404).json({ message: "Not found" });

      res.json(result);
    });

    // ==============================
    // CREATE STUDY PROFILE
    // ==============================
    app.post("/study", async (req, res) => {
      const data = req.body;

      if (!data.email) {
        return res.status(400).json({ message: "Email is required" });
      }

      if (typeof data.subject === "string") {
        data.subject = data.subject.split(",").map(s => s.trim());
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
 // UPDATE STUDY
app.put("/study/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const result = await studyCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: req.body }
  );

  res.json({ modifiedCount: result.modifiedCount });
});

// DELETE STUDY
// DELETE STUDY (Server Side)
// DELETE STUDY (Server Side)
app.delete("/study/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) { // 1. ID Validation
    return res.status(400).json({ message: "Invalid ID" });
  }

  const result = await studyCollection.deleteOne({ // 2. Delete Operation
    _id: new ObjectId(id),
  });

  // 3. Send Response { deletedCount: 0 or 1 }
  res.json({ deletedCount: result.deletedCount });
});


app.post("/study/:id/incrementCount", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const updateResult = await studyCollection.updateOne(
    { _id: new ObjectId(id) },
    { $inc: { partnerCount: 1 } }
  );

  if (updateResult.modifiedCount === 0) {
    return res.status(404).json({ message: "Partner not found" });
  }

  const updatedPartner = await studyCollection.findOne({
    _id: new ObjectId(id),
  });

  res.json({
    success: true,
    partner: updatedPartner,
  });
});


    // ==============================
    // DELETE PARTNER REQUEST
    // ==============================
    app.delete("/partnerRequests/:id", async (req, res) => {
      const { id } = req.params;

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
