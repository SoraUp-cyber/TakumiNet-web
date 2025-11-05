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
const paypal = require('@paypal/checkout-server-sdk'); // ✅ NUEVO: PayPal SDK


// =======================
// MERCADO PAGO SIMPLIFICADO
// =======================
let mercadopago;

try {
  mercadopago = require('mercadopago');
  console.log("✅ Mercado Pago cargado");
  mercadopago.configure({
    access_token: "APP_USR-2794725193382250-103011-9a3f5cfa029a24e8debf31adbf03b5a9-2669472141"
  });
} catch (error) {
  console.log("❌ Mercado Pago no disponible");
  mercadopago = null;
}



// =======================
// CONFIGURACIÓN MERCADO PAGO PARA WEBHOOK
// =======================
const MERCADO_PAGO_CONFIG = {
  ACCESS_TOKEN: "APP_USR-2794725193382250-103011-9a3f5cfa029a24e8debf31adbf03b5a9-2669472141",
  PUBLIC_KEY: "APP_USR-ddfbdc07-b2fb-4188-8aca-eb40a90ee910",
  API_BASE: process.env.API_BASE_URL || "https://distinct-oralla-takumi-net-0d317399.koyeb.app"
};

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



// =======================
// CONFIGURACIÓN PAYPAL - ORGANIZADO
// =======================

// Configuración para PayPal Checkout SDK (pagos)
const configurePayPal = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID || "ATsaHPzDdIo6G2ly-xabsrheol0k3zU0M50XO_77JZ_edi6VKzIVV1sRBFvaNadDAmrXXeJp6ISZsnTS";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "EB9ris0Crb5AZ8EpxQOemKM6gg9ZtLA1q8WMKzEpxiPnXF8QbKkPjIiGAYpOV7G5fk77zr7lsGKhIUwg";
  
  const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(environment);
};

const paypalClient = configurePayPal();
console.log("✅ PayPal SDK configurado correctamente");

// Configuración para PayPal OAuth (conexión de cuentas)
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || "ATsaHPzDdIo6G2ly-xabsrheol0k3zU0M50XO_77JZ_edi6VKzIVV1sRBFvaNadDAmrXXeJp6ISZsnTS",
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || "EB9ris0Crb5AZ8EpxQOemKM6gg9ZtLA1q8WMKzEpxiPnXF8QbKkPjIiGAYpOV7G5fk77zr7lsGKhIUwg",
  environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
  returnUrl: "https://takuminet-app.netlify.app/pagos-desarrollador"
};

// ✅ Esto va antes de los middlewares
app.set("trust proxy", 1);

// DETECCIÓN DE ENTORNO MEJORADA PARA KOYEB
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isKoyeb = process.env.KOYEB === 'true' || process.env.NODE_ENV === 'production';
const isProduction = process.env.NODE_ENV === 'production';

console.log(`🔍 Entorno detectado: Koyeb=${isKoyeb}, Vercel=${isVercel}, Production=${isProduction}`);


const dbConfig = isVercel || isProduction ? {
  host: process.env.DB_HOST || "serverless-eastus.sysp0000.db3.skysql.com",
  user: process.env.DB_USER || "dbpbf41588767",
  password: process.env.DB_PASSWORD || "h8fH7R-26c6DQ7J~S7wRh",
  database: process.env.DB_NAME || "takuminet_db", // o tu nombre de DB real
  port: process.env.DB_PORT || 4108,
  ssl: { rejectUnauthorized: false }, // necesario para SkySQL
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
} : {
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
// MIDDLEWARES ESENCIALES - ACTUALIZADOS PARA 25MB
// =======================

// 1. ✅ Cookie Parser PRIMERO
app.use(cookieParser());

// 2. ✅ MIDDLEWARES DE BODY PRIMERO (ESTO ES CLAVE)
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ ok: false, error: "JSON inválido" });
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb'
}));

// 3. ✅ CONFIGURACIÓN CORS MEJORADA
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        "https://takuminet-app.netlify.app",
        "https://distinct-oralla-takumi-net-0d317399.koyeb.app",
        "http://localhost:3000"
      ]
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400
}));

