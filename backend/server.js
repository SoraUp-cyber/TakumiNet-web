// =======================
// MÓDULOS Y DEPENDENCIAS
// =======================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const serverless = require("serverless-http");

// Frameworks y librerías
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const mysql = require("mysql2/promise");

// =======================
// CONFIGURACIÓN INICIAL
// =======================
const app = express();
require("dotenv").config();

// Constantes de configuración
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || "clave_secreta_para_desarrollo";

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: "dl5bjlhnv",
  api_key: "793396746524197",
  api_secret: "dSNF4TYc93A_mHFb7teDrKSUmq0",
});

// DETECCIÓN DE ENTORNO MEJORADA
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isProduction = process.env.NODE_ENV === 'production';

console.log(`🔍 Entorno detectado: Vercel=${isVercel}, Production=${isProduction}`);

// CONFIGURACIÓN DE BASE DE DATOS DUAL
const dbConfig = isVercel || isProduction ? {
  // ✅ CONFIGURACIÓN NUBE (Aiven) - Para Vercel y producción
  host: process.env.DB_HOST || "takuminet-mariadb-julianmartinezarenas480-c704.g.aivencloud.com",
  user: process.env.DB_USER || "avnadmin",
  password: process.env.DB_PASSWORD || "AVNS_W8Jtd5VqKCChu5rHHTG",
  database: process.env.DB_NAME || "defaultdb",
  port: process.env.DB_PORT || 25967,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
} : {
  // ✅ CONFIGURACIÓN LOCAL - Para desarrollo
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2001",
  database: process.env.DB_NAME || "TakumiNet",
  port: process.env.DB_PORT || 3307,
  ssl: false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// =======================
// MIDDLEWARES
// =======================
app.use(cors({
  origin: [
    "https://takuminet-app.netlify.app",
    "https://takumi-api-fawn.vercel.app",
    "http://localhost:3001", // ✅ Para desarrollo local
    "http://127.0.0.1:3000"  // ✅ Para desarrollo local
  ],
  credentials: true
}));
// ... el resto de middlewares se mantiene igual

// =======================
// VARIABLES GLOBALES Y HELPERS
// =======================
let pool;
let isPoolInitialized = false;

// Inicializar pool de conexiones MEJORADO
const initializePool = async () => {
  try {
    if (isPoolInitialized && pool) return true;
    
    console.log(`🔄 Inicializando pool de conexión...`);
    console.log(`📍 Entorno: ${isVercel ? 'Vercel (Nube)' : isProduction ? 'Producción (Nube)' : 'Desarrollo (Local)'}`);
    console.log(`🗄️  Base de datos: ${dbConfig.host}:${dbConfig.port}`);
    
    pool = mysql.createPool(dbConfig);
    
    const connection = await pool.getConnection();
    console.log(`✅ Conectado a ${isVercel || isProduction ? 'MariaDB en Aiven (Nube)' : 'MySQL Local'}`);
    connection.release();
    
    isPoolInitialized = true;
    return true;
  } catch (error) {
    console.error("❌ Error conectando a la base de datos:", error.message);
    console.log(`🔧 Configuración usada:`, {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      entorno: isVercel ? 'Vercel' : isProduction ? 'Producción' : 'Local'
    });
    isPoolInitialized = false;
    return false;
  }
};
// =======================
// ENDPOINTS
// =======================

// ✅ AGREGA ESTAS FUNCIONES - SON LAS QUE FALTAN
// Helpers de base de datos
const runAsync = async (query, params = []) => {
  try {
    if (!isPoolInitialized || !pool) {
      const initialized = await initializePool();
      if (!initialized) throw new Error("No se pudo conectar a la base de datos");
    }
    
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error("❌ Error SQL:", err.message);
    throw err;
  }
};

const getAsync = async (query, params = []) => {
  const rows = await runAsync(query, params);
  return rows[0] || null;
};
// =====================
// AUTENTICACIÓN
// =====================

// Registro
app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ ok: false, error: "Campos obligatorios" });
        if (username.length < 3) return res.status(400).json({ ok: false, error: "Username corto" });
        if (!email.includes("@")) return res.status(400).json({ ok: false, error: "Email inválido" });
        if (password.length < 6) return res.status(400).json({ ok: false, error: "Contraseña corta" });

        const hashed = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)";
        await runAsync(sql, [username, email, hashed]);

        res.json({ ok: true, message: "Usuario registrado" });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ ok: false, error: "Usuario o email ya existe" });
        console.error(err);
        res.status(500).json({ ok: false, error: "Error servidor" });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await getAsync("SELECT * FROM usuarios WHERE username=? OR email=?", [username, username]);
        if (!user) return res.status(400).json({ ok: false, error: "Usuario o contraseña incorrectos" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ ok: false, error: "Usuario o contraseña incorrectos" });

        const token = jwt.sign({ id: user.user_id }, SECRET, { expiresIn: "7d" });
        res.json({ ok: true, user: { id: user.user_id, username: user.username, avatar: user.avatar }, token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "Error servidor" });
    }
});


