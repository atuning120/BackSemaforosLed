const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
require('dotenv').config();

const productsRouter = require('./routes/products');
const adminRouter = require('./routes/admin');
const contactRouter = require('./routes/contact');
const heroRouter = require('./routes/hero');
const settingsRouter = require('./routes/settings');
const { connectRedis } = require('./db/redis');
const { cleanupOrphanImages } = require('./cron/cleanup');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Trust the reverse proxy (Caddy/Nginx) to correctly get the client IP for rate limiting
app.set('trust proxy', 1);

const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : ['*'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
});
app.use('/api', limiter);

// app.use(mongoSanitize()); // Incompatible con Express 5.x por el getter de req.query

app.get('/', (req, res) => {
  res.send('¡Backend funcionando!');
});

app.use('/api/productos', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/contacto', contactRouter);
app.use('/api/hero', heroRouter);
app.use('/api/settings', settingsRouter);

const { initDefaultAdmin } = require('./services/adminService');
const { initializeDefaultHero } = require('./services/heroService');
const { initDefaultSettings } = require('./services/settingsService');

if (require.main === module) {
  connectRedis()
    .then(async () => {
      await initDefaultAdmin();
      await initializeDefaultHero();
      await initDefaultSettings();
      app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);

        // Ejecutar Garbage Collector al inicio (con 5 segs de retraso) y luego cada 24hs
        setTimeout(cleanupOrphanImages, 5000);
        setInterval(cleanupOrphanImages, 24 * 60 * 60 * 1000);
      });
    })
    .catch(async (err) => {
      console.error('Error al conectar con Redis:', err.message);
      // Iniciar el servidor de todos modos por si la base de datos Mongo aún funciona
      await initDefaultAdmin().catch(e => console.error('Error init mongo admin:', e));
      await initializeDefaultHero().catch(e => console.error('Error init mongo hero:', e));
      await initDefaultSettings().catch(e => console.error('Error init mongo settings:', e));
      app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port} (sin Redis)`);

        // Ejecutar Garbage Collector al inicio (con 5 segs de retraso) y luego cada 24hs
        setTimeout(cleanupOrphanImages, 5000);
        setInterval(cleanupOrphanImages, 24 * 60 * 60 * 1000);
      });
    });
}

module.exports = app;
