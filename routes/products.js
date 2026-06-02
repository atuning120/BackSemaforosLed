const express = require('express');
const { getHogarElectronico } = require('../controllers/productsController');

const router = express.Router();

router.get('/hogar/electronico', getHogarElectronico);

module.exports = router;