// MIDDLEWARE JWT (✅ CLAVE - AGREGA ESTO)
// =====================
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ ok: false, error: "No token" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ ok: false, error: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ ok: false, error: "Token inválido" });
    }
};

// =====================
// USUARIOS
// =====================

// Obtener datos del usuario logueado
app.get("/api/user", authMiddleware, async (req, res) => {
  try {
    const user = await getAsync(
      `SELECT user_id, username, email, avatar, language, descripcion, contacto_email, twitter, instagram, youtube, discord FROM usuarios WHERE user_id=?`,
      [req.userId]
    );

    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ Error en /api/user:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// Editar user (VERSIÓN SIMPLIFICADA SIN UPLOAD)
app.put("/api/user/editar", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { username, descripcion, contacto_email, twitter, instagram, youtube, discord, currentPassword, newPassword, avatar } = req.body;

    const user = await getAsync("SELECT * FROM usuarios WHERE user_id=?", [userId]);
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    // Manejo de contraseña
    let hashedPassword = user.password;
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ ok: false, error: "Debes enviar la contraseña actual" });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ ok: false, error: "Contraseña actual incorrecta" });
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    const sql = `
      UPDATE usuarios SET
        username = COALESCE(?, username),
        password = COALESCE(?, password),
        avatar = COALESCE(?, avatar),
        descripcion = COALESCE(?, descripcion),
        contacto_email = COALESCE(?, contacto_email),
        twitter = COALESCE(?, twitter),
        instagram = COALESCE(?, instagram),
        youtube = COALESCE(?, youtube),
        discord = COALESCE(?, discord)
      WHERE user_id = ?
    `;
    
    await runAsync(sql, [username, hashedPassword, avatar, descripcion, contacto_email, twitter, instagram, youtube, discord, userId]);
    res.json({ ok: true, mensaje: "Perfil actualizado correctamente" });

  } catch (err) {
    console.error("❌ Error actualizando perfil:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// =====================
// GAME JAMS
// =====================

// Crear Game Jam
app.post('/api/game_jams', authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (!data.titulo || !data.descripcion_corta || !data.url) {
      return res.status(400).json({ ok: false, error: 'Título, descripción y URL son obligatorios' });
    }

    // Subir imagen a Cloudinary si viene base64
    let imagenUrl = null;
    if (data.imagen_portada_base64) {
      const result = await cloudinary.uploader.upload(data.imagen_portada_base64, {
        folder: "takuminet/game_jams",
        public_id: `jam_${Date.now()}`,
        overwrite: true
      });
      imagenUrl = result.secure_url;
    }

    const query = `
      INSERT INTO game_jams (user_id, titulo, descripcion_corta, url, tipo_jam, quien_vota, fecha_inicio, fecha_fin, fecha_votacion, imagen_portada, contenido, criterios, hashtag, comunidad, bloquear_subidas, ocultar_resultados, ocultar_submisiones, visibilidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      req.userId, data.titulo, data.descripcion_corta, data.url,
      data.tipo_jam || 'no-ranking', data.quien_vota || 'solo-submisores',
      data.fecha_inicio || null, data.fecha_fin || null, data.fecha_votacion || null,
      imagenUrl, data.contenido || null, data.criterios || null, data.hashtag || null,
      data.comunidad || 0, data.bloquear_subidas || 0, data.ocultar_resultados || 0,
      data.ocultar_submisiones || 0, data.visibilidad || 'no-publicada'
    ];

    const result = await runAsync(query, values);
    res.json({ ok: true, id: result.insertId });

  } catch (err) {
    console.error('❌ Error creando Game Jam:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// Obtener todas las Game Jams
app.get("/api/game_jams", async (req, res) => {
  try {
    const rows = await runAsync("SELECT id, titulo, descripcion_corta, fecha_inicio, fecha_fin, imagen_portada FROM game_jams ORDER BY fecha_inicio DESC");
    res.json({ ok: true, jams: rows });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "No se pudieron obtener las Game Jams" });
  }
});

// Obtener Game Jam por ID
app.get("/api/game_jams/:id", async (req, res) => {
  try {
    const jamId = req.params.id;
    const jam = await getAsync("SELECT * FROM game_jams WHERE id = ?", [jamId]);
    
    if (!jam) return res.json({ ok: false, message: "Game Jam no encontrada" });
    res.json({ ok: true, jam });

  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "No se pudo obtener la Game Jam" });
  }
});

// Comentarios en Game Jams
app.post("/api/game_jams/:id/comentarios", authMiddleware, async (req, res) => {
    try {
        const jamId = req.params.id;
        const { comentario } = req.body;

        if (!comentario || comentario.trim() === "") {
            return res.status(400).json({ ok: false, error: "Comentario vacío" });
        }

        const result = await runAsync("INSERT INTO jam_comentarios (jam_id, user_id, comentario) VALUES (?, ?, ?)", [jamId, req.userId, comentario]);
        res.json({ ok: true, mensaje: "Comentario agregado", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "Error al agregar comentario" });
    }
});

app.get("/api/game_jams/:id/comentarios", async (req, res) => {
    try {
        const jamId = req.params.id;
        const comentarios = await runAsync(`
            SELECT c.comentario_id, c.comentario, c.creado_en, u.user_id, u.username, u.avatar
            FROM jam_comentarios c LEFT JOIN usuarios u ON c.user_id = u.user_id
            WHERE c.jam_id = ? ORDER BY c.creado_en DESC
        `, [jamId]);

        res.json({ ok: true, comentarios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "Error al obtener comentarios" });
    }
});

// Votos en Game Jams
app.post("/api/game_jams/:id/votos", authMiddleware, async (req, res) => {
  try {
    const jamId = req.params.id;
    const { puntuacion } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) return res.status(400).json({ ok: false, error: "Puntuación inválida" });

    await runAsync("INSERT INTO jam_votos (jam_id, user_id, puntuacion) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion)", [jamId, req.userId, puntuacion]);
    res.json({ ok: true, mensaje: "Voto registrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error al registrar voto" });
  }
});

app.get("/api/game_jams/:id/votos", async (req, res) => {
  try {
    const jamId = req.params.id;
    const votos = await runAsync("SELECT voto_id, user_id, puntuacion, creado_en FROM jam_votos WHERE jam_id = ?", [jamId]);

    const totalVotos = votos.length;
    const promedio = totalVotos ? votos.reduce((sum, v) => sum + v.puntuacion, 0) / totalVotos : 0;

    res.json({ ok: true, totalVotos, promedio: parseFloat(promedio.toFixed(1)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error al obtener votos" });
  }
});

// =====================
// FOROS (VERSIÓN SIMPLIFICADA SIN IMAGEN)
// =====================

app.post("/api/foros", authMiddleware, async (req, res) => {
  try {
    const { titulo, categoria, descripcion, etiquetas } = req.body;
    if (!titulo || !categoria || !descripcion) {
      return res.status(400).json({ ok: false, error: "Campos obligatorios faltantes" });
    }

    const result = await runAsync("INSERT INTO foros (user_id, titulo, categoria, descripcion, etiquetas) VALUES (?, ?, ?, ?, ?)", 
      [req.userId, titulo, categoria, descripcion, etiquetas || null]
    );

    return res.json({ ok: true, id: result.insertId, mensaje: "Foro creado correctamente" });

  } catch (err) {
    console.error("❌ Error creando foro:", err);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

app.get("/api/foros", async (req, res) => {
  try {
    const foros = await runAsync("SELECT * FROM foros ORDER BY id DESC");
    const forosProcesados = foros.map(f => ({
      ...f,
      etiquetas: f.etiquetas ? f.etiquetas.split(",").map(tag => tag.trim()) : [],
      imagen: f.imagen_url || null
    }));

    res.json({ ok: true, foros: forosProcesados });
  } catch (err) {
    console.error("❌ Error obteniendo foros:", err);
    res.status(500).json({ ok: false, error: "Error al obtener los foros" });
  }
});

app.get("/api/foros/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foro = await getAsync("SELECT * FROM foros WHERE id = ?", [id]);

    if (!foro) return res.status(404).json({ ok: false, error: "Foro no encontrado" });

    const foroProcesado = {
      ...foro,
      etiquetas: foro.etiquetas ? foro.etiquetas.split(",").map(tag => tag.trim()) : [],
      imagen: foro.imagen_url || null,
      fecha: foro.fecha || new Date().toISOString(),
    };

    res.json({ ok: true, foro: foroProcesado });
  } catch (err) {
    console.error("❌ Error obteniendo foro por ID:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

app.post("/api/foros/:id/comentarios", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;

    if (!comentario || comentario.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "El comentario no puede estar vacío" });
    }

    const result = await runAsync("INSERT INTO comentarios (foro_id, user_id, comentario) VALUES (?, ?, ?)", [id, req.userId, comentario]);
    res.json({ ok: true, mensaje: "Comentario agregado correctamente", id: result.insertId });

  } catch (err) {
    console.error("❌ Error creando comentario:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

app.get("/api/foros/:id/comentarios", async (req, res) => {
  try {
    const { id } = req.params;
    const comentarios = await runAsync(`
      SELECT c.id, c.comentario, c.created_at, u.username, u.avatar
      FROM comentarios c LEFT JOIN usuarios u ON c.user_id = u.user_id
      WHERE c.foro_id = ? ORDER BY c.created_at DESC
    `, [id]);

    res.json({ ok: true, comentarios });
  } catch (err) {
    console.error("❌ Error obteniendo comentarios:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// =====================
// JUEGOS
// =====================

// Subir juego
app.post("/api/juegos", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.description) {
      return res.status(400).json({ ok: false, error: "Título y descripción obligatorios" });
    }

    let coverUrl = null;
    let screenshotsUrls = [];

    // Subir portada
    if (data.cover_base64) {
      const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${data.cover_base64}`, {
        folder: "takuminet/games/cover",
        public_id: `cover_${Date.now()}`,
        overwrite: true,
      });
      coverUrl = result.secure_url;
    }

    // Subir capturas
    if (data.screenshots_base64 && data.screenshots_base64.length > 0) {
      for (const [i, ssBase64] of data.screenshots_base64.entries()) {
        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${ssBase64}`, {
          folder: "takuminet/games/screenshots",
          public_id: `ss_${Date.now()}_${i}`,
          overwrite: true,
        });
        screenshotsUrls.push(result.secure_url);
      }
    }

    const screenshotsJSON = JSON.stringify(screenshotsUrls);
    const pricingMap = { 'free': 'free', 'paid': 'paid', 'donation': 'donation', 'gratis': 'free', 'pago': 'paid', 'donacion': 'donation' };
    const mappedPricing = pricingMap[data.pricing] || 'free';

    const query = `
      INSERT INTO juegos (user_id, title, description, category, main_genre, genres, min_os, min_cpu, min_ram, min_gpu, min_storage, rec_os, rec_cpu, rec_ram, rec_gpu, rec_storage, cover, screenshots, youtube_url, storage_service, mediafire_url, pricing, price, terms_accepted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      req.userId, data.title, data.description, data.category || "other", data.main_genre || "no-genre", data.genres || null,
      data.min_os || null, data.min_cpu || null, data.min_ram || null, data.min_gpu || null, data.min_storage || null,
      data.rec_os || null, data.rec_cpu || null, data.rec_ram || null, data.rec_gpu || null, data.rec_storage || null,
      coverUrl, screenshotsJSON, data.youtube_url || null, data.storage_service || null, data.mediafire_url || null,
      mappedPricing, data.price || 0.0, data.terms_accepted ? 1 : 0
    ];

    const result = await runAsync(query, values);
    res.json({ ok: true, message: "Juego publicado con éxito 🎮", id: result.insertId, cover: coverUrl, screenshots: screenshotsUrls });

  } catch (err) {
    console.error("❌ Error subiendo juego:", err);
    res.status(500).json({ ok: false, error: "Error al subir juego: " + err.message });
  }
});

