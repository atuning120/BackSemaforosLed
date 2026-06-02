const crypto = require('crypto');
const { getDb } = require('../db/mongo');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 8;

function getAdminCredentials() {
  return {
    secret: process.env.ADMIN_TOKEN_SECRET,
  };
}

function signTokenPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function createToken(username) {
  const { secret } = getAdminCredentials();
  if (!secret) {
    throw new Error('Missing ADMIN_TOKEN_SECRET in environment.');
  }

  const db = await getDb(process.env.MONGODB_DB_NAME || 'ecommerce');
  const admin = await db.collection('admin').findOne({});
  const salt = admin ? admin.salt : '';

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${username}:${expiresAt}`;
  const signature = signTokenPayload(payload, secret + salt);
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return { token, expiresAt };
}

async function verifyToken(token) {
  const { secret } = getAdminCredentials();
  if (!secret) {
    throw new Error('Missing ADMIN_TOKEN_SECRET in environment.');
  }

  let decoded;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf-8');
  } catch (error) {
    return null;
  }

  const parts = decoded.split(':');
  if (parts.length !== 3) return null;
  const [username, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!username || !Number.isFinite(expiresAt)) return null;
  if (Date.now() > expiresAt) return null;

  const db = await getDb(process.env.MONGODB_DB_NAME || 'ecommerce');
  const admin = await db.collection('admin').findOne({});
  if (!admin || admin.username !== username) return null;

  const salt = admin.salt || '';
  const payload = `${username}:${expiresAt}`;
  const expected = signTokenPayload(payload, secret + salt);
  const expectedBuffer = Buffer.from(expected, 'utf-8');
  const signatureBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  return username;
}

async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const username = await verifyToken(token);
    if (!username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.adminUser = username;
    return next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Auth configuration error' });
  }
}

module.exports = {
  adminAuth,
  createToken,
  getAdminCredentials,
};