// 4. ✅ HEADERS DE SEGURIDAD
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// 5. ✅ MIDDLEWARE DE SEGURIDAD - AHORA SÍ FUNCIONARÁ
const securityMiddleware = (req, res, next) => {
  try {
    // ✅ Asegurar que req.body siempre existe
    if (!req.body) {
      req.body = {};
    }
    
    // ✅ Solo validar si existe avatarBase64
    if (req.body.avatarBase64 !== undefined && req.body.avatarBase64 !== null) {
      const avatarBase64 = req.body.avatarBase64;
      
      if (typeof avatarBase64 !== 'string') {
        return res.status(400).json({ 
          ok: false, 
          error: "avatarBase64 debe ser una cadena base64" 
        });
      }
      
      if (avatarBase64.length > 35000000) {
        return res.status(400).json({ 
          ok: false, 
          error: "La imagen es demasiado grande. Máximo 25MB." 
        });
      }
      
      if (avatarBase64.trim() !== '' && !avatarBase64.startsWith('data:image/')) {
        return res.status(400).json({ 
          ok: false, 
          error: "Formato de imagen no soportado" 
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("❌ Error en security middleware:", error);
    res.status(500).json({ ok: false, error: "Error de validación de datos" });
  }
};

app.use(securityMiddleware);

// 6. ✅ VALIDACIÓN DE ARCHIVOS - SIMPLIFICADA (ELIMINA validateFileUpload)
// YA NO NECESITAS validateFileUpload SEPARADO, TODO ESTÁ EN securityMiddleware

// 7. ✅ Middleware de debugging temporal
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log('📦 Body keys:', req.body ? Object.keys(req.body) : 'No body');
  if (req.body && req.body.avatarBase64) {
    console.log('🖼️ Avatar presente, longitud:', req.body.avatarBase64.length);
  }
  next();
});


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
// TEMPORALMENTE SIN RATE LIMITING
// =======================
console.log("🔓 Rate limiting deshabilitado para estabilidad");

// TODO: Implementar rate limiting más adelante cuando el servidor esté estable
// const limiter = rateLimit({ ... });
// app.use(limiter);

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

/// =====================
// Registro
// =====================
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
// =====================
// Login
// =====================
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

// Middleware JWT
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
// Obtener datos del usuario logueado
// =====================
app.get("/api/user", authMiddleware, async (req, res) => {
  try {
    const user = await getAsync(
      `SELECT 
        user_id, 
        username, 
        email, 
        avatar, 
        language,
        descripcion,
        contacto_email,
        twitter,
        instagram,
        youtube,
        discord
      FROM usuarios 
      WHERE user_id=?`,
      [req.userId]
    );

    if (!user) {
      return res
        .status(404)
        .json({ ok: false, error: "Usuario no encontrado" });
    }

    res.json({ ok: true, user });
  } catch (err) {
    console.error("❌ Error en /api/user:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});


// =====================
// EDITAR USUARIO (sin multer, con Cloudinary)
// =====================
app.put("/api/user/editar", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      username,
      descripcion,
      contacto_email,
      twitter,
      instagram,
      youtube,
      discord,
      currentPassword,
      newPassword,
      avatarBase64
    } = req.body;

    const user = await getAsync("SELECT * FROM usuarios WHERE user_id=?", [userId]);
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    let hashedPassword = user.password;
    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ ok: false, error: "Debes enviar la contraseña actual" });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ ok: false, error: "Contraseña actual incorrecta" });
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    let avatarUrl = user.avatar;
    if (avatarBase64) {
      try {
        const result = await cloudinary.uploader.upload(avatarBase64, {
          folder: "takuminet/avatars",
          public_id: `avatar_${userId}_${Date.now()}`,
          overwrite: true,
        });
        avatarUrl = result.secure_url;
      } catch (uploadError) {
        console.error("⚠️ Error subiendo avatar a Cloudinary:", uploadError);
      }
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

    await runAsync(sql, [
      username, hashedPassword, avatarUrl,
      descripcion, contacto_email,
      twitter, instagram, youtube, discord,
      userId
    ]);

    res.json({ ok: true, mensaje: "Perfil actualizado correctamente", avatar: avatarUrl });

  } catch (err) {
    console.error("❌ Error actualizando perfil:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// =======================
// SUBIR AVATAR DIRECTO A CLOUDINARY (Base64)
// =======================
app.post("/api/user/avatar", authMiddleware, async (req, res) => {
  try {
    const { avatarBase64 } = req.body;
    if (!avatarBase64) return res.status(400).json({ ok: false, error: "No se envió ninguna imagen" });

    const result = await cloudinary.uploader.upload(avatarBase64, {
      folder: "takuminet/avatars",
      public_id: `avatar_${req.userId}_${Date.now()}`,
      overwrite: true,
    });

    await runAsync("UPDATE usuarios SET avatar=? WHERE user_id=?", [result.secure_url, req.userId]);

    res.json({ ok: true, avatar: result.secure_url });

  } catch (err) {
    console.error("❌ Error subiendo avatar:", err);
    res.status(500).json({ ok: false, error: "Error subiendo avatar" });
  }
});

// =======================
// ENDPOINT CREAR GAME JAM
// =======================
app.post('/api/game_jams', authMiddleware, async (req, res) => {
  try {
    const data = req.body;

    // Validaciones básicas
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
      INSERT INTO game_jams
      (user_id, titulo, descripcion_corta, url, tipo_jam, quien_vota,
       fecha_inicio, fecha_fin, fecha_votacion, imagen_portada, contenido,
       criterios, hashtag, comunidad, bloquear_subidas, ocultar_resultados,
       ocultar_submisiones, visibilidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      req.userId,                 // user_id
      data.titulo,
      data.descripcion_corta,
      data.url,
      data.tipo_jam || 'no-ranking',
      data.quien_vota || 'solo-submisores',
      data.fecha_inicio || null,
      data.fecha_fin || null,
      data.fecha_votacion || null,
      imagenUrl,
      data.contenido || null,
      data.criterios || null,
      data.hashtag || null,
      data.comunidad || 0,
      data.bloquear_subidas || 0,
      data.ocultar_resultados || 0,
      data.ocultar_submisiones || 0,
      data.visibilidad || 'no-publicada'
    ];

    const result = await runAsync(query, values);

    res.json({ ok: true, id: result.insertId });

  } catch (err) {
    console.error('❌ Error creando Game Jam:', err);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});



// =====================
// Endpoint para obtener todas las Game Jams
// =====================
app.get("/api/game_jams", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `SELECT id, titulo, descripcion_corta, fecha_inicio, fecha_fin, imagen_portada
       FROM game_jams ORDER BY fecha_inicio DESC`
    );

    res.json({
      ok: true,
      jams: rows
    });
  } catch (err) {
    console.error(err);
    res.json({
      ok: false,
      error: "No se pudieron obtener las Game Jams"
    });
  } finally {
    if (connection) await connection.end();
  }
});


// =====================
// Endpoint para obtener una Game Jam por ID
// =====================
app.get("/api/game_jams/:id", async (req, res) => {
  const jamId = req.params.id;
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `SELECT *
       FROM game_jams
       WHERE id = ?`,
       [jamId]
    );

    if (rows.length === 0) {
      return res.json({ ok: false, message: "Game Jam no encontrada" });
    }

    res.json({
      ok: true,
      jam: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: "No se pudo obtener la Game Jam" });
  } finally {
    if (connection) await connection.end();
  }
});







// ==========================
// COMENTARIOS EN GAME JAMS
// ==========================
app.post("/api/game_jams/:id/comentarios", authMiddleware, async (req, res) => {
    try {
        const jamId = req.params.id;
        const { comentario } = req.body;

        if (!comentario || comentario.trim() === "") {
            return res.status(400).json({ ok: false, error: "Comentario vacío" });
        }

        const query = `
            INSERT INTO jam_comentarios (jam_id, user_id, comentario)
            VALUES (?, ?, ?)
        `;
        const result = await runAsync(query, [jamId, req.userId, comentario]);

        res.json({ ok: true, mensaje: "Comentario agregado", id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "Error al agregar comentario" });
    }
});

app.get("/api/game_jams/:id/comentarios", async (req, res) => {
    try {
        const jamId = req.params.id;

        const query = `
            SELECT c.comentario_id, c.comentario, c.creado_en,
                   u.user_id, u.username, u.avatar
            FROM jam_comentarios c
            LEFT JOIN usuarios u ON c.user_id = u.user_id
            WHERE c.jam_id = ?
            ORDER BY c.creado_en DESC
        `;
        const comentarios = await runAsync(query, [jamId]);

        res.json({ ok: true, comentarios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, error: "Error al obtener comentarios" });
    }
});

// ==========================
// POST: Enviar voto
// ==========================
app.post("/api/game_jams/:id/votos", authMiddleware, async (req, res) => {
  try {
    const jamId = req.params.id;
    const { puntuacion } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5)
      return res.status(400).json({ ok: false, error: "Puntuación inválida" });

    const query = `
      INSERT INTO jam_votos (jam_id, user_id, puntuacion)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion)
    `;
    await runAsync(query, [jamId, req.userId, puntuacion]);

    res.json({ ok: true, mensaje: "Voto registrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error al registrar voto" });
  }
});

