// =======================
// MÓDULOS NATIVOS DE NODE
// =======================
const fs = require("fs");
const path = require("path");

// =======================
// FRAMEWORKS Y CORE
// =======================
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const multer = require("multer"); // Para subir archivos

// =======================
// SEGURIDAD Y AUTENTICACIÓN
// =======================
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dl5bjlhnv",
  api_key: "793396746524197",
  api_secret: "dSNF4TYc93A_mHFb7teDrKSUmq0",
});

// =======================
// CONFIGURACIÓN DEL ENTORNO
// =======================
require("dotenv").config();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || "TAKUMINET_SUPER_SEGURO_2025";

const mysql = require("mysql2/promise");

const dbConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "2001",
  database: "TakumiNet",
  port: 3307,
};

// =======================
// APP EXPRESS
// =======================
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// =======================
// RATE LIMITER LOGIN/REGISTER
// =======================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "⚠️ Demasiados intentos, intenta más tarde."
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

// =======================
// CARPETA PÚBLICA
// =======================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// MULTER CONFIG (AVATAR)
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `avatar_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// =======================
// VARIABLES GLOBALES
// =======================
let pool; // Pool de MariaDB

// =======================
// INICIALIZAR POOL DE CONEXIONES
// =======================
// Inicializar pool de conexiones
pool = mysql.createPool(dbConfig);

pool.getConnection()
  .then(conn => {
    console.log("✅ Pool de base de datos inicializado");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Error al inicializar el pool de base de datos:", err);
    process.exit(1);
  });

// =======================
// HELPERS MariaDB
// =======================
const runAsync = async (query, params = []) => {
  try {
    if (!pool) {
      throw new Error("Pool de base de datos no inicializado");
    }
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error("❌ Error SQL:", err);
    throw err;
  }
};

const getAsync = async (query, params = []) => {
  const rows = await runAsync(query, params);
  return rows[0] || null;
};




// =======================
// ENDPOINTS
// =======================

// =====================
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
//editar user
// =====================
app.put("/api/user/editar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.userId; // ID del token

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
      avatar
    } = req.body;

    // Obtener usuario actual
    const user = await getAsync("SELECT * FROM usuarios WHERE user_id=?", [userId]);
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    // =========================
    // Manejo de contraseña
    // =========================
    let hashedPassword = user.password;
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ ok: false, error: "Debes enviar la contraseña actual" });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ ok: false, error: "Contraseña actual incorrecta" });
      hashedPassword = await bcrypt.hash(newPassword, 10);
    }

    // =========================
    // Manejo de avatar
    // =========================
    let avatarUrl = user.avatar;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "takuminet/avatars",
        public_id: `avatar_${userId}_${Date.now()}`,
        overwrite: true,
      });
      avatarUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } else if (avatar) {
      avatarUrl = avatar; // URL enviada desde frontend
    }

    // =========================
    // Actualizar todos los campos
    // =========================
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
      username,
      hashedPassword,
      avatarUrl,
      descripcion,
      contacto_email,
      twitter,
      instagram,
      youtube,
      discord,
      userId
    ]);

    res.json({ ok: true, mensaje: "Perfil actualizado correctamente", avatar: avatarUrl });

  } catch (err) {
    console.error("❌ Error actualizando perfil:", err);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});



// =======================
// 2️⃣ SUBIR SOLO AVATAR A CLOUDINARY
// =======================
app.post("/api/user/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Archivo no enviado" });
    }

    // 📤 Subir a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "takuminet/avatars",
      public_id: `avatar_${req.userId}_${Date.now()}`,
      overwrite: true,
    });

    // Guardar URL segura en la DB
    await runAsync("UPDATE usuarios SET avatar=? WHERE user_id=?", [result.secure_url, req.userId]);

    // Eliminar archivo local
    fs.unlinkSync(req.file.path);

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







app.post("/api/foros", authMiddleware, upload.single("imagen"), async (req, res) => {
  try {
    const { titulo, categoria, descripcion, etiquetas } = req.body;
    if (!titulo || !categoria || !descripcion) {
      return res.status(400).json({ ok: false, error: "Campos obligatorios faltantes" });
    }

    let imagenUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "takuminet/foros",
        public_id: `foro_${Date.now()}`,
        overwrite: true,
      });
      imagenUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const sql = `
      INSERT INTO foros
      (user_id, titulo, categoria, descripcion, etiquetas, imagen_url)
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

    // ✅ Devuelve JSON siempre, aunque haya imagen o no
    return res.json({ ok: true, id: result.insertId, mensaje: "Foro creado correctamente", imagenUrl });

  } catch (err) {
    console.error("❌ Error creando foro:", err);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
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
// ENDPOINT SUBIR JUEGO (ACTUALIZADO)
// =======================
app.post("/api/juegos", authMiddleware, async (req, res) => {
  try {
    const data = req.body;

    // Validación básica
    if (!data.title || !data.description) {
      return res.status(400).json({ ok: false, error: "Título y descripción obligatorios" });
    }

    let coverUrl = null;
    let screenshotsUrls = [];

    // 📤 Subir portada (base64)
    if (data.cover_base64) {
      try {
        const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${data.cover_base64}`, {
          folder: "takuminet/games/cover",
          public_id: `cover_${Date.now()}`,
          overwrite: true,
        });
        coverUrl = result.secure_url;
        console.log("✅ Portada subida a Cloudinary:", coverUrl);
      } catch (cloudinaryError) {
        console.error("❌ Error subiendo portada a Cloudinary:", cloudinaryError);
        return res.status(500).json({ ok: false, error: "Error al subir la portada" });
      }
    }

    // 📤 Subir capturas (array base64)
    if (data.screenshots_base64 && data.screenshots_base64.length > 0) {
      try {
        for (const [i, ssBase64] of data.screenshots_base64.entries()) {
          const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${ssBase64}`, {
            folder: "takuminet/games/screenshots",
            public_id: `ss_${Date.now()}_${i}`,
            overwrite: true,
          });
          screenshotsUrls.push(result.secure_url);
        }
        console.log("✅ Capturas subidas a Cloudinary:", screenshotsUrls.length);
      } catch (cloudinaryError) {
        console.error("❌ Error subiendo capturas a Cloudinary:", cloudinaryError);
        return res.status(500).json({ ok: false, error: "Error al subir las capturas" });
      }
    }

    const screenshotsJSON = JSON.stringify(screenshotsUrls);

    // Mapear pricing values a inglés para la base de datos
    const pricingMap = {
      'free': 'free',
      'paid': 'paid', 
      'donation': 'donation',
      'gratis': 'free',
      'pago': 'paid',
      'donacion': 'donation'
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
      req.userId, // ID usuario del token
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

    console.log("📝 Valores para INSERT:", values);

    const result = await runAsync(query, values);

    res.json({
      ok: true,
      message: "Juego publicado con éxito 🎮",
      id: result.insertId,
      cover: coverUrl,
      screenshots: screenshotsUrls,
    });

  } catch (err) {
    console.error("❌ Error subiendo juego:", err);
    res.status(500).json({ ok: false, error: "Error al subir juego: " + err.message });
  }
});




