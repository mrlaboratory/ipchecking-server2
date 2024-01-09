const { MongoClient } = require('mongodb');
require('dotenv').config()
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_Claster}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
(async () => { await client.connect(); })()
const database = client.db('data');
module.exports = database;