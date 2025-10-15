// ============================
// PERFIL DE JUEGO - CARGA RÁPIDA Y ANIMADA
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://localhost:3001";
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");

  const loader = document.createElement("div");
  loader.id = "page-loader";
  loader.innerHTML = `<div class="spinner"></div>`;
  document.body.appendChild(loader);

  const mainContent = document.getElementById("contenido-principal");
  if (mainContent) mainContent.style.opacity = 0;

  if (!juegoId) {
    alert("No se ha especificado el juego");
    loader.remove();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`);
    const data = await res.json();

    if (!data.ok) throw new Error(data.error || "Error al cargar el juego");
    const juego = data.juego;

    // === Título y descripción ===
    document.getElementById("titulo-juego").textContent = juego.title || "Sin título";
    document.getElementById("descripcion-juego").textContent = juego.description || "Sin descripción";

    // === Video de YouTube HD ===
    const youtube = document.getElementById("youtube-video");
    if (juego.youtube_url) {
      const embedUrl = toYouTubeEmbed(juego.youtube_url);
      if (embedUrl) youtube.src = embedUrl;
      else youtube.style.display = "none";
    } else youtube.style.display = "none";

    // === Galería ===
    const galeria = document.getElementById("galeria-capturas");
    galeria.innerHTML = "";
    let screenshots = juego.screenshots || [];
    if (typeof screenshots === "string") {
      try { screenshots = JSON.parse(screenshots); } catch { screenshots = []; }
    }

    if (Array.isArray(screenshots) && screenshots.length > 0) {
      screenshots.forEach(src => {
        const img = document.createElement("img");
        img.src = src.hd || src.thumb || src;
        img.alt = "Captura del juego";
        img.className = "captura-img";
        galeria.appendChild(img);
      });
      activarZoom();
    } else {
      galeria.innerHTML = "<p>No hay capturas disponibles</p>";
    }

    // === Requisitos mínimos ===
    setText("so-min", juego.min_os);
    setText("procesador-min", juego.min_cpu);
    setText("ram-min", juego.min_ram);
    setText("gpu-min", juego.min_gpu);
    setText("almacenamiento-min", juego.min_storage);

    // === Requisitos recomendados ===
    setText("so-rec", juego.rec_os);
    setText("procesador-rec", juego.rec_cpu);
    setText("ram-rec", juego.rec_ram);
    setText("gpu-rec", juego.rec_gpu);
    setText("almacenamiento-rec", juego.rec_storage);

    // Mostrar contenido con animación
    setTimeout(() => {
      loader.style.opacity = 0;
      setTimeout(() => loader.remove(), 500);
      if (mainContent) mainContent.style.opacity = 1;
    }, 400);

  } catch (err) {
    console.error("Error al cargar los datos del juego:", err);
    alert("Error al cargar la información del juego.");
    loader.remove();
  }
});

// ============================
// FUNCIONES AUXILIARES
// ============================
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "N/A";
}

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    let videoId = "";
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      videoId = u.searchParams.get("v");
    } else if (u.hostname.includes("youtu.be")) {
      videoId = u.pathname.slice(1);
    } else {
      return null;
    }
    return `https://www.youtube.com/embed/${videoId}?vq=hd1080&rel=0&showinfo=0`;
  } catch {
    return null;
  }
}

// ============================
// LIGHTBOX PROFESIONAL HD
// ============================
let currentIndex = 0;
let imagenes = [];

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxLoader = document.getElementById("lightbox-loader");
const closeBtn = document.querySelector(".close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

function openLightbox(index) {
  currentIndex = index;
  lightbox.style.display = "flex";
  cargarImagenHD(imagenes[currentIndex].dataset.hd || imagenes[currentIndex].src);
}

function closeLightbox() {
  lightbox.style.display = "none";
}

function changeImage(step) {
  currentIndex = (currentIndex + step + imagenes.length) % imagenes.length;
  cargarImagenHD(imagenes[currentIndex].dataset.hd || imagenes[currentIndex].src);
}

function cargarImagenHD(src) {
  lightboxLoader.style.display = "block";
  lightboxImg.style.opacity = 0;
  const tempImg = new Image();
  tempImg.src = src;
  tempImg.onload = () => {
    lightboxImg.src = src;
    lightboxLoader.style.display = "none";
    lightboxImg.style.opacity = 1;
  };
}

function activarZoom() {
  imagenes = Array.from(document.querySelectorAll("#galeria-capturas img"));
  imagenes.forEach((img, i) => {
    img.style.cursor = "pointer";
    img.dataset.hd = img.src;
    img.addEventListener("click", () => openLightbox(i));
  });
}

closeBtn?.addEventListener("click", closeLightbox);
prevBtn?.addEventListener("click", () => changeImage(-1));
nextBtn?.addEventListener("click", () => changeImage(1));

lightbox?.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", e => {
  if (lightbox?.style.display === "flex") {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") changeImage(-1);
    if (e.key === "ArrowRight") changeImage(1);
  }
});
