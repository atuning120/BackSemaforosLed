const {
  getHogarElectronicoProducts,
  createHogarElectronicoProduct,
  updateHogarElectronicoProductBySku,
  deleteHogarElectronicoProductBySku,
  createAdminOrder,
  listAdminOrders,
  updateAdminOrder,
} = require('../services/productsService');
const fs = require('fs');
const path = require('path');
const { createToken, getAdminCredentials } = require('../middleware/adminAuth');

const DEFAULT_CATEGORIES = ['semáforos', 'luminarias', 'cartelería vial'];

const normalizeCategory = (value) => (value || '').trim().toLowerCase();

function normalizeProductPayload(
  payload,
  { allowSku, partial } = { allowSku: true, partial: false }
) {
  const hasKey = (key) => Object.prototype.hasOwnProperty.call(payload, key);
  const result = {};

  if (!partial || hasKey('nombre')) {
    result.nombre = payload.nombre || 'Producto sin nombre';
  }

  if (!partial || hasKey('descripcion')) {
    result.descripcion = payload.descripcion || '';
  }

  if (!partial || hasKey('categoria')) {
    const normalizedCategory = normalizeCategory(payload.categoria || '');
    result.categoria = DEFAULT_CATEGORIES.includes(normalizedCategory)
      ? normalizedCategory
      : DEFAULT_CATEGORIES[0];
  }

  if (!partial || hasKey('moneda')) {
    result.moneda = payload.moneda || 'ARS';
  }

  if (!partial || hasKey('imagen')) {
    result.imagen = payload.imagen || '';
  }

  if (!partial || hasKey('en_oferta')) {
    result.en_oferta = Boolean(payload.en_oferta);
  }

  if (!partial || hasKey('tamano_imagen')) {
    result.tamano_imagen = payload.tamano_imagen || 'default';
  }

  if (!partial || hasKey('destacado')) {
    result.destacado = Boolean(payload.destacado);
  }

  if (!partial || hasKey('porcentaje_oferta') || hasKey('en_oferta')) {
    const percentage = Number(payload.porcentaje_oferta);
    const enOferta = hasKey('en_oferta') ? Boolean(payload.en_oferta) : true;
    result.porcentaje_oferta =
      enOferta && Number.isFinite(percentage) ? percentage : 0;
  }

  if (allowSku) {
    result.sku = payload.sku || '';
  }

  if (payload.id_catalogo !== undefined) {
    result.id_catalogo = payload.id_catalogo;
  }

  return result;
}

function decodeOrderPayload(base64Payload) {
  const decoded = Buffer.from(base64Payload, 'base64').toString('utf-8');
  return JSON.parse(decoded);
}

function extractOrderItems(payload) {
  if (Array.isArray(payload)) {
    return { items: payload, telefono: '' };
  }

  const telefono =
    payload?.telefono || payload?.phone || payload?.cliente?.telefono || '';
  const items = payload?.items || payload?.productos || payload?.cart || [];
  return { items, telefono };
}

const { getSingleAdmin, verifyPassword, updateSingleAdmin } = require('../services/adminService');

async function loginAdmin(req, res) {
  const { username, password: inputPassword } = req.body || {};
  if (!username || !inputPassword) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const adminUser = await getSingleAdmin();
    if (!adminUser || adminUser.username !== username) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const isValid = verifyPassword(inputPassword, adminUser.hash, adminUser.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const { token, expiresAt } = await createToken(username);
    return res.json({ token, expiresAt });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function updateAdminCredentialsHandler(req, res) {
  const { masterPin, username, password } = req.body || {};
  if (!masterPin || !username || !password) {
    return res.status(400).json({ error: 'Faltan datos para actualizar' });
  }

  const expectedPin = process.env.MASTER_PIN || '000000';
  if (masterPin !== expectedPin) {
    return res.status(401).json({ error: 'PIN Maestro incorrecto' });
  }

  try {
    const adminUser = await getSingleAdmin();
    if (!adminUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await updateSingleAdmin(username, password);
    
    // Generar un nuevo token para las nuevas credenciales
    const { token, expiresAt } = await createToken(username);
    return res.json({ success: true, message: 'Credenciales actualizadas', token, expiresAt });
  } catch (error) {
    console.error('Error al actualizar credenciales:', error);
    return res.status(500).json({ error: 'Error al actualizar credenciales' });
  }
}

async function getAdminHogarElectronico(req, res) {
  try {
    const productos = await getHogarElectronicoProducts();
    const sanitized = productos.map(({ precio, ...rest }) => rest);
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
}

async function createAdminHogarElectronico(req, res) {
  const payload = req.body || {};
  if (!payload.sku) {
    return res.status(400).json({ error: 'Missing sku' });
  }

  const product = normalizeProductPayload(payload, { allowSku: true });

  try {
    const created = await createHogarElectronicoProduct(product);
    const { precio, ...sanitized } = created || {};
    return res.status(201).json(sanitized);
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ error: 'Error creating product' });
  }
}

async function updateAdminHogarElectronico(req, res) {
  const { sku } = req.params;
  if (!sku) {
    return res.status(400).json({ error: 'Missing sku parameter' });
  }

  const updates = { ...(req.body || {}) };
  delete updates._id;
  delete updates.sku;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const cleaned = normalizeProductPayload(updates, {
    allowSku: false,
    partial: true,
  });

  try {
    const products = await getHogarElectronicoProducts();
    const existingProduct = products.find(p => p.sku === sku);

    const updated = await updateHogarElectronicoProductBySku(sku, cleaned);
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (existingProduct && existingProduct.imagen !== updated.imagen) {
      if (existingProduct.imagen && existingProduct.imagen.includes('/uploads/')) {
        const filename = existingProduct.imagen.split('/uploads/')[1];
        const filePath = path.join(__dirname, '../uploads', filename);
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') console.error('Error deleting old image:', err);
        });
      }
    }

    const { precio, ...sanitized } = updated || {};
    return res.json(sanitized);
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Error updating product' });
  }
}

