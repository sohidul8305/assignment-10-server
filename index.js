const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// assignment-10
// SOq9BlazKPpRzI8Z
const uri = "mongodb+srv://assignment-10:SOq9BlazKPpRzI8Z@cluster0.hz6ypdj.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


app.get('/', (req, res) => {
  res.send(`Simple CRUD server is running`);
});

async function run() {
  try {
    await client.connect();
    const db = client.db('assignment-10')
    const studyCollection = db.collection('study')

    app.get('/study', async(req, res) => {
      const result  = await
      studyCollection.find().toArray()
      res.send(result)
    })
    await client.db('admin').command({ ping: 1 });
    console.log(" Ping successful! Successfully connected to MongoDB.");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
  } finally {
  
  }
}

app.get('/study/:id', async(req, res) => {
  const {id} = req.params
    console.log(id)
    const objectId = new ObjectId(id)
const result = await 
  studyCollection.findOne({_id: ObjectId})
    res.send({
      success: true,
      result 
    })
})


run().catch(console.dir);


app.listen(port, () => {
  console.log(`Simple CRUD Server is running on port ${port}`);
});
