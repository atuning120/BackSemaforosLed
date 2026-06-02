const { MongoClient } = require('mongodb');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI in environment.');
}

const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 60000,
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
});
let clientPromise;

function getClient() {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb(dbName) {
  const mongo = await getClient();
  return mongo.db(dbName);
}

module.exports = {
  getDb,
};
