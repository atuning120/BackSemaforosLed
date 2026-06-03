const express = require('express');
const { getHeroScreensHandler } = require('../controllers/heroController');

const router = express.Router();

router.get('/', getHeroScreensHandler);

module.exports = router;
