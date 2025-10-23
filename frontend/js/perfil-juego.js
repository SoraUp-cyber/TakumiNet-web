// ============================
// PERFIL DE JUEGO - CARGAR DATOS OPTIMIZADO
// ============================
document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'https://grim-britte-takuminet-backend-c7daca2c.koyeb.app';
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get('id');

  if (!juegoId) {
    alert('No se ha especificado el juego');
    return;
  }

  try {
    // 🔹 Fetch principal
    const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error al cargar el juego');

    const juego = data.juego;

    // 🔹 Mostrar título y descripción inmediatamente
    safeUpdate('titulo-juego', juego.title || 'Sin título');
    safeUpdate('descripcion-juego', juego.description || 'Sin descripción');

    // 🔹 Cargar contenido pesado en segundo plano
    setTimeout(() => {
      cargarVideo(juego.youtube_url);
      cargarGaleria(juego.screenshots);
      cargarRequisitos(juego);
    }, 50);

  } catch (err) {
    console.error('Error crítico al cargar juego:', err);
    safeUpdate('descripcion-juego', 'Error al cargar el juego');
  }
});

// ============================
// FUNCIONES AUXILIARES
// ============================
function safeUpdate(id, content) {
  const el = document.getElementById(id);
  if (el) el.textContent = content || 'N/A';
}

// --------------------
// VIDEO
// --------------------
function cargarVideo(url) {
  const youtube = document.getElementById('youtube-video');
  if (!youtube) return;
  if (!url) return youtube.style.display = 'none';

  const embedUrl = toYouTubeEmbed(url);
  if (!embedUrl) return youtube.style.display = 'none';

  youtube.src = embedUrl;
}

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    let id = '';
    if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v');
    else if (u.hostname.includes('youtu.be')) id = u.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}?vq=hd1080&rel=0&showinfo=0` : null;
  } catch {
    return null;
  }
}

// --------------------
// GALERÍA Y LIGHTBOX
// --------------------
let currentIndex = 0;
let imagenes = [];

function cargarGaleria(screenshots) {
  const galeria = document.getElementById('galeria-capturas');
  if (!galeria) return;
  galeria.innerHTML = '';

  if (!screenshots) {
    galeria.innerHTML = '<p>No hay capturas disponibles</p>';
    return;
  }

  if (typeof screenshots === 'string') {
    try { screenshots = JSON.parse(screenshots); } catch { screenshots = [screenshots]; }
  }

  if (!Array.isArray(screenshots) || screenshots.length === 0) {
    galeria.innerHTML = '<p>No hay capturas disponibles</p>';
    return;
  }

  screenshots.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src.hd || src.thumb || src;
    img.alt = `Captura ${i+1}`;
    img.className = 'captura-img';
    img.loading = 'lazy';
    img.dataset.hd = img.src;
    galeria.appendChild(img);
  });

  activarLightbox();
}

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const loader = document.getElementById("lightbox-loader");
const closeBtn = document.querySelector(".close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

function activarLightbox() {
  imagenes = Array.from(document.querySelectorAll("#galeria-capturas img"));
  imagenes.forEach((img, i) => {
    img.style.cursor = "pointer";
    img.addEventListener("click", () => openLightbox(i));
  });
}

function openLightbox(index) {
  currentIndex = index;
  lightbox.style.display = "flex";
  cargarImagenHD(imagenes[currentIndex].dataset.hd);
}

function closeLightbox() { lightbox.style.display = "none"; }

function changeImage(step) {
  currentIndex = (currentIndex + step + imagenes.length) % imagenes.length;
  cargarImagenHD(imagenes[currentIndex].dataset.hd);
}

function cargarImagenHD(src) {
  loader.style.display = "block";
  lightboxImg.style.opacity = 0;
  const temp = new Image();
  temp.src = src;
  temp.onload = () => {
    lightboxImg.src = src;
    loader.style.display = "none";
    lightboxImg.style.opacity = 1;
  };
}

// Eventos Lightbox
closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", () => changeImage(-1));
nextBtn.addEventListener("click", () => changeImage(1));
lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", e => {
  if (lightbox.style.display === "flex") {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") changeImage(-1);
    if (e.key === "ArrowRight") changeImage(1);
  }
});

// --------------------
// REQUISITOS DEL SISTEMA
// --------------------
function cargarRequisitos(juego) {
  const reqs = [
    { id:'so-min', value:juego.min_os },
    { id:'procesador-min', value:juego.min_cpu },
    { id:'ram-min', value:juego.min_ram },
    { id:'gpu-min', value:juego.min_gpu },
    { id:'almacenamiento-min', value:juego.min_storage },
    { id:'so-rec', value:juego.rec_os },
    { id:'procesador-rec', value:juego.rec_cpu },
    { id:'ram-rec', value:juego.rec_ram },
    { id:'gpu-rec', value:juego.rec_gpu },
    { id:'almacenamiento-rec', value:juego.rec_storage }
  ];

  reqs.forEach(r => safeUpdate(r.id, r.value));
}
