const { getDb } = require('../db/mongo');
const crypto = require('crypto');
require('dotenv').config();

const DB_NAME = process.env.MONGODB_DB_NAME || 'ecommerce';
const ADMIN_COLLECTION = 'admin';

async function getAdminCollection() {
  const db = await getDb(DB_NAME);
  return db.collection(ADMIN_COLLECTION);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, hash, salt) {
  const hashVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashVerify;
}

async function getSingleAdmin() {
  const col = await getAdminCollection();
  return col.findOne({});
}

async function createAdmin(username, password) {
  const col = await getAdminCollection();
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  await col.insertOne({ username, hash, salt });
}

async function updateSingleAdmin(newUsername, newPassword) {
  const col = await getAdminCollection();
  const admin = await col.findOne({});
  if (!admin) throw new Error('Admin no encontrado');

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(newPassword, salt);
  await col.updateOne({ _id: admin._id }, { $set: { username: newUsername, hash, salt } });
}

async function initDefaultAdmin() {
  const col = await getAdminCollection();
  const count = await col.countDocuments();
  if (count === 0) {
    const defaultUser = process.env.ADMIN_USER || 'admin';
    const defaultPass = process.env.ADMIN_PASSWORD || 'admin';
    await createAdmin(defaultUser, defaultPass);
    console.log('Default admin created in database.');
  }
}

module.exports = {
  getSingleAdmin,
  updateSingleAdmin,
  verifyPassword,
  initDefaultAdmin,
};
