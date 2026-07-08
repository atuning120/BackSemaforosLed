const { getDb } = require('../db/mongo');

const SETTINGS_ID = 'global_settings';

async function getSettingsCollection() {
  const db = await getDb(process.env.DB_NAME || 'faros_db');
  return db.collection('settings');
}

async function getSettings() {
  const collection = await getSettingsCollection();
  const settings = await collection.findOne({ _id: SETTINGS_ID });
  
  if (!settings) {
    return {
      storeAddressName: process.env.VITE_STORE_ADDRESS || 'Maipú 942 Este, San Juan, Argentina',
      storeAddressMapUrl: 'https://maps.google.com/maps?q=-31.5402377,-68.5173167&hl=es&z=16&output=embed'
    };
  }

  return {
    storeAddressName: settings.storeAddressName || process.env.VITE_STORE_ADDRESS || 'Maipú 942 Este, San Juan, Argentina',
    storeAddressMapUrl: settings.storeAddressMapUrl || 'https://maps.google.com/maps?q=-31.5402377,-68.5173167&hl=es&z=16&output=embed'
  };
}

async function updateSettings(newSettings) {
  const collection = await getSettingsCollection();
  
  const updateDoc = {
    $set: {
      storeAddressName: newSettings.storeAddressName,
      storeAddressMapUrl: newSettings.storeAddressMapUrl,
      updatedAt: new Date()
    }
  };

  await collection.updateOne(
    { _id: SETTINGS_ID },
    updateDoc,
    { upsert: true }
  );

  return getSettings();
}

async function initDefaultSettings() {
  const collection = await getSettingsCollection();
  const existing = await collection.findOne({ _id: SETTINGS_ID });

  if (!existing) {
    await collection.insertOne({
      _id: SETTINGS_ID,
      storeAddressName: process.env.VITE_STORE_ADDRESS || 'Maipú 942 Este, San Juan, Argentina',
      storeAddressMapUrl: 'https://maps.google.com/maps?q=-31.5402377,-68.5173167&hl=es&z=16&output=embed',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Default settings initialized');
  }
}

module.exports = {
  getSettings,
  updateSettings,
  initDefaultSettings
};
