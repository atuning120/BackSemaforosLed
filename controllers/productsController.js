const { getHogarElectronicoProducts } = require('../services/productsService');

async function getHogarElectronico(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const productos = await getHogarElectronicoProducts(skip, limit);
    res.json(productos);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products', details: error.message });
  }
}

module.exports = {
  getHogarElectronico,
};