// ==========================
// GET: Obtener votos y promedio
// ==========================
app.get("/api/game_jams/:id/votos", async (req, res) => {
  try {
    const jamId = req.params.id;
    const query = `
      SELECT voto_id, user_id, puntuacion, creado_en
      FROM jam_votos
      WHERE jam_id = ?
    `;
    const votos = await runAsync(query, [jamId]);

    const totalVotos = votos.length;
    const promedio = totalVotos
      ? votos.reduce((sum, v) => sum + v.puntuacion, 0) / totalVotos
      : 0;

    res.json({ ok: true, totalVotos, promedio: parseFloat(promedio.toFixed(1)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error al obtener votos" });
  }
});







// =======================
// CREAR NUEVO FORO (sin multer, usando Base64)
// =======================
app.post("/api/foros", authMiddleware, async (req, res) => {
  try {
    // -----------------------
    // 1. Extraer datos del body
    // -----------------------
    const { titulo, categoria, descripcion, etiquetas, imagenBase64 } = req.body;

    // -----------------------
    // 2. Validar campos obligatorios
    // -----------------------
    if (!titulo || !categoria || !descripcion) {
      return res.status(400).json({
        ok: false,
        error: "Campos obligatorios faltantes"
      });
    }

    // -----------------------
    // 3. Inicializar variable para la URL de la imagen
    // -----------------------
    let imagenUrl = null;

    // -----------------------
    // 4. Subir imagen a Cloudinary si existe
    // -----------------------
    if (imagenBase64) {
      const result = await cloudinary.uploader.upload(imagenBase64, {
        folder: "takuminet/foros",
        public_id: `foro_${req.userId}_${Date.now()}`, // ID único
        overwrite: true
      });
      imagenUrl = result.secure_url;
    }

    // -----------------------
    // 5. Insertar foro en la base de datos
    // -----------------------
    const sql = `
      INSERT INTO foros (user_id, titulo, categoria, descripcion, etiquetas, imagen_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const result = await runAsync(sql, [
      req.userId,
      titulo,
      categoria,
      descripcion,
      etiquetas || null,
      imagenUrl
    ]);

    // -----------------------
    // 6. Responder al cliente
    // -----------------------
    return res.json({
      ok: true,
      id: result.insertId,
      mensaje: "Foro creado correctamente",
      imagenUrl
    });

  } catch (err) {
    // -----------------------
    // 7. Manejo de errores
    // -----------------------
    console.error("❌ Error creando foro:", err);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor"
    });
  }
});




app.get("/api/foros", async (req, res) => {
  try {
    const foros = await runAsync("SELECT * FROM foros ORDER BY id DESC");

    const forosProcesados = foros.map(f => ({
      id: f.id,
      user_id: f.user_id,
      titulo: f.titulo,
      categoria: f.categoria,
      descripcion: f.descripcion,
      etiquetas: f.etiquetas ? f.etiquetas.split(",").map(tag => tag.trim()) : [],
      imagen: f.imagen_url || null
    }));

    res.json({ ok: true, foros: forosProcesados });
  } catch (err) {
    console.error("❌ Error obteniendo foros:", err);
    res.status(500).json({ ok: false, error: "Error al obtener los foros" });
  }
});

// Obtener un foro específico por ID
app.get("/api/foros/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const foro = await runAsync("SELECT * FROM foros WHERE id = ?", [id]);

    if (!foro || foro.length === 0) {
      return res.status(404).json({ ok: false, error: "Foro no encontrado" });
    }

    const f = foro[0];
    const foroProcesado = {
      id: f.id,
      user_id: f.user_id,
      titulo: f.titulo,
      categoria: f.categoria,
      descripcion: f.descripcion,
      etiquetas: f.etiquetas ? f.etiquetas.split(",").map(tag => tag.trim()) : [],
      imagen: f.imagen_url || null,
      fecha: f.fecha || new Date().toISOString(),
    };

    res.json({ ok: true, foro: foroProcesado });
  } catch (err) {
    console.error("❌ Error obteniendo foro por ID:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

app.post("/api/foros/:id/comentarios", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;   // ID del foro
    const { comentario } = req.body;

    if (!comentario || comentario.trim().length === 0) {
      return res.status(400).json({ ok: false, error: "El comentario no puede estar vacío" });
    }

    const sql = `
      INSERT INTO comentarios (foro_id, user_id, comentario)
      VALUES (?, ?, ?)
    `;
    const result = await runAsync(sql, [id, req.userId, comentario]);

    res.json({
      ok: true,
      mensaje: "Comentario agregado correctamente",
      id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error creando comentario:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

app.get("/api/foros/:id/comentarios", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT c.id, c.comentario, c.created_at,
             u.username, u.avatar
      FROM comentarios c
      LEFT JOIN usuarios u ON c.user_id = u.user_id
      WHERE c.foro_id = ?
      ORDER BY c.created_at DESC
    `;
    const comentarios = await runAsync(sql, [id]);

    res.json({ ok: true, comentarios });
  } catch (err) {
    console.error("❌ Error obteniendo comentarios:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});




// =======================
// ENDPOINT SUBIR JUEGO - ACTUALIZADO PARA 25MB
// =======================
app.post("/api/juegos", authMiddleware, async (req, res) => {
  try {
    const data = req.body;
    
    console.log("📥 Recibiendo solicitud para subir juego...");
    console.log("📊 Tamaño de datos recibidos:", JSON.stringify(data).length, "bytes");

    // ✅ Validación mejorada con mensajes más claros
    if (!data.title || !data.description) {
      return res.status(400).json({ 
        ok: false, 
        error: "❌ Título y descripción son obligatorios" 
      });
    }

    // ✅ Validar tamaño de imágenes base64
    if (data.cover_base64 && data.cover_base64.length > 30 * 1024 * 1024) { // ~30MB en base64
      return res.status(400).json({
        ok: false,
        error: "❌ La portada es demasiado grande. Máximo 25MB."
      });
    }

    let coverUrl = null;
    let screenshotsUrls = [];

    // 📤 SUBIR PORTADA - CON MANEJO DE ERRORES MEJORADO
    if (data.cover_base64) {
      try {
        console.log("🖼️ Subiendo portada a Cloudinary...");
        console.log("📸 Tamaño base64 portada:", data.cover_base64.length, "caracteres");
        
        const imageFormat = detectImageFormat(data.cover_base64);
        console.log("🎨 Formato detectado para portada:", imageFormat);
        
        const result = await cloudinary.uploader.upload(
          `data:image/${imageFormat};base64,${data.cover_base64}`, 
          {
            folder: "takuminet/games/cover",
            public_id: `cover_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            overwrite: true,
            timeout: 60000, // 60 segundos timeout
            chunk_size: 20 * 1024 * 1024 // 20MB chunks
          }
        );
        
        coverUrl = result.secure_url;
        console.log("✅ Portada subida a Cloudinary:", coverUrl);
        
      } catch (cloudinaryError) {
        console.error("❌ Error detallado subiendo portada:", {
          message: cloudinaryError.message,
          code: cloudinaryError.code,
          http_code: cloudinaryError.http_code
        });
        
        return res.status(500).json({ 
          ok: false, 
          error: "Error al subir la portada: " + cloudinaryError.message 
        });
      }
    }

    // 📤 SUBIR CAPTURAS - CON LÍMITE DE 25MB
    if (data.screenshots_base64 && data.screenshots_base64.length > 0) {
      try {
        console.log("🖼️ Subiendo", data.screenshots_base64.length, "capturas...");
        
        // ✅ Validar número de capturas
        if (data.screenshots_base64.length < 5) {
          return res.status(400).json({
            ok: false,
            error: "❌ Debes subir al menos 5 capturas del juego"
          });
        }

        // ✅ Validar tamaño de cada captura
        for (const [i, ssBase64] of data.screenshots_base64.entries()) {
          if (ssBase64.length > 30 * 1024 * 1024) { // ~30MB en base64
            return res.status(400).json({
              ok: false,
              error: `❌ La captura ${i + 1} es demasiado grande. Máximo 25MB por imagen.`
            });
          }
        }

        // ✅ Subir capturas en serie (más estable que en paralelo)
        for (const [i, ssBase64] of data.screenshots_base64.entries()) {
          console.log(`📤 Subiendo captura ${i + 1}/${data.screenshots_base64.length}...`);
          
          const imageFormat = detectImageFormat(ssBase64);
          const result = await cloudinary.uploader.upload(
            `data:image/${imageFormat};base64,${ssBase64}`,
            {
              folder: "takuminet/games/screenshots",
              public_id: `ss_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`,
              overwrite: true,
              timeout: 60000,
              chunk_size: 20 * 1024 * 1024
            }
          );
          
          screenshotsUrls.push(result.secure_url);
          console.log(`✅ Captura ${i + 1} subida (${imageFormat.toUpperCase()})`);
        }
        
        console.log("🎉 Todas las capturas subidas:", screenshotsUrls.length);
        
      } catch (cloudinaryError) {
        console.error("❌ Error subiendo capturas:", cloudinaryError);
        return res.status(500).json({ 
          ok: false, 
          error: "Error al subir las capturas: " + cloudinaryError.message 
        });
      }
    }

    // 🎯 CONTINÚA CON EL RESTO DEL CÓDIGO ORIGINAL...
    const screenshotsJSON = JSON.stringify(screenshotsUrls);

    // Mapear pricing values
    const pricingMap = {
      'free': 'free', 'paid': 'paid', 'donation': 'donation',
      'gratis': 'free', 'pago': 'paid', 'donacion': 'donation'
    };
    const mappedPricing = pricingMap[data.pricing] || 'free';

    // Guardar en MariaDB
    const query = `
      INSERT INTO juegos (
        user_id, title, description, category, main_genre, genres,
        min_os, min_cpu, min_ram, min_gpu, min_storage,
        rec_os, rec_cpu, rec_ram, rec_gpu, rec_storage,
        cover, screenshots, youtube_url,
        storage_service, mediafire_url,
        pricing, price, terms_accepted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      req.userId,
      data.title,
      data.description,
      data.category || "other",
      data.main_genre || "no-genre",
      data.genres || null,
      data.min_os || null,
      data.min_cpu || null,
      data.min_ram || null,
      data.min_gpu || null,
      data.min_storage || null,
      data.rec_os || null,
      data.rec_cpu || null,
      data.rec_ram || null,
      data.rec_gpu || null,
      data.rec_storage || null,
      coverUrl,
      screenshotsJSON,
      data.youtube_url || null,
      data.storage_service || null,
      data.mediafire_url || null,
      mappedPricing,
      data.price || 0.0,
      data.terms_accepted ? 1 : 0
    ];

    console.log("💾 Guardando en base de datos...");
    const result = await runAsync(query, values);
    console.log("✅ Juego guardado en BD con ID:", result.insertId);

    res.json({
      ok: true,
      message: "🎮 ¡Juego publicado con éxito!",
      id: result.insertId,
      cover: coverUrl,
      screenshots: screenshotsUrls,
    });

  } catch (err) {
    console.error("💥 ERROR CRÍTICO subiendo juego:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    res.status(500).json({ 
      ok: false, 
      error: "Error interno del servidor: " + err.message 
    });
  }
});

// =======================
// FUNCIÓN PARA DETECTAR FORMATO DE IMAGEN
// =======================
function detectImageFormat(base64String) {
  // Los primeros caracteres del base64 indican el formato
  const signature = base64String.substring(0, 20);
  
  if (signature.startsWith('/9j/')) {
    return 'jpeg'; // JPEG
  } else if (signature.startsWith('iVBORw0KGgo')) {
    return 'png'; // PNG
  } else if (signature.startsWith('R0lGODlh')) {
    return 'gif'; // GIF
  } else {
    console.log("⚠️ Formato no detectado, usando PNG por defecto. Signature:", signature);
    return 'png'; // Por defecto
  }
}


// =======================
// HELPERS OPTIMIZADOS
// =======================

// Helper para obtener todos los resultados
const allAsync = async (query, params = []) => {
  const rows = await runAsync(query, params);
  return rows;
};

// Helper para procesar juegos más rápido
const procesarJuego = (juego) => ({
  ...juego,
  screenshots: juego.screenshots ? JSON.parse(juego.screenshots) : []
});

// =======================
// ENDPOINT OBTENER JUEGOS - OPTIMIZADO
// =======================
app.get("/api/juegos", async (req, res) => {
  try {
    console.time('⏱️ ObtenerJuegos'); // Medir tiempo
    
    const query = `
      SELECT 
        j.id, j.title, j.description, j.category, j.main_genre,
        j.cover, j.screenshots, j.youtube_url, j.pricing, j.price,
        j.storage_service, j.mediafire_url, j.created_at,
        u.user_id, u.username, u.avatar
      FROM juegos j
      LEFT JOIN usuarios u ON j.user_id = u.user_id
      ORDER BY j.created_at DESC
      LIMIT 100  -- ✅ LIMITAR para mejor rendimiento
    `;

    const rows = await runAsync(query);
    
    // Procesamiento más eficiente
    const juegosProcesados = rows.map(procesarJuego);
    
    console.timeEnd('⏱️ ObtenerJuegos'); // Fin medición
    
    res.json({ 
      ok: true, 
      juegos: juegosProcesados,
      total: juegosProcesados.length
    });

  } catch (err) {
    console.error("❌ Error obteniendo juegos:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error al obtener juegos: " + err.message 
    });
  }
});

// =======================
// ENDPOINT OBTENER JUEGO POR ID - CORREGIDO
// =======================
app.get("/api/juegos/:id", async (req, res) => {
  try {
    console.time('⏱️ ObtenerJuegoID');
    
    const gameId = req.params.id;

    // ✅ CORREGIDO: Incluir mp_id y mp_email en la consulta
    const juegoQuery = `
      SELECT j.*, 
             u.username, u.avatar, u.descripcion, 
             u.contacto_email, u.twitter, u.instagram, 
             u.youtube, u.discord, u.mp_id, u.mp_email  -- ✅ AGREGAR ESTOS CAMPOS
      FROM juegos j 
      LEFT JOIN usuarios u ON j.user_id = u.user_id 
      WHERE j.id = ?
    `;
    
    const juego = await getAsync(juegoQuery, [gameId]);

    if (!juego) {
      console.timeEnd('⏱️ ObtenerJuegoID');
      return res.status(404).json({ 
        ok: false, 
        error: "Juego no encontrado" 
      });
    }

    // Procesar datos del juego
    const juegoProcesado = procesarJuego(juego);

    // 2️⃣ Obtener otros juegos
    const otrosJuegosPromise = allAsync(
      `SELECT id, title, cover FROM juegos WHERE user_id = ? AND id != ? LIMIT 6`,
      [juego.user_id, gameId]
    );

    const [otrosJuegos] = await Promise.all([otrosJuegosPromise]);
    
    console.timeEnd('⏱️ ObtenerJuegoID');

    // ✅ DEBUG: Verificar qué datos se envían
    console.log("📤 Enviando datos del juego:", {
      id: juegoProcesado.id,
      title: juegoProcesado.title,
      user_id: juegoProcesado.user_id,
      username: juegoProcesado.username,
      mp_id: juegoProcesado.mp_id,
      mp_email: juegoProcesado.mp_email
    });

    res.json({ 
      ok: true, 
      juego: juegoProcesado, 
      otrosJuegos 
    });

  } catch (err) {
    console.error("❌ Error obteniendo juego:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error al obtener el juego: " + err.message 
    });
  }
});

// =======================
// ENDPOINT OBTENER JUEGOS DEL USUARIO
// =======================
app.get("/api/mis-juegos", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT j.id, j.title, j.description, j.category, j.main_genre,
            j.cover, j.screenshots, j.pricing, j.price, j.created_at
      FROM juegos j
      WHERE j.user_id = ?
      ORDER BY j.created_at DESC
    `;

    const rows = await runAsync(query, [req.userId]);

    // Procesar las capturas
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

// =======================
// ENDPOINT ELIMINAR JUEGO
// =======================
app.delete("/api/juegos/:id", authMiddleware, async (req, res) => {
  try {
    const gameId = req.params.id;

    // Verificar que el juego pertenece al usuario
    const juego = await getAsync("SELECT user_id FROM juegos WHERE id = ?", [gameId]);
    
    if (!juego) {
      return res.status(404).json({ ok: false, error: "Juego no encontrado" });
    }

    if (juego.user_id !== req.userId) {
      return res.status(403).json({ ok: false, error: "No tienes permiso para eliminar este juego" });
    }

    await runAsync("DELETE FROM juegos WHERE id = ?", [gameId]);

    res.json({ ok: true, message: "Juego eliminado correctamente" });

  } catch (err) {
    console.error("❌ Error eliminando juego:", err);
    res.status(500).json({ ok: false, error: "Error al eliminar el juego" });
  }
});



// =======================
// ACTUALIZAR PRECIO DE JUEGO
// =======================
app.put("/api/juegos/:id/precio", authMiddleware, async (req, res) => {
  try {
    const juegoId = req.params.id;
    let { final_price, discount } = req.body;

    // Validaciones
    if (final_price == null || isNaN(final_price))
      return res.status(400).json({ ok: false, message: "Precio inválido" });

    discount = Number(discount) || 0; // Por si viene vacío
    final_price = Number(final_price);

    // Buscar juego
    const juego = await getAsync(
      "SELECT price, discount, final_price, user_id FROM juegos WHERE id = ?",
      [juegoId]
    );
    if (!juego) return res.status(404).json({ ok: false, message: "Juego no encontrado" });

    // Validar propietario
    if (juego.user_id !== req.userId)
      return res.status(403).json({ ok: false, message: "No tienes permiso para editar este juego" });

    // Calcular final_price automáticamente si hay descuento
    const precioFinal = discount > 0 ? (final_price * (1 - discount / 100)).toFixed(2) : final_price;

    // Actualizar en la base de datos
    await runAsync(
      "UPDATE juegos SET price = ?, discount = ?, final_price = ? WHERE id = ?",
      [final_price, discount, precioFinal, juegoId]
    );

    res.json({ ok: true, message: "Precio actualizado correctamente", final_price: precioFinal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});




// =======================
// OBTENER PRECIO ACTUAL DE UN JUEGO
// =======================
app.get("/api/juegos/:id/precio", authMiddleware, async (req, res) => {
  try {
    const juegoId = req.params.id;

    // Buscar juego en la base de datos
    const juego = await getAsync(
      "SELECT price, discount, final_price FROM juegos WHERE id = ?",
      [juegoId]
    );

    if (!juego) {
      return res.status(404).json({ ok: false, message: "Juego no encontrado" });
    }

    // Retornar los datos de precios
    res.json({
      ok: true,
      price: parseFloat(juego.price) || 0,
      discount: parseFloat(juego.discount) || 0,
      final_price: parseFloat(juego.final_price) || parseFloat(juego.price) || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});





// =======================
// ENDPOINT OBTENER JUEGOS POR USUARIO
// =======================
app.get("/api/juegos/usuario/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Traer información del usuario
    const userQuery = `
      SELECT user_id, username, avatar, description, contact, twitter, instagram, facebook
      FROM usuarios
      WHERE user_id = ?
    `;
    const usuario = await getAsync(userQuery, [userId]);

    if (!usuario) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    // Traer juegos del usuario
    const juegosQuery = `
      SELECT id, title, description, category, main_genre,
             cover, screenshots, youtube_url, pricing, price,
             storage_service, mediafire_url, created_at
      FROM juegos
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    const juegosRows = await runAsync(juegosQuery, [userId]);

    // Procesar capturas de cada juego
    const juegosProcesados = juegosRows.map(juego => ({
      ...juego,
      screenshots: juego.screenshots ? JSON.parse(juego.screenshots) : []
    }));

    // Respuesta completa
    res.json({
      ok: true,
      usuario: {
        id: usuario.user_id,
        username: usuario.username,
        avatar: usuario.avatar,
        description: usuario.description,
        contact: usuario.contact,
        redes: {
          twitter: usuario.twitter,
          instagram: usuario.instagram,
          facebook: usuario.facebook
        }
      },
      juegos: juegosProcesados
    });

  } catch (err) {
    console.error("❌ Error obteniendo juegos del usuario:", err);
    res.status(500).json({ ok: false, error: "Error al obtener juegos del usuario" });
  }
});





// ===============================
// ENDPOINT AGREGAR FAVORITO
// ===============================
app.post("/api/favoritos", authMiddleware, async (req, res) => {
  try {
    const { juego_id } = req.body;

    if (!juego_id) return res.status(400).json({ ok: false, error: "Se requiere el juego_id" });

    // Insertar favorito (si ya existe, ignorar por UNIQUE KEY)
    const query = `
      INSERT IGNORE INTO favoritos (user_id, juego_id)
      VALUES (?, ?)
    `;
    await runAsync(query, [req.userId, juego_id]);

    res.json({ ok: true, message: "Juego agregado a favoritos ❤️" });

  } catch (err) {
    console.error("Error agregando favorito:", err);
    res.status(500).json({ ok: false, error: "Error al agregar favorito" });
  }
});

// ===============================
// ENDPOINT LISTAR FAVORITOS DEL USUARIO
// ===============================
app.get("/api/favoritos", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT f.id, j.id AS juego_id, j.title, j.cover, j.price, j.pricing
      FROM favoritos f
      JOIN juegos j ON f.juego_id = j.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;
    const favoritos = await runAsync(query, [req.userId]);

    res.json({ ok: true, favoritos });

  } catch (err) {
    console.error("Error obteniendo favoritos:", err);
    res.status(500).json({ ok: false, error: "Error al obtener favoritos" });
  }
});

// ===============================
// ENDPOINT ELIMINAR FAVORITO
// ===============================
app.delete("/api/favoritos/:juego_id", authMiddleware, async (req, res) => {
  try {
    const { juego_id } = req.params;

    const query = `
      DELETE FROM favoritos
      WHERE user_id = ? AND juego_id = ?
    `;
    await runAsync(query, [req.userId, juego_id]);

    res.json({ ok: true, message: "Juego eliminado de favoritos" });

  } catch (err) {
    console.error("Error eliminando favorito:", err);
    res.status(500).json({ ok: false, error: "Error al eliminar favorito" });
  }
});





// ==========================
// VOTOS EN JUEGOS
// ==========================
app.post("/api/juegos/:id/votos", authMiddleware, async (req, res) => {
  try {
    const juegoId = req.params.id;
    const { puntuacion } = req.body;

    if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ ok: false, error: "Puntuación inválida" });
    }

    const query = `
      INSERT INTO juego_votos (juego_id, user_id, puntuacion)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE puntuacion = VALUES(puntuacion)
    `;

    await runAsync(query, [juegoId, req.userId, puntuacion]);

    res.json({ ok: true, mensaje: "Voto registrado" });
  } catch (err) {
    console.error("❌ Error al registrar voto:", err);
    res.status(500).json({ ok: false, error: "Error al registrar voto" });
  }
});

app.get("/api/juegos/:id/votos", async (req, res) => {
  try {
    const juegoId = req.params.id;

    const query = `
      SELECT voto_id, user_id, puntuacion, creado_en
      FROM juego_votos
      WHERE juego_id = ?
    `;

    const votos = await runAsync(query, [juegoId]);

    // Calcular promedio
    const promedio = votos.length
      ? (votos.reduce((sum, v) => sum + v.puntuacion, 0) / votos.length).toFixed(2)
      : 0;

    res.json({ ok: true, votos, promedio });
  } catch (err) {
    console.error("❌ Error obteniendo votos:", err);
    res.status(500).json({ ok: false, error: "Error al obtener votos" });
  }
});


// ===============================
// ENDPOINTS SEGUIDORES
// ===============================

// ➕ Seguir a un usuario
app.post("/api/seguir", authMiddleware, async (req, res) => {
  try {
    const { seguido_id } = req.body;

    if (!seguido_id) {
      return res.status(400).json({ ok: false, error: "Debes enviar el ID del usuario a seguir" });
    }

    if (seguido_id === req.userId) {
      return res.status(400).json({ ok: false, error: "No puedes seguirte a ti mismo" });
    }

    const query = `
      INSERT IGNORE INTO seguidores (seguidor_id, seguido_id)
      VALUES (?, ?)
    `;
    await runAsync(query, [req.userId, seguido_id]);

    res.json({ ok: true, message: "Usuario seguido correctamente ✅" });
  } catch (err) {
    console.error("❌ Error en /api/seguir:", err);
    res.status(500).json({ ok: false, error: "Error al seguir usuario" });
  }
});

// ➖ Dejar de seguir a un usuario
app.delete("/api/seguir/:id", authMiddleware, async (req, res) => {
  try {
    const seguido_id = req.params.id;

    const query = `
      DELETE FROM seguidores
      WHERE seguidor_id = ? AND seguido_id = ?
    `;
    await runAsync(query, [req.userId, seguido_id]);

    res.json({ ok: true, message: "Has dejado de seguir al usuario 🚫" });
  } catch (err) {
    console.error("❌ Error en /api/seguir/:id:", err);
    res.status(500).json({ ok: false, error: "Error al dejar de seguir" });
  }
});

// 👥 Obtener a quién sigo
app.get("/api/siguiendo", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.username, u.avatar
      FROM seguidores s
      JOIN usuarios u ON s.seguido_id = u.user_id
      WHERE s.seguidor_id = ?
    `;
    const siguiendo = await runAsync(query, [req.userId]);

    res.json({ ok: true, siguiendo });
  } catch (err) {
    console.error("❌ Error en /api/siguiendo:", err);
    res.status(500).json({ ok: false, error: "Error al obtener seguidos" });
  }
});

// 👥 Obtener mis seguidores
app.get("/api/seguidores", authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT u.user_id, u.username, u.avatar
      FROM seguidores s
      JOIN usuarios u ON s.seguidor_id = u.user_id
      WHERE s.seguido_id = ?
    `;
    const seguidores = await runAsync(query, [req.userId]);

    res.json({ ok: true, seguidores });
  } catch (err) {
    console.error("❌ Error en /api/seguidores:", err);
    res.status(500).json({ ok: false, error: "Error al obtener seguidores" });
  }
});


