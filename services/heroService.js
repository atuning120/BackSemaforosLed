const { getDb } = require('../db/mongo');
const { ObjectId } = require('mongodb');
const { redisClient } = require('../db/redis');
const { DB_NAME, HERO_COLLECTION } = require('../config/constants');

const HERO_CACHE_KEY = 'heroScreens';

async function clearHeroCache() {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(HERO_CACHE_KEY);
    }
  } catch (error) {
    console.error('Error limpiando caché de hero:', error.message);
  }
}

async function getHeroScreens() {
  try {
    if (redisClient.isOpen) {
      const cached = await redisClient.get(HERO_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error leyendo caché hero:', error.message);
  }

  const db = await getDb(DB_NAME);
  const screens = await db.collection(HERO_COLLECTION).find({}).sort({ order: 1 }).toArray();

  try {
    if (redisClient.isOpen) {
      await redisClient.set(HERO_CACHE_KEY, JSON.stringify(screens), { EX: 3600 });
    }
  } catch (error) {
    console.error('Error guardando caché hero:', error.message);
  }

  return screens;
}

async function createHeroScreen(screen) {
  const db = await getDb(DB_NAME);
  const result = await db.collection(HERO_COLLECTION).insertOne(screen);
  await clearHeroCache();
  return { ...screen, _id: result.insertedId };
}

async function updateHeroScreen(id, updates) {
  const db = await getDb(DB_NAME);
  const result = await db
    .collection(HERO_COLLECTION)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
  if (result) {
    await clearHeroCache();
  }
  return result;
}

async function deleteHeroScreen(id) {
  const db = await getDb(DB_NAME);
  const result = await db.collection(HERO_COLLECTION).findOneAndDelete({ _id: new ObjectId(id) });
  if (result) {
    await clearHeroCache();
    return result.value !== undefined ? result.value : result;
  }
  return null;
}

async function initializeDefaultHero() {
  const db = await getDb(DB_NAME);
  const count = await db.collection(HERO_COLLECTION).countDocuments();
  if (count === 0) {
    const defaultSlides = [
      {
        order: 1,
        badge: "Eficiencia que Ilumina tu Vida",
        badgeClass: "badgeCyan",
        titlePrimary: "TECNOLOGÍA LED",
        titleSecondary: "Y",
        titleHighlight: "SUMINISTROS",
        description: "Soluciones de iluminación eficientes y sustentables, materiales de alto rendimiento y la mejor asesoría técnica para tus proyectos.",
        image: "https://res.cloudinary.com/dse8u2afw/image/upload/v1779914689/image_ec1c48a8_h5uty2.png",
        ctaText: "VER PRODUCTOS",
        ctaAction: "catalog",
        whatsappBadge: true,
      },
      {
        order: 2,
        badge: "Catálogo Digital",
        badgeClass: "badgeEmerald",
        titlePrimary: "CONOCÉ NUESTRA",
        titleSecondary: "TIENDA",
        titleHighlight: "ONLINE",
        description: "Explorá todo nuestro catálogo de productos desde la comodidad de tu casa. Realizá tus compras de forma rápida, segura y con la mejor atención.",
        detailInfo: {
          address: "Envíos y retiros disponibles",
          hours: "Atención web 24/7",
        },
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
        ctaText: "VER CATÁLOGO",
        ctaAction: "catalog",
        whatsappBadge: false,
      },
      {
        order: 3,
        badge: "Envíos a toda Argentina",
        badgeClass: "badgeAmber",
        titlePrimary: "HACEMOS ENVÍOS A",
        titleSecondary: "TODO EL",
        titleHighlight: "PAÍS",
        description: "Despachamos tus pedidos de forma rápida y segura a cualquier punto de la Argentina. Comprá a través de la web y recibilo en la puerta de tu casa o sucursal de correo más cercana.",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop",
        ctaText: "VER OFERTAS",
        ctaAction: "offers",
        whatsappBadge: true,
      },
      {
        order: 4,
        badge: "Mercado Pago & Transferencia",
        badgeClass: "badgeIndigo",
        titlePrimary: "PAGÁ DE LA FORMA",
        titleSecondary: "MÁS SIMPLE Y",
        titleHighlight: "CONVENIENTE",
        description: "Realizá tus compras abonando de manera 100% segura mediante Mercado Pago (todas las tarjetas de crédito y débito) o transferencia bancaria directa.",
        detailInfo: {
          address: "Tarjetas de crédito, débito y dinero en cuenta",
          hours: "Transferencias directas inmediatas en pesos",
        },
        image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1600&auto=format&fit=crop",
        ctaText: "VER PRODUCTOS",
        ctaAction: "catalog",
        whatsappBadge: true,
      }
    ];
    await db.collection(HERO_COLLECTION).insertMany(defaultSlides);
    await clearHeroCache();
  }
}

module.exports = {
  getHeroScreens,
  createHeroScreen,
  updateHeroScreen,
  deleteHeroScreen,
  initializeDefaultHero
};
