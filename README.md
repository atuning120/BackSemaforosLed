# Mini E-Commerce - Backend API (BackMiniArgentina)

Este repositorio contiene la API REST para la plataforma Mini E-Commerce. Está construido utilizando **Node.js** y **Express** con un enfoque en seguridad, rendimiento (implementando caché) y eficiencia en el manejo de imágenes.

---

## 🚀 Funcionalidad General

El backend provee todos los servicios necesarios para el funcionamiento de la tienda online:
- **Gestión del Catálogo:** Permite consultar los productos de manera rápida para los clientes finales (gracias al sistema de caché).
- **Panel Administrativo (CRUD):** Permite al dueño de la tienda crear, modificar y eliminar productos.
- **Manejo de Archivos:** Sube, procesa, comprime y almacena de forma eficiente las imágenes de los productos.
- **Autenticación Administrativa:** Asegura las rutas críticas (como creación o borrado de productos) y permite gestionar las credenciales de ingreso del administrador de forma segura.

---

## 🛠️ Funcionalidades Específicas

1. **Módulo de Productos (`/api/productos/`)**
   - **Listar productos:** Retorna el listado de productos por categoría (ej. `/hogar/electronico`). Las respuestas de lectura son almacenadas en caché para respuestas instantáneas.
   - **Crear/Editar producto:** Recibe la información del producto y una imagen opcional. 
   - **Eliminar producto:** Borra el registro de la base de datos y además elimina su imagen correspondiente del sistema de archivos.

2. **Procesamiento y Optimización de Imágenes**
   - Cuando se sube una nueva imagen a través del panel de administrador, el servidor la intercepta y automáticamente **la convierte a formato WebP**, aplicando compresión para optimizar los tiempos de carga en el frontend.

3. **Mantenimiento Automático (Garbage Collector)**
   - El sistema cuenta con un proceso automático (Cron Job) que se ejecuta al iniciar el servidor y periódicamente (cada 24hs). Su trabajo es escanear la carpeta de imágenes subidas (`/uploads`) y compararlas con los registros de la base de datos para **eliminar de forma segura cualquier imagen "huérfana"** (imágenes que ya no están vinculadas a ningún producto), ahorrando espacio en disco.

4. **Módulo Administrativo y Seguridad (`/api/admin/`)**
   - **Autenticación:** Valida las credenciales del administrador contra la base de datos.
   - **Gestión de Accesos:** Provee flujos seguros para actualizar el usuario y la contraseña del administrador, protegidos por un sistema de validación mediante PIN.
   - **Seguridad Perimetral:** Incorpora *Rate Limiting* para evitar ataques de fuerza bruta, *CORS* estricto basado en variables de entorno, y políticas estrictas en los Headers de HTTP (*Helmet*).

5. **Módulo de Correos y Notificaciones (`/api/contact/`)**
   - **Procesamiento de Formularios:** Recibe y procesa las solicitudes del formulario de contacto integrado en el frontend.
   - **Envío Automatizado:** Utiliza el servicio SMTP (vía Nodemailer) para despachar los mensajes al correo configurado del administrador, aplicando ajustes de zona horaria local (Argentina) en las plantillas enviadas.

---

## 💻 Tecnologías y Herramientas Usadas

- **Node.js & Express (v5):** Entorno de ejecución y framework principal para el manejo de rutas y middlewares.
- **Multer:** Middleware para la manipulación de peticiones `multipart/form-data` (recepción de las imágenes subidas).
- **Sharp:** Biblioteca de alto rendimiento para el procesamiento, redimensionamiento y conversión de imágenes.
- **Nodemailer:** Módulo para el envío de correos electrónicos desde el servidor (ej. notificaciones y formularios de contacto).
- **Helmet & Express Rate Limit:** Herramientas de seguridad para proteger contra vulnerabilidades web comunes y limitar el tráfico abusivo.
- **Express Mongo Sanitize:** Middleware de seguridad utilizado para prevenir ataques de inyección NoSQL.
- **CORS:** Middleware para habilitar el intercambio de recursos de origen cruzado de manera segura.
- **Dotenv:** Herramienta para la gestión y carga de variables de entorno de forma segura.
- **Jest & Supertest:** Framework y librerías utilizadas para llevar a cabo los test automatizados y pruebas de integración sobre los endpoints de la API.
- **Nodemon:** Herramienta de desarrollo que reinicia el servidor automáticamente tras detectar cambios.

---

## 🗄️ Tipos de Base de Datos Implementadas

La arquitectura del sistema hace uso de dos bases de datos completamente distintas para optimizar su funcionamiento:

1. **MongoDB (Base de Datos Primaria - NoSQL):**
   - **Uso:** Almacenamiento persistente del sistema.
   - **Función:** Guarda permanentemente todos los registros de los productos (nombre, precio, descripción, ruta de la imagen, etc.) así como las credenciales encriptadas del administrador.
   - **Driver:** Se utiliza el driver nativo de `mongodb` para conectarse a la instancia de la base de datos.

2. **Redis (Caché en Memoria - Clave/Valor):**
   - **Uso:** Almacenamiento temporal ultra-rápido.
   - **Función:** Se encarga de interceptar las consultas frecuentes (como la lista de productos principal que visualizan los clientes). En lugar de consultar a MongoDB en cada visita, Redis devuelve los datos directamente desde la memoria RAM del servidor, reduciendo drásticamente la latencia y la carga de la base de datos principal. La caché de Redis se invalida o actualiza automáticamente cuando el administrador crea, edita o elimina un producto.

---

## 🚀 Despliegue e Infraestructura

El backend está preparado para funcionar de forma ágil en producción:
- Completamente **Dockerizado** mediante un archivo `docker-compose.yml` que orquesta los servicios.
- Funciona detrás de **Caddy Proxy**, el cual se encarga de servir las imágenes de manera estática y proveer certificados HTTPS automáticos.
- Se integra de manera continua a través de GitHub Actions, construyendo y publicando la imagen en **GitHub Container Registry (GHCR)**.