// =======================
// ENDPOINT OBTENER JUEGOS
// =======================
app.get("/api/juegos", async (req, res) => {
  try {
    const query = `
      SELECT j.id, j.title, j.description, j.category, j.main_genre,
             j.cover, j.screenshots, j.youtube_url, j.pricing, j.price,
             j.storage_service, j.mediafire_url, j.created_at,
             u.user_id, u.username, u.avatar
      FROM juegos j
      LEFT JOIN usuarios u ON j.user_id = u.user_id
      ORDER BY j.created_at DESC
    `;

    const rows = await runAsync(query);

    // Procesar las capturas (JSON string a array)
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


// Helper para obtener todos los resultados (ya que getAsync devuelve solo 1)
const allAsync = async (query, params = []) => {
  const rows = await runAsync(query, params);
  return rows; // devuelve todos los registros
};

// =======================
// ENDPOINT: Obtener juego por ID con datos del usuario y otros juegos
// =======================
app.get("/api/juegos/:id", async (req, res) => {
  const gameId = req.params.id;

  try {
    // 1️⃣ Obtener el juego y datos del usuario
    const query = `
      SELECT j.*, 
             u.username, 
             u.avatar, 
             u.descripcion, 
             u.contacto_email, 
             u.twitter, 
             u.instagram, 
             u.youtube, 
             u.discord
      FROM juegos j 
      LEFT JOIN usuarios u ON j.user_id = u.user_id 
      WHERE j.id = ?
    `;
    const juego = await getAsync(query, [gameId]);

    if (!juego) return res.status(404).json({ ok: false, error: "Juego no encontrado" });

    // Procesar capturas si existen
    juego.screenshots = juego.screenshots ? JSON.parse(juego.screenshots) : [];

    // 2️⃣ Obtener otros juegos del mismo usuario
    const otrosJuegosQuery = `
      SELECT id, title, cover 
      FROM juegos 
      WHERE user_id = ? AND id != ?
    `;
    const otrosJuegos = await allAsync(otrosJuegosQuery, [juego.user_id, gameId]);

    // 3️⃣ Responder con toda la info
    res.json({ ok: true, juego, otrosJuegos });

  } catch (err) {
    console.error("❌ Error obteniendo juego:", err);
    res.status(500).json({ ok: false, error: "Error al obtener el juego" });
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


// =======================
// INICIAR SERVIDOR
// =======================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});