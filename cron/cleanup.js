const fs = require('fs');
const path = require('path');
const { getHogarElectronicoProducts } = require('../services/productsService');

const uploadDir = path.join(__dirname, '../uploads');

async function cleanupOrphanImages() {
  try {
    if (!fs.existsSync(uploadDir)) return;

    // Obtener todos los productos de la base de datos
    const products = await getHogarElectronicoProducts();

    // Extraer todos los nombres de archivos de imagen utilizados
    const usedImages = new Set(
      products
        .filter(p => p.imagen && p.imagen.includes('/uploads/'))
        .map(p => p.imagen.split('/uploads/')[1])
    );

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
