const { redisClient } = require('../db/redis');

// Fallback in-memory stores if Redis is not available
const memoryStore = new Map();
const captchaStore = new Map();

// Helper para limpiar memoria cada cierto tiempo y evitar leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (value.expiresAt < now) memoryStore.delete(key);
  }
  for (const [key, value] of captchaStore.entries()) {
    if (value.expiresAt < now) captchaStore.delete(key);
  }
}, 60000); // limpiar cada 1 min

async function getFailedAttempts(ip) {
  const key = `admin:login_attempts:${ip}`;
  if (redisClient && redisClient.isOpen) {
    const val = await redisClient.get(key);
    return val ? parseInt(val, 10) : 0;
  }
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return 0;
  }
  return entry.count;
}

async function incrementFailedAttempts(ip) {
  const key = `admin:login_attempts:${ip}`;
  if (redisClient && redisClient.isOpen) {
    const val = await redisClient.incr(key);
    if (val === 1) {
      // 15 minutos (900s)
      await redisClient.expire(key, 900);
    }
    return val;
  }
  
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    const newEntry = { count: 1, expiresAt: Date.now() + 15 * 60 * 1000 };
    memoryStore.set(key, newEntry);
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

async function resetFailedAttempts(ip) {
  const key = `admin:login_attempts:${ip}`;
  if (redisClient && redisClient.isOpen) {
    await redisClient.del(key);
  } else {
    memoryStore.delete(key);
  }
}

async function saveCaptcha(id, answer) {
  const key = `admin:captcha:${id}`;
  if (redisClient && redisClient.isOpen) {
    await redisClient.set(key, answer, { EX: 300 }); // 5 min
  } else {
    captchaStore.set(key, { answer, expiresAt: Date.now() + 300 * 1000 });
  }
}

async function verifyCaptcha(id, answer) {
  const key = `admin:captcha:${id}`;
  let storedAnswer = null;

  if (redisClient && redisClient.isOpen) {
    storedAnswer = await redisClient.get(key);
    if (storedAnswer) await redisClient.del(key); // Usar una sola vez
  } else {
    const entry = captchaStore.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      storedAnswer = entry.answer;
    }
    captchaStore.delete(key);
  }

  return storedAnswer === answer;
}

module.exports = {
  getFailedAttempts,
  incrementFailedAttempts,
  resetFailedAttempts,
  saveCaptcha,
  verifyCaptcha
};
