(async function() {
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";

  // ==========================
  // Normalizar portada del juego
  // ==========================
  function getPortada(juego) {
    if (!juego) return "https://via.placeholder.com/600x300?text=No+Image";
    let portada = juego.cover || null;
    if (!portada) return "https://via.placeholder.com/600x300?text=No+Image";
    if (portada.startsWith("data:image")) return portada;
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(portada.substring(0, 50)) || portada.startsWith("/9j/")) {
      return `data:image/jpeg;base64,${portada}`;
    }
    if (portada.startsWith("http")) return portada;
    return "https://via.placeholder.com/600x300?text=No+Image";
  }

  // ==========================
  // Obtener todos los juegos
  // ==========================
  async function obtenerJuegos() {
    try {
      const resp = await fetch(`${API_BASE}/api/juegos`);
      const data = await resp.json();
      if (!data.ok || !data.juegos) throw new Error("Error cargando juegos");
      return data.juegos;
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  // ==========================
  // Mezclar array y tomar N elementos
  // ==========================
  function tomarAlAzar(array, cantidad) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia.slice(0, cantidad);
  }

  // ==========================
  // Crear slide HTML
  // ==========================
  function crearSlide(juego) {
    const slide = document.createElement('div');
    slide.className = 'slide';

    const precioOriginal = parseFloat(juego.price) || 0;
    const descuento = parseFloat(juego.discount) || 0;
    const precioConDescuento = descuento > 0 ? (precioOriginal * (1 - descuento / 100)).toFixed(2) : precioOriginal.toFixed(2);
    const esGratis = juego.pricing === 'free' || juego.pricing === 'gratis';

    slide.innerHTML = `
      <div class="slide-content">
        <img src="${getPortada(juego)}" alt="${juego.title || ''}" class="slide-img">
        <div class="slide-info">
          <h3>${juego.title || 'Sin título'}</h3>
          <p>${juego.description ? juego.description.substring(0, 100) + '...' : 'Sin descripción disponible'}</p>
          <div class="juego-precios ${esGratis ? 'gratis' : ''}">
            ${esGratis 
              ? 'Gratis'
              : descuento > 0
                ? `<span class="precio-original">$${precioOriginal}</span> → <span class="precio-descuento">$${precioConDescuento}</span> <span class="porcentaje-descuento">-${descuento}%</span>`
                : `<span>$${precioOriginal}</span>`
            }
          </div>
        </div>
      </div>
    `;

    slide.addEventListener('click', () => {
      window.location.href = `perfil-juegos.html?id=${juego.id}`;
    });

    return slide;
  }

  // ==========================
  // Inicializar Carousel
  // ==========================
  function initCarousel(slidesContainer) {
    let currentIndex = 0;
    const slides = slidesContainer.children;

    function showSlide(index) {
      currentIndex = (index + slides.length) % slides.length;
      Array.from(slides).forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });
    }

    showSlide(0);
    setInterval(() => showSlide(currentIndex + 1), 5000);
  }

  // ==========================
  // Cargar y renderizar Carousel
  // ==========================
  async function cargarCarousel() {
    const slidesContainer = document.getElementById('carousel-slides');
    slidesContainer.innerHTML = '';

    let juegos = await obtenerJuegos();
    if (juegos.length === 0) {
      slidesContainer.innerHTML = '<p>No hay juegos para mostrar.</p>';
      return;
    }

    // Tomar solo 5 juegos al azar
    juegos = tomarAlAzar(juegos, 5);

    juegos.forEach(juego => {
      slidesContainer.appendChild(crearSlide(juego));
    });

    initCarousel(slidesContainer);
  }

  document.addEventListener('DOMContentLoaded', cargarCarousel);

})();
