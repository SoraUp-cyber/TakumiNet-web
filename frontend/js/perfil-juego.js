// ============================
// PERFIL DE JUEGO - CARGAR DATOS
// ============================
document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE = 'https://private-mellicent-takuminet-backend-d0a83edb.koyeb.app';
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get('id');

  if (!juegoId) {
    alert('No se ha especificado el juego');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error al cargar el juego');

    const juego = data.juego;

    // === Título y descripción ===
    document.getElementById('titulo-juego').textContent = juego.title || 'Sin título';
    document.getElementById('descripcion-juego').textContent = juego.description || 'Sin descripción';

    // === Video de YouTube HD 1080p ===
    const youtube = document.getElementById('youtube-video');
    function toYouTubeEmbed(url) {
      try {
        const u = new URL(url);
        let videoId = '';
        if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
          videoId = u.searchParams.get('v');
        } else if (u.hostname.includes('youtu.be')) {
          videoId = u.pathname.slice(1); // quitar la barra inicial
        } else {
          return null;
        }
        // Forzar HD 1080p
        return `https://www.youtube.com/embed/${videoId}?vq=hd1080&rel=0&showinfo=0`;
      } catch {
        return null;
      }
    }
    if (juego.youtube_url) {
      const embedUrl = toYouTubeEmbed(juego.youtube_url);
      if (embedUrl) youtube.src = embedUrl;
      else youtube.style.display = 'none';
    } else youtube.style.display = 'none';

    // === Galería de capturas ===
    const galeria = document.getElementById('galeria-capturas');
    galeria.innerHTML = '';
    let screenshots = juego.screenshots || [];
    if (typeof screenshots === "string") {
      try { screenshots = JSON.parse(screenshots); } catch { screenshots = []; }
    }

    if (Array.isArray(screenshots) && screenshots.length > 0) {
      screenshots.forEach(src => {
        const img = document.createElement('img');
        // Cargar HD si existe
        img.src = src.hd || src.thumb || src;
        img.alt = 'Captura del juego';
        img.className = 'captura-img';
        galeria.appendChild(img);
      });
      activarZoom();
    } else {
      galeria.innerHTML = '<p>No hay capturas disponibles</p>';
    }

    // === Requisitos mínimos ===
    document.getElementById('so-min').textContent = juego.min_os || 'N/A';
    document.getElementById('procesador-min').textContent = juego.min_cpu || 'N/A';
    document.getElementById('ram-min').textContent = juego.min_ram || 'N/A';
    document.getElementById('gpu-min').textContent = juego.min_gpu || 'N/A';
    document.getElementById('almacenamiento-min').textContent = juego.min_storage || 'N/A';

    // === Requisitos recomendados ===
    document.getElementById('so-rec').textContent = juego.rec_os || 'N/A';
    document.getElementById('procesador-rec').textContent = juego.rec_cpu || 'N/A';
    document.getElementById('ram-rec').textContent = juego.rec_ram || 'N/A';
    document.getElementById('gpu-rec').textContent = juego.rec_gpu || 'N/A';
    document.getElementById('almacenamiento-rec').textContent = juego.rec_storage || 'N/A';

  } catch (err) {
    console.error('Error al cargar los datos del juego:', err);
  }
});

// ============================
// LIGHTBOX PROFESIONAL HD
// ============================
let currentIndex = 0;
let imagenes = [];

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const loader = document.getElementById("lightbox-loader");
const closeBtn = document.querySelector(".close");
const prevBtn = document.querySelector(".prev");
const nextBtn = document.querySelector(".next");

// Abrir Lightbox en la imagen clickeada
function openLightbox(index) {
  currentIndex = index;
  lightbox.style.display = "flex";
  cargarImagenHD(imagenes[currentIndex].dataset.hd || imagenes[currentIndex].src);
}

// Cerrar Lightbox
function closeLightbox() {
  lightbox.style.display = "none";
}

// Cambiar imagen
function changeImage(step) {
  currentIndex = (currentIndex + step + imagenes.length) % imagenes.length;
  cargarImagenHD(imagenes[currentIndex].dataset.hd || imagenes[currentIndex].src);
}

// Cargar imagen HD con loader
function cargarImagenHD(src) {
  loader.style.display = "block";
  lightboxImg.style.opacity = 0;
  const tempImg = new Image();
  tempImg.src = src;
  tempImg.onload = () => {
    lightboxImg.src = src;
    loader.style.display = "none";
    lightboxImg.style.opacity = 1;
  };
}

// Activar zoom en galería
function activarZoom() {
  imagenes = Array.from(document.querySelectorAll("#galeria-capturas img"));
  imagenes.forEach((img, i) => {
    img.style.cursor = "pointer";
    // Guardar URL HD
    img.dataset.hd = img.src;
    img.addEventListener("click", () => openLightbox(i));
  });
}

// Eventos Lightbox
closeBtn.addEventListener("click", closeLightbox);
prevBtn.addEventListener("click", () => changeImage(-1));
nextBtn.addEventListener("click", () => changeImage(1));

lightbox.addEventListener("click", e => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", e => {
  if (lightbox.style.display === "flex") {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") changeImage(-1);
    if (e.key === "ArrowRight") changeImage(1);
  }
});
