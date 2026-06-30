const {
  getHeroScreens,
  createHeroScreen,
  updateHeroScreen,
  deleteHeroScreen,
} = require('../services/heroService');
const fs = require('fs');
const path = require('path');

async function getHeroScreensHandler(req, res) {
  try {
    const screens = await getHeroScreens();
    res.json(screens);
  } catch (error) {
    console.error('Error fetching hero screens:', error);
    res.status(500).json({ error: 'Error fetching hero screens' });
  }
}

async function createHeroScreenHandler(req, res) {
  try {
    const payload = req.body || {};
    const created = await createHeroScreen(payload);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating hero screen:', error);
    res.status(500).json({ error: 'Error creating hero screen' });
  }
}

async function updateHeroScreenHandler(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...(req.body || {}) };
    delete updates._id;

    const oldScreens = await getHeroScreens();
    const oldScreen = oldScreens.find(s => s._id && s._id.toString() === id);

    const updated = await updateHeroScreen(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Hero screen not found' });
    }
    
    // Cleanup old image if changed
    if (oldScreen && oldScreen.image && updates.image && oldScreen.image !== updates.image) {
      if (oldScreen.image.includes('/uploads/')) {
        const filename = oldScreen.image.split('/uploads/')[1];
        const filePath = path.join(__dirname, '../uploads', filename);
        fs.unlink(filePath, (err) => {
           if (err && err.code !== 'ENOENT') console.error('Error deleting image:', err);
        });
      }
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating hero screen:', error);
    res.status(500).json({ error: 'Error updating hero screen' });
  }
}

async function deleteHeroScreenHandler(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deleteHeroScreen(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Hero screen not found' });
    }
    
    // Cleanup image
    const url = deleted.image;
    if (url && url.includes('/uploads/')) {
      const filename = url.split('/uploads/')[1];
      const filePath = path.join(__dirname, '../uploads', filename);
      fs.unlink(filePath, (err) => {
         if (err && err.code !== 'ENOENT') console.error('Error deleting image:', err);
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting hero screen:', error);
    res.status(500).json({ error: 'Error deleting hero screen' });
  }
}

module.exports = {
  getHeroScreensHandler,
  createHeroScreenHandler,
  updateHeroScreenHandler,
  deleteHeroScreenHandler,
};
