// ==========================
// Utils
// ==========================
const qs = (selector) => document.querySelector(selector);

function obtenerIdDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id'); // ejemplo: ?id=5
}

function formatFecha(fechaStr) {
  if (!fechaStr) return 'No disponible';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// ==========================
// Contador dinámico
// ==========================
function iniciarContador(fechaFinStr, elemento) {
  if (!fechaFinStr || !elemento) return;
  const fechaFin = new Date(fechaFinStr);
  let intervalo;

  function actualizar() {
    const ahora = new Date();
    const diff = fechaFin - ahora;

    if (diff <= 0) {
      elemento.textContent = 'Finalizado';
      clearInterval(intervalo);
      return;
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diff / (1000 * 60)) % 60);
    const segundos = Math.floor((diff / 1000) % 60);

    elemento.textContent = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
  }

  actualizar();
  intervalo = setInterval(actualizar, 1000);
}

// ==========================
// Pestañas
// ==========================
function inicializarTabs() {
  const tabs = document.querySelectorAll('.header_tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tab.dataset.tab;

      // Activar pestaña
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Mostrar contenido
      document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
      const contenido = document.getElementById(`tab-${target}`);
      if (contenido) contenido.style.display = 'block';
    });
  });
}

// ==========================
// Cargar detalles de la Game Jam
// ==========================
async function cargarDetallesGameJam() {
  const jamId = obtenerIdDesdeURL();
  if (!jamId) {
    console.error('No se proporcionó el ID de la Game Jam.');
    return;
  }

  try {
    const res = await fetch(`https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/game_jams/${jamId}`);
    
    if (!res.ok) {
      console.error('Error HTTP:', res.status, res.statusText);
      return;
    }

    const data = await res.json();
    console.log('Datos recibidos del servidor:', data); // <- útil para depurar

    // Ajusta según tu JSON real
    const jam = data.jam || data.data || null;

    if (!jam) {
      console.error('No se encontró la Game Jam en la respuesta');
      return;
    }

    const map = {
      '#jam-titulo': jam.titulo,
      '#jam-imagen': jam.imagen_portada || 'assets/img/logo.png',
      '#jam-descripcion-corta': jam.descripcion_corta || '',
      '#jam-url': jam.url || '#',
      '#jam-tipo-jam': jam.tipo_jam || '',
      '#jam-quien-vota': jam.quien_vota || '',
      '#jam-fecha-inicio': formatFecha(jam.fecha_inicio),
      '#jam-fecha-fin': formatFecha(jam.fecha_fin),
      '#jam-fecha-votacion': formatFecha(jam.fecha_votacion),
      '#jam-contenido': jam.contenido || '',
      '#jam-criterios': jam.criterios || '',
      '#jam-hashtag': jam.hashtag ? `#${jam.hashtag}` : 'No disponible',
      '#jam-comunidad': jam.comunidad ? 'Sí' : 'No',
      '#jam-bloquear-subidas': jam.bloquear_subidas ? 'Sí' : 'No',
      '#jam-ocultar-resultados': jam.ocultar_resultados ? 'Sí' : 'No',
      '#jam-ocultar-submisiones': jam.ocultar_submisiones ? 'Sí' : 'No',
      '#jam-visibilidad': jam.visibilidad || '',
      '#jam-fecha-creacion': formatFecha(jam.created_at)
    };

    // Asignar datos al DOM
    for (const selector in map) {
      const el = qs(selector);
      if (!el) continue;
      if (el.tagName === 'IMG') el.src = map[selector];
      else if (el.tagName === 'A') el.href = map[selector];
      else el.textContent = map[selector];
    }

    // Iniciar contador
    const contadorEl = qs('#jam-contador');
    if (contadorEl && jam.fecha_fin) iniciarContador(jam.fecha_fin, contadorEl);

  } catch (err) {
    console.error('Error al cargar la Game Jam:', err);
  }
}

// ==========================
// Inicialización
// ==========================
window.addEventListener('DOMContentLoaded', () => {
  cargarDetallesGameJam();
  inicializarTabs();
});