async function deleteAdminHogarElectronico(req, res) {
  const { sku } = req.params;
  if (!sku) {
    return res.status(400).json({ error: 'Missing sku parameter' });
  }

  try {
    const deletedProduct = await deleteHogarElectronicoProductBySku(sku);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (deletedProduct.imagen && deletedProduct.imagen.includes('/uploads/')) {
      const filename = deletedProduct.imagen.split('/uploads/')[1];
      const filePath = path.join(__dirname, '../uploads', filename);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') console.error('Error deleting image:', err);
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Error deleting product' });
  }
}

async function createAdminOrderHandler(req, res) {
  const { items = [], notes = '', customer = {}, tax = {} } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }

  const normalizedItems = items
    .map((item) => ({
      sku: item.sku,
      name: item.name || '',
      quantity: Number(item.quantity) || 0,
      price: Number(item.price),
    }))
    .filter(
      (item) =>
        item.sku &&
        item.quantity > 0 &&
        Number.isFinite(item.price) &&
        item.price >= 0
    );

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: 'Items are invalid' });
  }

  const computedTotal = normalizedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const rawTotal = Number(req.body?.total);
  const total =
    Number.isFinite(rawTotal) && rawTotal >= 0 ? rawTotal : computedTotal;

  const normalizedCustomer = {
    nombre: customer?.nombre || '',
    telefono: customer?.telefono || '',
  };

  const taxRate = Number(tax?.rate);
  const normalizedTax = {
    enabled: Boolean(tax?.enabled),
    rate: Number.isFinite(taxRate) ? taxRate : 0,
  };

  const order = {
    items: normalizedItems,
    total,
    notes,
    customer: normalizedCustomer,
    tax: normalizedTax,
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  };

  try {
    const created = await createAdminOrder(order);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Error creating order' });
  }
}

async function resolveAdminOrderPayload(req, res) {
  const { payload } = req.body || {};
  if (!payload) {
    return res.status(400).json({ error: 'Missing payload' });
  }

  let parsed;
  try {
    parsed = decodeOrderPayload(payload);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const { items, telefono } = extractOrderItems(parsed);
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items found in payload' });
  }

  try {
    const products = await getHogarElectronicoProducts();
    const bySku = new Map(products.map((product) => [String(product.sku), product]));
    const byCatalog = new Map(
      products.map((product) => [String(product.id_catalogo), product])
    );

    const resolved = [];
    const notFound = [];

    items.forEach((item) => {
      const id = item?.idproducto ?? item?.sku ?? item?.id;
      const quantity = Number(item?.cantidad ?? item?.quantity ?? 0);
      if (!id || !Number.isFinite(quantity) || quantity <= 0) return;

      const product = bySku.get(String(id)) || byCatalog.get(String(id));
      if (!product) {
        notFound.push(id);
        return;
      }

      resolved.push({
        sku: product.sku,
        nombre: product.nombre || '',
        cantidad: quantity,
        moneda: product.moneda || 'ARS',
      });
    });

    return res.json({ items: resolved, notFound, telefono });
  } catch (error) {
    console.error('Error resolving order payload:', error);
    return res.status(500).json({ error: 'Error resolving payload' });
  }
}

async function listAdminOrdersHandler(req, res) {
  try {
    const orders = await listAdminOrders();
    return res.json(orders);
  } catch (error) {
    console.error('Error in listAdminOrdersHandler:', error);
    return res.status(500).json({ error: 'Failed to list orders' });
  }
}

async function updateAdminOrderHandler(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!id || !status) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  
  try {
    const updated = await updateAdminOrder(id, { status, updatedAt: new Date().toISOString() });
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.json(updated);
  } catch (error) {
    console.error('Error in updateAdminOrderHandler:', error);
    return res.status(500).json({ error: 'Failed to update order' });
  }
}

module.exports = {
  loginAdmin,
  updateAdminCredentialsHandler,
  getAdminHogarElectronico,
  createAdminHogarElectronico,
  updateAdminHogarElectronico,
  deleteAdminHogarElectronico,
  createAdminOrderHandler,
  resolveAdminOrderPayload,
  listAdminOrdersHandler,
  updateAdminOrderHandler,
};