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

    app.get("/study", async (req, res) => {
      const result = await studyCollection.find().toArray();
      res.send(result);
    });

    app.get("/connections", async (req, res) => {
      const userEmail = req.query.email;
      const connections = await db
        .collection("connections")
        .find({ email: userEmail })
        .toArray();
      res.json(connections);
    });
    app.delete("/connections/:id", async (req, res) => {
  const id = req.params.id;
  const result = await db.collection("connections").deleteOne({ _id: ObjectId(id) });
  res.json(result);
});

    app.get("/study/:id", async (req, res) => {
      try {
        const { id } = req.params;
        console.log("Requested ID:", id);

        const objectId = new ObjectId(id);
        const result = await studyCollection.findOne({ _id: objectId });

        if (!result) {
          return res
            .status(404)
            .send({ success: false, message: "Study partner not found" });
        }

        res.send({ success: true, result });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Invalid ID or server error" });
      }
    });

    app.post("/study", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await studyCollection.insertOne(data);

      res.send({
        success: true,
        result,
      });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(" Ping successful! Connected to MongoDB.");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Simple CRUD server is running");
});

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