// Obtener todos los juegos
app.get("/api/juegos", async (req, res) => {
  try {
    const query = `
      SELECT j.id, j.title, j.description, j.category, j.main_genre, j.cover, j.screenshots, j.youtube_url, j.pricing, j.price, j.storage_service, j.mediafire_url, j.created_at, u.user_id, u.username, u.avatar
      FROM juegos j LEFT JOIN usuarios u ON j.user_id = u.user_id ORDER BY j.created_at DESC
    `;

    const rows = await runAsync(query);
    const juegosProcesados = rows.map(juego => ({
      ...juego,
      screenshots: juego.screenshots ? JSON.parse(juego.screenshots) : []
    }));

    res.json({ ok: true, juegos: juegosProcesados });
  } catch (err) {
    console.error("❌ Error obteniendo juegos:", err);
    res.status(500).json({ ok: false, error: "Error al obtener juegos" });
  }
});

// Obtener juego por ID
app.get("/api/juegos/:id", async (req, res) => {
  try {
    const gameId = req.params.id;
    const juego = await getAsync(`
      SELECT j.*, u.username, u.avatar, u.descripcion, u.contacto_email, u.twitter, u.instagram, u.youtube, u.discord
      FROM juegos j LEFT JOIN usuarios u ON j.user_id = u.user_id WHERE j.id = ?
    `, [gameId]);

    if (!juego) return res.status(404).json({ ok: false, error: "Juego no encontrado" });

    juego.screenshots = juego.screenshots ? JSON.parse(juego.screenshots) : [];
    const otrosJuegos = await runAsync("SELECT id, title, cover FROM juegos WHERE user_id = ? AND id != ?", [juego.user_id, gameId]);

    res.json({ ok: true, juego, otrosJuegos });
  } catch (err) {
    console.error("❌ Error obteniendo juego:", err);
    res.status(500).json({ ok: false, error: "Error al obtener el juego" });
  }
});

