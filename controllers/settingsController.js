const { getSettings, updateSettings } = require('../services/settingsService');

async function getSettingsHandler(req, res) {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
}

async function updateSettingsHandler(req, res) {
  try {
    const {
      storeAddressName,
      storeAddressMapUrl,
      emailCorporativoTitle,
      emailCorporativo,
      emailConsultasTitle,
      emailConsultas,
      whatsappSoporteTitle,
      whatsappSoporte,
      whatsappComercialTitle,
      whatsappComercial
    } = req.body;
    
    // Validate inputs - making storeAddress optional or keep it required? Let's keep existing logic.
    if (!storeAddressName || !storeAddressMapUrl) {
      return res.status(400).json({ error: 'Faltan campos requeridos (storeAddressName, storeAddressMapUrl)' });
    }

    const updatedSettings = await updateSettings({
      storeAddressName,
      storeAddressMapUrl,
      emailCorporativoTitle,
      emailCorporativo,
      emailConsultasTitle,
      emailConsultas,
      whatsappSoporteTitle,
      whatsappSoporte,
      whatsappComercialTitle,
      whatsappComercial
    });

    res.json({ message: 'Configuraciones actualizadas', settings: updatedSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Error al actualizar configuraciones' });
  }
}

module.exports = {
  getSettingsHandler,
  updateSettingsHandler
};