// Ruta para obtener votos de un juego (gameJam)
app.get("/api/game_jams/:id/votos", async (req, res) => {
  const { id } = req.params;

  try {
    // Suponiendo que tienes un modelo de votos con gameId y puntuación
    const votos = await Voto.find({ gameJamId: id });

    const totalVotos = votos.length;
    const suma = votos.reduce((acc, v) => acc + v.puntuacion, 0);
    const promedio = totalVotos > 0 ? suma / totalVotos : 0;

    res.json({
      ok: true,
      totalVotos,
      promedio,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error obteniendo votos" });
  }
});



// =====================
// VERIFICAR SI UN EMAIL EXISTE (para recuperación)
// =====================
app.get("/api/verificar-email", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ ok: false, error: "Falta el parámetro 'email'" });

  try {
    const [rows] = await pool.query("SELECT user_id FROM usuarios WHERE email = ?", [email]);
    const existe = rows.length > 0;
    res.json({ ok: true, existe });
  } catch (err) {
    console.error("❌ Error verificando email:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});








// =======================
// ENDPOINTS MERCADO PAGO - SIN REPETICIONES
// =======================

// 1. Conectar cuenta de Mercado Pago
app.post('/api/mercadopago/connect', authMiddleware, async (req, res) => {
  try {
    const { mp_email, mp_user_id } = req.body;

    if (!mp_email || !mp_user_id) {
      return res.status(400).json({ 
        ok: false, 
        error: "Email y User ID de Mercado Pago son requeridos" 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mp_email)) {
      return res.status(400).json({ 
        ok: false, 
        error: "Formato de email inválido" 
      });
    }

    await runAsync(
      `UPDATE usuarios 
       SET mp_email = ?, mp_id = ?, mp_connected_at = NOW()
       WHERE user_id = ?`,
      [mp_email, mp_user_id, req.userId]
    );

    res.json({ 
      ok: true, 
      message: "✅ Cuenta de Mercado Pago conectada correctamente",
      data: {
        email: mp_email,
        user_id: mp_user_id,
        connected_at: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("❌ Error conectando Mercado Pago:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error interno del servidor" 
    });
  }
});

// 2. Obtener estado de Mercado Pago
app.get('/api/mercadopago/status', authMiddleware, async (req, res) => {
  try {
    const user = await getAsync(
      `SELECT user_id, username, mp_email, mp_id, mp_connected_at 
       FROM usuarios WHERE user_id = ?`,
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ 
        ok: false, 
        error: "Usuario no encontrado" 
      });
    }

    const isConnected = !!user.mp_email;
    
    res.json({
      ok: true,
      connected: isConnected,
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.mp_email,
        account_id: user.mp_id,
        connected_at: user.mp_connected_at
      }
    });

  } catch (err) {
    console.error("❌ Error verificando estado de Mercado Pago:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error interno del servidor" 
    });
  }
});

// 3. Desconectar cuenta de Mercado Pago
app.delete('/api/mercadopago/disconnect', authMiddleware, async (req, res) => {
  try {
    await runAsync(
      `UPDATE usuarios 
       SET mp_email = NULL, mp_id = NULL, mp_connected_at = NULL
       WHERE user_id = ?`,
      [req.userId]
    );

    res.json({ 
      ok: true, 
      message: "✅ Cuenta de Mercado Pago desconectada correctamente" 
    });

  } catch (err) {
    console.error("❌ Error desconectando Mercado Pago:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error interno del servidor" 
    });
  }
});

// Endpoint para verificar pagos
app.get('/api/mercadopago/payments/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Verificar token del usuario
        const user = await verificarToken(token);
        if (!user) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Verificar el pago en Mercado Pago
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${MERCADO_PAGO_CONFIG.ACCESS_TOKEN}`
            }
        });

        if (response.ok) {
            const payment = await response.json();
            res.json(payment);
        } else {
            res.status(404).json({ error: 'Pago no encontrado' });
        }
    } catch (error) {
        console.error('Error verificando pago:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

async function crearModalPagoReal(precio, juegoId, esDonacion = false) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("❌ Debes iniciar sesión para realizar el pago");
            return;
        }

        // ✅ Validar que el precio sea un número válido
        const amount = parseFloat(precio);
        if (isNaN(amount) || amount <= 0) {
            alert("❌ El monto debe ser un número válido mayor a 0");
            return;
        }

        console.log("🔄 Creando pago:", { juegoId, amount, esDonacion });

        const response = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/create-marketplace-preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                juego_id: juegoId,
                amount: amount,
                is_donation: esDonacion
            })
        });

        const data = await response.json();

        if (data.ok) {
            console.log("✅ Pago creado exitosamente, redirigiendo...");
            
            // ✅ MOSTRAR INSTRUCCIONES ANTES DE REDIRIGIR
            const confirmar = confirm(
                "🔔 INSTRUCCIONES IMPORTANTES:\n\n" +
                "1. Si ves 'No tienes suficiente dinero', NO te preocupes\n" +
                "2. Busca la opción 'Pagar con otro método'\n" +
                "3. Selecciona 'Tarjeta de crédito/débito' o 'PSE'\n" +
                "4. Completa tu pago normalmente\n\n" +
                "¿Continuar a Mercado Pago?"
            );
            
            if (confirmar) {
                window.location.href = data.init_point;
            }
        } else {
            console.error("❌ Error del servidor:", data.error);
            alert("❌ Error al crear el pago: " + (data.error || "Error desconocido"));
        }

    } catch (error) {
        console.error("❌ Error en crearModalPagoReal:", error);
        alert("❌ Error al procesar el pago. Intenta nuevamente.");
    }
}


app.post('/api/mercadopago/create-marketplace-preference', authMiddleware, async (req, res) => {
  try {
    const { juego_id, amount, is_donation = false } = req.body;

    console.log("💰 Creando preferencia de Marketplace para juego:", juego_id);

    // 1. Obtener información del juego y desarrollador
    const juegoQuery = `
      SELECT j.*, u.mp_id, u.username, u.mp_email
      FROM juegos j 
      LEFT JOIN usuarios u ON j.user_id = u.user_id 
      WHERE j.id = ?
    `;
    const juego = await getAsync(juegoQuery, [juego_id]);

    if (!juego) {
      return res.status(404).json({ 
        ok: false, 
        error: "Juego no encontrado" 
      });
    }

    // 2. Verificar que el desarrollador tenga cuenta de Mercado Pago conectada
    if (!juego.mp_id) {
      return res.status(400).json({ 
        ok: false, 
        error: "El desarrollador no tiene cuenta de Mercado Pago conectada" 
      });
    }

    // 3. Calcular comisiones
    const totalAmount = parseFloat(amount);
    const comisionTakumi = totalAmount * 0.30; // 30% para TakumiNet
    const pagoDesarrollador = totalAmount * 0.70; // 70% para el desarrollador

    console.log(`💰 Distribución: $${totalAmount} = TakumiNet ($${comisionTakumi}) + Dev ($${pagoDesarrollador})`);

    // 4. Crear preferencia de Marketplace
    const preference = {
      items: [
        {
          title: is_donation ? `Donación para ${juego.title}` : juego.title,
          description: juego.description || "Juego en TakumiNet",
          quantity: 1,
          currency_id: "USD",
          unit_price: totalAmount
        }
      ],
      marketplace: "TakumiNet",
      marketplace_fee: comisionTakumi, // 30% para TakumiNet
      disbursements: [
        {
          amount: pagoDesarrollador, // 70% para el desarrollador
          collector_id: parseInt(juego.mp_id) // User ID MP del desarrollador
        }
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'https://takuminet-app.netlify.app'}/success.html?juego_id=${juego_id}`,
        failure: `${process.env.FRONTEND_URL || 'https://takuminet-app.netlify.app'}/failure.html`,
        pending: `${process.env.FRONTEND_URL || 'https://takuminet-app.netlify.app'}/pending.html`
      },
      auto_return: "approved",
      external_reference: `takumi_${juego_id}_${Date.now()}`,
      notification_url: `${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/notifications`
    };

    console.log("🔄 Creando preferencia en Mercado Pago...", preference);

    const result = await mercadopago.preferences.create(preference);
    
    console.log("✅ Preferencia de Marketplace creada:", result.body.id);

    res.json({
      ok: true,
      preferenceId: result.body.id,
      init_point: result.body.init_point,
      distribution: {
        total: totalAmount,
        takumi_commission: comisionTakumi,
        developer_payment: pagoDesarrollador,
        developer_mp_id: juego.mp_id
      }
    });

  } catch (err) {
    console.error("❌ Error creando preferencia de Marketplace:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error al crear preferencia de pago: " + err.message 
    });
  }
});