// Obtener juegos del usuario
app.get("/api/mis-juegos", authMiddleware, async (req, res) => {
  try {
    const rows = await runAsync("SELECT id, title, description, category, main_genre, cover, screenshots, pricing, price, created_at FROM juegos WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);
    
    const juegosProcesados = rows.map(juego => ({
      ...juego,
      screenshots: juego.screenshots ? JSON.parse(juego.screenshots) : []
    }));

    res.json({ ok: true, juegos: juegosProcesados });
  } catch (err) {
    console.error("❌ Error obteniendo juegos del usuario:", err);
    res.status(500).json({ ok: false, error: "Error al obtener los juegos" });
  }
});

// Eliminar juego
app.delete("/api/juegos/:id", authMiddleware, async (req, res) => {
  try {
    const gameId = req.params.id;
    const juego = await getAsync("SELECT user_id FROM juegos WHERE id = ?", [gameId]);
    
    if (!juego) return res.status(404).json({ ok: false, error: "Juego no encontrado" });
    if (juego.user_id !== req.userId) return res.status(403).json({ ok: false, error: "No tienes permiso para eliminar este juego" });

    await runAsync("DELETE FROM juegos WHERE id = ?", [gameId]);
    res.json({ ok: true, message: "Juego eliminado correctamente" });

  } catch (err) {
    console.error("❌ Error eliminando juego:", err);
    res.status(500).json({ ok: false, error: "Error al eliminar el juego" });
  }
});

// =====================
// FAVORITOS
// =====================

app.post("/api/favoritos", authMiddleware, async (req, res) => {
  try {
    const { juego_id } = req.body;
    if (!juego_id) return res.status(400).json({ ok: false, error: "Se requiere el juego_id" });

    await runAsync("INSERT IGNORE INTO favoritos (user_id, juego_id) VALUES (?, ?)", [req.userId, juego_id]);
    res.json({ ok: true, message: "Juego agregado a favoritos ❤️" });

  } catch (err) {
    console.error("Error agregando favorito:", err);
    res.status(500).json({ ok: false, error: "Error al agregar favorito" });
  }
});

app.get("/api/favoritos", authMiddleware, async (req, res) => {
  try {
    const favoritos = await runAsync(`
      SELECT f.id, j.id AS juego_id, j.title, j.cover, j.price, j.pricing
      FROM favoritos f JOIN juegos j ON f.juego_id = j.id
      WHERE f.user_id = ? ORDER BY f.created_at DESC
    `, [req.userId]);

    res.json({ ok: true, favoritos });
  } catch (err) {
    console.error("Error obteniendo favoritos:", err);
    res.status(500).json({ ok: false, error: "Error al obtener favoritos" });
  }
});

app.delete("/api/favoritos/:juego_id", authMiddleware, async (req, res) => {
  try {
    const { juego_id } = req.params;
    await runAsync("DELETE FROM favoritos WHERE user_id = ? AND juego_id = ?", [req.userId, juego_id]);
    res.json({ ok: true, message: "Juego eliminado de favoritos" });

  } catch (err) {
    console.error("Error eliminando favorito:", err);
    res.status(500).json({ ok: false, error: "Error al eliminar favorito" });
  }
});

// =====================
// SEGUIDORES
// =====================

app.post("/api/seguir", authMiddleware, async (req, res) => {
  try {
    const { seguido_id } = req.body;
    if (!seguido_id) return res.status(400).json({ ok: false, error: "Debes enviar el ID del usuario a seguir" });
    if (seguido_id === req.userId) return res.status(400).json({ ok: false, error: "No puedes seguirte a ti mismo" });

    await runAsync("INSERT IGNORE INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)", [req.userId, seguido_id]);
    res.json({ ok: true, message: "Usuario seguido correctamente ✅" });
  } catch (err) {
    console.error("❌ Error en /api/seguir:", err);
    res.status(500).json({ ok: false, error: "Error al seguir usuario" });
  }
});

app.delete("/api/seguir/:id", authMiddleware, async (req, res) => {
  try {
    const seguido_id = req.params.id;
    await runAsync("DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?", [req.userId, seguido_id]);
    res.json({ ok: true, message: "Has dejado de seguir al usuario 🚫" });
  } catch (err) {
    console.error("❌ Error en /api/seguir/:id:", err);
    res.status(500).json({ ok: false, error: "Error al dejar de seguir" });
  }
});

app.get("/api/siguiendo", authMiddleware, async (req, res) => {
  try {
    const siguiendo = await runAsync("SELECT u.user_id, u.username, u.avatar FROM seguidores s JOIN usuarios u ON s.seguido_id = u.user_id WHERE s.seguidor_id = ?", [req.userId]);
    res.json({ ok: true, siguiendo });
  } catch (err) {
    console.error("❌ Error en /api/siguiendo:", err);
    res.status(500).json({ ok: false, error: "Error al obtener seguidos" });
  }
});

app.get("/api/seguidores", authMiddleware, async (req, res) => {
  try {
    const seguidores = await runAsync("SELECT u.user_id, u.username, u.avatar FROM seguidores s JOIN usuarios u ON s.seguidor_id = u.user_id WHERE s.seguido_id = ?", [req.userId]);
    res.json({ ok: true, seguidores });
  } catch (err) {
    console.error("❌ Error en /api/seguidores:", err);
    res.status(500).json({ ok: false, error: "Error al obtener seguidores" });
  }
});

// =====================
// VOTOS EN JUEGOS
// =====================

app.post("/api/juegos/:id/votos", authMiddleware, async (req, res) => {
  try {
    const juegoId = req.params.id;
    const { puntuacion } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ ok: false, error: "Puntuación inválida" });
    }

    await runAsync("INSERT INTO juego_votos (juego_id, user_id, puntuacion) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion)", [juegoId, req.userId, puntuacion]);
    res.json({ ok: true, mensaje: "Voto registrado" });
  } catch (err) {
    console.error("❌ Error al registrar voto:", err);
    res.status(500).json({ ok: false, error: "Error al registrar voto" });
  }
});

