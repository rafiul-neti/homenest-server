const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 2000;

app.use(cors());
app.use(express.json());

const serviceAccount = require("./assignment-10-adminKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Password}@cluster0.k2ynr4f.mongodb.net/?appName=Cluster0`;

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

    const database = client.db("homenest");
    const propertyColl = database.collection("all-properties");
    const ratingColl = database.collection("ratings");
    const agentColl = database.collection("agents");
    const userColl = database.collection("users");

    // property related api's
    app.get("/all-properties", async (req, res) => {
      const sort_order = req.query.sort;

      const projectFields = {
        _id: 1,
        "property-name": 1,
        "about-property": 1,
        price: 1,
        location: 1,
        category: 1,
        thumbnail: 1,
        "posted-by": 1,
      };

      const sort = {};
      if (sort_order) {
        sort.price = sort_order;
      }

      const cursor = propertyColl.find().sort(sort).project(projectFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/latest-properties", async (req, res) => {
      const projectFields = {
        _id: 1,
        "property-name": 1,
        "about-property": 1,
        price: 1,
        location: 1,
        category: 1,
        thumbnail: 1,
        "posted-by": 1,
      };
      const cursor = propertyColl
        .find()
        .sort({ "posted-date": -1 })
        .limit(6)
        .project(projectFields);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/property/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyColl.findOne(query);
      res.send(result);
    });

    app.get("/my-properties", async (req, res) => {
      const email = req.query.email;

      const query = {};
      if (email) {
        query["poster-email"] = email;
      }

      const cursor = propertyColl.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });

    app.get("/search", async (req, res) => {
      const searched_text = req.query.search;
      const result = await propertyColl
        .find({ "property-name": { $regex: searched_text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    app.post("/add-property", async (req, res) => {
      const newProperty = req.body;
      const result = await propertyColl.insertOne(newProperty);
      res.send(result);
    });

    app.patch("/update-property/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProperty = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: updatedProperty };
      const result = await propertyColl.updateOne(query, update);
      res.send(result);
    });

    app.delete("/my-properties/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyColl.deleteOne(query);
      res.send(result);
    });

    // user related api's
    app.post("/user", async (req, res) => {
      const newUser = req.body;
      const result = await userColl.insertOne(newUser);
      res.send(result);
    });

    // agents related api's
    app.get("/agents", async (req, res) => {
      const cursor = agentColl.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    
    // ratings related api's
    app.get("/ratings", async(req,res)=>{
      const result = await ratingColl.find().toArray()
      res.send(result)
    })

    await client.db("admin").command({ ping: 1 });
    console.log(
      `Pinged your deployment. You successfully connected to MongoDB!`
    );
  } finally {
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is starting on port ${port}`);
});