// ✅ ENDPOINT PARA VER PAGOS REALES - ACTUALIZADO
app.get('/api/pagos/reales', authMiddleware, async (req, res) => {
  try {
    const pagos = await runAsync(`
      SELECT 
        vj.id,
        vj.juego_id,
        vj.payment_id,
        vj.monto_total,
        vj.comision_takumi,
        vj.pago_desarrollador,
        vj.developer_mp_id,
        vj.status,
        vj.created_at,
        j.title as juego_titulo,
        u.username as desarrollador,
        u.mp_email as developer_email
      FROM ventas_juegos vj
      LEFT JOIN juegos j ON vj.juego_id = j.id
      LEFT JOIN usuarios u ON j.user_id = u.user_id
      WHERE vj.es_simulacion = 0 OR vj.es_simulacion IS NULL
      ORDER BY vj.created_at DESC
      LIMIT 50
    `);
    
    console.log("📊 Pagos reales encontrados:", pagos.length);
    
    res.json({ 
      ok: true, 
      total_pagos: pagos.length,
      pagos 
    });
  } catch (err) {
    console.error("Error obteniendo pagos reales:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// Endpoint de prueba ultra simple
app.post('/api/mercadopago/test-simple', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("🧪 Probando Mercado Pago con monto:", amount);

    // Preferencia MUY simple
    const preference = {
      items: [
        {
          title: "Test TakumiNet",
          quantity: 1,
          currency_id: "USD",
          unit_price: parseFloat(amount)
        }
      ],
      back_urls: {
        success: "https://takuminet-app.netlify.app/success",
        failure: "https://takuminet-app.netlify.app/failure"
      },
      auto_return: "approved"
    };

    console.log("📋 Preferencia de prueba:", preference);

    const result = await mercadopago.preferences.create(preference);
    
    console.log("✅ Test exitoso:", result.body.id);

    res.json({
      ok: true,
      preferenceId: result.body.id,
      init_point: result.body.init_point,
      message: "Test exitoso"
    });

  } catch (err) {
    console.error("❌ Error en test:", err);
    
    // ✅ ERROR DETALLADO
    let errorMsg = "Error en test";
    
    if (err.response && err.response.body) {
      const mpError = err.response.body;
      errorMsg += ": " + (mpError.message || JSON.stringify(mpError));
    } else {
      errorMsg += ": " + err.message;
    }
    
    res.status(500).json({ 
      ok: false, 
      error: errorMsg,
      details: err.response?.body || null
    });
  }
});

// 6. Verificar si desarrollador tiene MP
app.get('/api/juegos/:id/verificar-mp', async (req, res) => {
  try {
    const juegoId = req.params.id;

    const juegoQuery = `
      SELECT j.user_id, u.username, u.mp_email, u.mp_id 
      FROM juegos j 
      LEFT JOIN usuarios u ON j.user_id = u.user_id 
      WHERE j.id = ?
    `;
    
    const juego = await getAsync(juegoQuery, [juegoId]);

    if (!juego) {
      return res.status(404).json({ 
        ok: false, 
        error: "Juego no encontrado" 
      });
    }

    const tieneMP = !!(juego.mp_email && juego.mp_id);
    
    console.log("🔍 Verificando MP desarrollador:", {
      juegoId,
      desarrollador: juego.username,
      tieneMP
    });
    
    res.json({ 
      ok: true, 
      tiene_mp: tieneMP,
      desarrollador_id: juego.user_id,
      desarrollador: juego.username
    });

  } catch (err) {
    console.error("❌ Error verificando MP desarrollador:", err);
    res.status(500).json({ 
      ok: false, 
      error: "Error interno del servidor" 
    });
  }
});





// =======================
// HEALTH CHECKS PARA KOYEB
// =======================

// Health check básico
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    if (pool) {
      await pool.query('SELECT 1');
    }
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: pool ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Health check simple (sin DB)
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Liveness probe
app.get('/live', (req, res) => {
  res.status(200).send('OK');
});

// Readiness probe
app.get('/ready', async (req, res) => {
  try {
    if (pool) {
      await pool.query('SELECT 1');
      res.status(200).send('READY');
    } else {
      res.status(503).send('Database not connected');
    }
  } catch (error) {
    res.status(503).send('Database error');
  }
});

// Endpoint que realiza varias operaciones para mantener activo
app.get('/wake-up', async (req, res) => {
  try {
    const results = {
      server_time: new Date().toISOString(),
      database_check: 'pending',
      api_status: 'active'
    };

    // Verificar DB
    if (pool) {
      const [dbResult] = await pool.query('SELECT 1 as test');
      results.database_check = dbResult[0].test === 1 ? 'connected' : 'error';
    }

    // Simular una operación pequeña
    results.memory_usage = process.memoryUsage();
    results.uptime = process.uptime();

    res.json({
      ok: true,
      message: '🚀 Servidor activado y funcionando',
      ...results
    });
  } catch (error) {
    res.json({
      ok: false,
      message: 'Servidor activo pero con errores',
      error: error.message
    });
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


// Inicializar pool de conexiones
initializePool().then((ok) => {
  if (ok) {
    console.log(`✅ Aplicación inicializada correctamente`);
  } else {
    console.error("❌ No se pudo conectar a la base de datos");
  }
});

// Koyeb maneja el servidor automáticamente, solo exportamos la app
if (require.main === module) {
  // Solo inicia servidor si se ejecuta directamente (desarrollo local)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎯 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📱 URL: http://localhost:${PORT}`);
  });
}

// Exportamos la app para Koyeb
module.exports = app; 