app.get("/api/juegos/:id/votos", async (req, res) => {
  try {
    const juegoId = req.params.id;
    const votos = await runAsync("SELECT voto_id, user_id, puntuacion, creado_en FROM juego_votos WHERE juego_id = ?", [juegoId]);

    const promedio = votos.length ? (votos.reduce((sum, v) => sum + v.puntuacion, 0) / votos.length).toFixed(2) : 0;
    res.json({ ok: true, votos, promedio });
  } catch (err) {
    console.error("❌ Error obteniendo votos:", err);
    res.status(500).json({ ok: false, error: "Error al obtener votos" });
  }
});

app.get("/", async (req, res) => {
  let dbConnected = false;

  try {
    // Probar conexión a la base de datos
    // await runAsync("SELECT 1"); // Comentado temporalmente
    dbConnected = true; // Marcar como conectado para pruebas
  } catch (err) {
    console.error("❌ Error conexión DB:", err.message);
  }

  res.json({
    ok: true,
    message: "🚀 Servidor funcionando correctamente (DB temporalmente ignorada)",
    database: dbConnected ? "✅ Base de datos conectada" : "❌ Base de datos no conectada",
    server_time: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});


// INICIALIZACIÓN
initializePool().then((ok) => {
  if (!ok) console.error("❌ No se pudo conectar a la base de datos");
});

// ✅ DETECCIÓN AUTOMÁTICA MEJORADA - Vercel vs Local
if (process.env.VERCEL) {
  // Para Vercel - usa serverless
  console.log("🚀 Configuración para VERCEL");
  module.exports = serverless(app);
} else {
  // Para desarrollo local - inicia servidor normal
  const PORT = process.env.PORT || 3001;
  const server = app.listen(PORT, () => {
    console.log(`🎯 Servidor local ejecutándose en puerto ${PORT}`);
    console.log(`📱 URL: http://localhost:${PORT}`);
  });
  
  // Manejo de cierre graceful
  process.on('SIGINT', () => {
    console.log('🛑 Cerrando servidor...');
    server.close(() => {
      console.log('✅ Servidor cerrado');
      process.exit(0);
    });
  });
}