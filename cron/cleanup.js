const fs = require('fs');
const path = require('path');
const { getHogarElectronicoProducts } = require('../services/productsService');
const { getHeroScreens } = require('../services/heroService');

const uploadDir = path.join(__dirname, '../uploads');

async function cleanupOrphanImages() {
  try {
    if (!fs.existsSync(uploadDir)) return;

    // Obtener todos los productos y hero screens de la base de datos
    const products = await getHogarElectronicoProducts();
    const heroScreens = await getHeroScreens();

    // Extraer todos los nombres de archivos de imagen utilizados
    const usedImages = new Set();

    for (const p of products) {
      if (p.imagen && p.imagen.includes('/uploads/')) {
        usedImages.add(p.imagen.split('/uploads/')[1]);
      }
      if (Array.isArray(p.imagenes)) {
        for (const img of p.imagenes) {
          if (img && img.includes('/uploads/')) {
            usedImages.add(img.split('/uploads/')[1]);
          }
        }
      }
    }

    for (const s of heroScreens) {
      if (s.image && s.image.includes('/uploads/')) {
        usedImages.add(s.image.split('/uploads/')[1]);
      }
    }

    // Leer todos los archivos en el directorio de uploads
    const files = await fs.promises.readdir(uploadDir);

    let deletedCount = 0;
    for (const file of files) {
      // No eliminar .gitkeep si existe
      if (file === '.gitkeep') continue;

      if (!usedImages.has(file)) {
        const filePath = path.join(uploadDir, file);
        await fs.promises.unlink(filePath).catch(() => { });
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`[Garbage Collector] Limpieza de almacenamiento completada. ${deletedCount} imágenes huérfanas eliminadas.`);
    }
  } catch (err) {
    console.error('[Garbage Collector] Error durante la limpieza de imágenes:', err);
  }
}

module.exports = { cleanupOrphanImages };
