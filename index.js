const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3000
const base_url = process.env.BASE_URL || 'http://localhost:3000'
const app = express()
require('dotenv').config()
const morgan = require('morgan')


const database = require('./utils/dbconnect');
const ipCollection = database.collection('ip')
const settingsCollection = database.collection('settings')


app.use(cors({
  origin: ['https://ipchecking-61fd2.web.app', 'https://ipchecking.vercel.app', 'http://localhost:5173','https://app.searchesforu.com', 'https://api.searchesforu.com'  ],
  credentials: true,
}));



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const verifyPassword = require('./middleware/verifyPassword.middleware');


app.use(express.json())
app.use(morgan('dev'))
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // Set timeout to 10 minutes
  next();
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_Claster}/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    client.connect();



    app.post('/settings', verifyPassword, async (req, res) => {
      try {
        const { duration, html } = req.body;
        const existingSettings = await settingsCollection.findOne({});
        if (existingSettings) {
          await settingsCollection.updateOne({}, { $set: { duration, html } });
        } else {
          await settingsCollection.insertOne({ duration, html });
        }
        res.json({ success: true, message: 'Settings updated successfully' });
      } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      } finally {
        await client.close();
      }
    });

    app.get('/settings', async (req, res) => {
      try {
        const existingSettings = await settingsCollection.findOne({});

        if (existingSettings) {
          res.json(existingSettings);
        } else {
          res.status(404).json({ success: false, message: 'Settings not found' });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    });


    app.post('/ipcheck', async (req, res) => {
      try {
        const ipInfo = req.body;
        console.log(ipInfo);
        const settings = await settingsCollection.findOne({});
        ipInfo.duration=settings?.duration || 50000
        if (!ipInfo.ip) {
          return res.status(400).send({ error: 'IP parameter is required' });
        }

        const query = { ip: ipInfo.ip };
        const existingIp = await ipCollection.findOne(query);
        if (!existingIp || isDurationExpired(existingIp?.timestamp, existingIp?.duration)) {
          console.log(isDurationExpired(existingIp?.timestamp, existingIp?.duration));
          const currentTime = new Date();
          ipInfo.timestamp = currentTime;

          // If IP is found and the duration has expired, update the timestamp
          if (existingIp) {
            await ipCollection.updateOne(query, { $set: { timestamp: currentTime } });
          } else {
            // If IP is not found, insert the new IP information
            await ipCollection.insertOne(ipInfo);
          }

          res.send({ allow: true, message: 'IP allowed' });
        } else {

          res.send({ allow: false, message: 'IP blocked' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });

    // Helper function to check if the duration has expired
    const isDurationExpired = (timestamp, duration) => {
      if (!timestamp || !duration) {
        return true; // Treat as expired if timestamp or duration is not provided
      }

      const currentTime = new Date();
      const elapsedTime = currentTime - new Date(timestamp);

      return elapsedTime > duration;
    };





    app.get('/getallip', async (req, res) => {
      try {
        const allIpData = await ipCollection
          .find({})
          .sort({ timestamp: -1 }) // Sort in descending order based on timestamp
          .limit(100) // Limit the results to the last 100 IPs
          .toArray();
        // Reverse the order of the IPs
        const reversedIpData = allIpData.reverse();

        res.send(reversedIpData);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });




    const { ObjectId } = require('mongodb');

    app.delete('/deleteip/:id', async (req, res) => {
      try {
        const ipId = req.params.id;

        if (!ObjectId.isValid(ipId)) {
          return res.status(400).send({ error: 'Invalid ID format' });
        }

        const query = { _id: ObjectId(ipId) };
        const result = await ipCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          res.send({ message: 'No matching IP found for deletion' });
        } else {
          res.send({ message: 'IP deleted successfully' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });


    app.delete('/deleteallip', verifyPassword, async (req, res) => {
      try {
        const result = await ipCollection.deleteMany({});
        res.send({ message: `${result.deletedCount} IPs deleted successfully` });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });



    app.get('/datacount', async (req, res) => {
      try {
        const dataCount = await ipCollection.countDocuments();
        res.send({ count: dataCount });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error' });
      }
    });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('ip-blocking server is running')
})

app.listen(port, () => {
  console.log(`ip-blocking server is running on ${port}`)
})

