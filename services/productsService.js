const { getDb } = require('../db/mongo');
const { ObjectId } = require('mongodb');
const { redisClient } = require('../db/redis');
const {
  DB_NAME,
  ELECTRONICO_COLLECTION,
  ORDERS_COLLECTION,
} = require('../config/constants');

const PRODUCTS_CACHE_KEY = 'hogarElectronicoProducts';

async function clearProductsCache() {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(PRODUCTS_CACHE_KEY);
      console.log('Caché de productos limpiada');
    }
  } catch (error) {
    console.error('Error limpiando la caché:', error.message);
  }
}

async function getHogarElectronicoProducts(skip = 0, limit = 1000) {
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(PRODUCTS_CACHE_KEY);
      if (cached) {
        console.log('Productos obtenidos desde Redis (caché)');
        const parsed = JSON.parse(cached);
        if (skip === 0 && limit === 1000) {
          return parsed;
        }
        return parsed.slice(skip, skip + limit);
      }
    }
  } catch (error) {
    console.error('Error leyendo de la caché:', error.message);
  }

  console.log('Productos obtenidos desde MongoDB (base de datos)');
  const db = await getDb(DB_NAME);
  const products = await db.collection(ELECTRONICO_COLLECTION).find({}).skip(skip).limit(limit).toArray();

  try {
    if (redisClient.isOpen && skip === 0 && limit === 1000) {
      // Guardamos el resultado en caché por 1 hora
      await redisClient.set(PRODUCTS_CACHE_KEY, JSON.stringify(products), { EX: 3600 });
    }
  } catch (error) {
    console.error('Error guardando en la caché:', error.message);
  }

  return products;
}

async function createHogarElectronicoProduct(product) {
  const db = await getDb(DB_NAME);
  const result = await db.collection(ELECTRONICO_COLLECTION).insertOne(product);
  await clearProductsCache();
  return { ...product, _id: result.insertedId };
}

async function updateHogarElectronicoProductBySku(sku, updates) {
  const db = await getDb(DB_NAME);
  const result = await db
    .collection(ELECTRONICO_COLLECTION)
    .findOneAndUpdate(
      { sku },
      { $set: updates },
      { returnDocument: 'after' }
    );
  if (result) {
    await clearProductsCache();
  }
  return result;
}

async function deleteHogarElectronicoProductBySku(sku) {
  const db = await getDb(DB_NAME);
  const result = await db.collection(ELECTRONICO_COLLECTION).findOneAndDelete({ sku });
  console.log('FINDONEANDDELETE RESULT:', result);
  if (result) {
    await clearProductsCache();
    return result.value !== undefined ? result.value : result;
  }
  return null;
}

async function createAdminOrder(order) {
  const db = await getDb(DB_NAME);
  const result = await db.collection(ORDERS_COLLECTION).insertOne(order);
  return { ...order, _id: result.insertedId };
}

async function listAdminOrders() {
  const db = await getDb(DB_NAME);
  return db
    .collection(ORDERS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

async function updateAdminOrder(orderId, updates) {
  const db = await getDb(DB_NAME);
  try {
    const result = await db.collection(ORDERS_COLLECTION).findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result;
  } catch (error) {
    console.error('Error updating order:', error);
    return null;
  }
}

module.exports = {
  getHogarElectronicoProducts,
  createHogarElectronicoProduct,
  updateHogarElectronicoProductBySku,
  deleteHogarElectronicoProductBySku,
  createAdminOrder,
  listAdminOrders,
  updateAdminOrder,
};
