const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'hogar';
const COLLECTION_NAME = 'electronico';

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment.');
  process.exit(1);
}

const dataPath = path.resolve(__dirname, '../../productos_hogar.json');

function loadProducts(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array of products.');
  }
  return parsed;
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    const products = loadProducts(dataPath);
    await client.connect();

    const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

    const ops = products.map((product) => ({
      updateOne: {
        filter: { sku: product.sku },
        update: { $set: product },
        upsert: true,
      },
    }));

    if (ops.length === 0) {
      console.log('No products to import.');
      return;
    }

    const result = await collection.bulkWrite(ops, { ordered: false });

    console.log(
      `Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}, Matched: ${result.matchedCount}`
    );
  } finally {
    await client.close();
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
