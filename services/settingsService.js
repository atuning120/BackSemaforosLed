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
      storeAddressMapUrl: 'https://maps.google.com/maps?q=-31.5402377,-68.5173167&hl=es&z=16&output=embed',
      emailCorporativoTitle: 'Email Corporativo',
      emailCorporativo: process.env.VITE_EMAIL || 'ventas@ledclean.ar',
      emailConsultasTitle: 'Consultas y Ayuda',
      emailConsultas: process.env.VITE_CONSULTAS_EMAIL || 'consultas@ledclean.ar',
      whatsappSoporteTitle: 'WhatsApp Soporte',
      whatsappSoporte: process.env.VITE_WHATSAPP_PHONE || '',
      whatsappComercialTitle: 'WhatsApp Comercial',
      whatsappComercial: process.env.VITE_WHATSAPP_SECOND || ''
    };
  }

  return {
    storeAddressName: settings.storeAddressName || process.env.VITE_STORE_ADDRESS || 'Maipú 942 Este, San Juan, Argentina',
    storeAddressMapUrl: settings.storeAddressMapUrl || 'https://maps.google.com/maps?q=-31.5402377,-68.5173167&hl=es&z=16&output=embed',
    emailCorporativoTitle: settings.emailCorporativoTitle || 'Email Corporativo',
    emailCorporativo: settings.emailCorporativo || process.env.VITE_EMAIL || 'ventas@ledclean.ar',
    emailConsultasTitle: settings.emailConsultasTitle || 'Consultas y Ayuda',
    emailConsultas: settings.emailConsultas || process.env.VITE_CONSULTAS_EMAIL || 'consultas@ledclean.ar',
    whatsappSoporteTitle: settings.whatsappSoporteTitle || 'WhatsApp Soporte',
    whatsappSoporte: settings.whatsappSoporte || process.env.VITE_WHATSAPP_PHONE || '',
    whatsappComercialTitle: settings.whatsappComercialTitle || 'WhatsApp Comercial',
    whatsappComercial: settings.whatsappComercial || process.env.VITE_WHATSAPP_SECOND || ''
  };
}

async function updateSettings(newSettings) {
  const collection = await getSettingsCollection();
  
  const updateDoc = {
    $set: {
      storeAddressName: newSettings.storeAddressName,
      storeAddressMapUrl: newSettings.storeAddressMapUrl,
      emailCorporativoTitle: newSettings.emailCorporativoTitle,
      emailCorporativo: newSettings.emailCorporativo,
      emailConsultasTitle: newSettings.emailConsultasTitle,
      emailConsultas: newSettings.emailConsultas,
      whatsappSoporteTitle: newSettings.whatsappSoporteTitle,
      whatsappSoporte: newSettings.whatsappSoporte,
      whatsappComercialTitle: newSettings.whatsappComercialTitle,
      whatsappComercial: newSettings.whatsappComercial,
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
