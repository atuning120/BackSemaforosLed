const express = require('express');
const { getSettingsHandler, updateSettingsHandler } = require('../controllers/settingsController');
const { adminAuth } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', getSettingsHandler);
router.put('/', adminAuth, updateSettingsHandler);

module.exports = router;
