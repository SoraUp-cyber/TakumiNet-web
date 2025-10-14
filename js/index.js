(async function() {
  const API_BASE = "http://localhost:3001";
  const $ = id => document.getElementById(id);

  // ==========================
  // Obtener ID del juego desde URL
  // ==========================
  function getJuegoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("juego_id");
  }

  // ==========================
  // Obtener user_id
  // ==========================
  function getUserId() {
    return localStorage.getItem("user_id") || "guest";
  }

  // ==========================
  // Manejo de favoritos en localStorage
  // ==========================
  function obtenerFavoritos(userId) {
    return JSON.parse(localStorage.getItem(`favoritos_${userId}`) || '[]');
  }

  function guardarFavoritos(userId, favoritos) {
    localStorage.setItem(`favoritos_${userId}`, JSON.stringify(favoritos));
  }

  // ==========================
  // Toggle Favorito
  // ==========================
  async function toggleFavorito(juegoId, boton) {
    const token = localStorage.getItem("token");
    const userId = getUserId();
    let favoritos = obtenerFavoritos(userId);
    const esFavorito = favoritos.includes(juegoId);

    try {
      if (esFavorito) {
        // Eliminar de favoritos
        if (token) {
          await fetch(`${API_BASE}/api/favoritos/${juegoId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
        
        favoritos = favoritos.filter(id => id !== juegoId);
        boton.innerHTML = '🤍';
        boton.classList.remove('favorito-activo');
        mostrarNotificacion('Juego eliminado de favoritos', 'info');
      } else {
        // Agregar a favoritos
        if (token) {
          await fetch(`${API_BASE}/api/favoritos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ juego_id: juegoId })
          });
        }
        
        favoritos.push(juegoId);
        boton.innerHTML = '❤️';
        boton.classList.add('favorito-activo');
        mostrarNotificacion('Juego agregado a favoritos ❤️', 'success');
        
        // Redirigir a juegos favoritos.html después de agregar a favoritos
        setTimeout(() => {
          window.location.href = 'juegos favoritos.html';
        }, 1000);
      }
      
      guardarFavoritos(userId, favoritos);
      
    } catch (err) {
      console.error('Error al toggle favorito:', err);
      mostrarNotificacion('Error al actualizar favoritos', 'error');
    }
  }

  // ==========================
  // Normalizar portada del juego
  // ==========================
  function getPortada(juego) {
    if (!juego) return "https://via.placeholder.com/300x200/2d2d2d/ffffff?text=Sin+Portada";
    
    let portada = juego.cover || juego.portada || null;
    
    if (!portada) return "https://via.placeholder.com/300x200/2d2d2d/ffffff?text=Sin+Portada";
    if (portada.startsWith("http")) return portada;
    return "https://via.placeholder.com/300x200/2d2d2d/ffffff?text=Sin+Portada";
  }

  // ==========================
  // Formatear precio con descuento (VERSIÓN SIMPLIFICADA Y RÁPIDA)
  // ==========================
  function formatearPrecio(juego) {
    const precioBase = parseFloat(juego.price) || 0;
    const descuento = parseFloat(juego.discount_percentage) || 0;
    const precioFinal = descuento > 0 ? precioBase * (1 - descuento / 100) : precioBase;
    
    const esGratis = juego.pricing === 'free' || juego.pricing === 'gratis';
    const esDonacion = juego.pricing === 'donation';
    const tieneOferta = descuento > 0 && precioBase > 0;

    if (esGratis) {
      return { 
        texto: 'Gratis', 
        precioFinal: 0, 
        clase: 'gratis', 
        mostrarOriginal: false 
      };
    }

    if (esDonacion) {
      return { 
        texto: 'Donación', 
        precioFinal: precioBase, 
        clase: 'donacion', 
        mostrarOriginal: false 
      };
    }

    return {
      texto: `$${precioFinal.toFixed(2)}`,
      precioFinal: precioFinal,
      clase: tieneOferta ? 'oferta' : 'normal',
      mostrarOriginal: true,
      precioOriginal: precioBase,
      descuento: tieneOferta ? descuento : 0
    };
  }

  // ==========================
  // Crear tarjeta de juego COMPLETA (VERSIÓN RÁPIDA)
  // ==========================
  function crearJuegoHTML(juego) {
    const div = document.createElement('div');
    div.className = 'juego-card';

    const userId = getUserId();
    const favoritos = obtenerFavoritos(userId);
    const esFavorito = favoritos.includes(juego.id);
    const precioInfo = formatearPrecio(juego);

    div.innerHTML = `
      <div class="juego-imagen-wrapper">
        <img src="${getPortada(juego)}" alt="${juego.title || ''}" class="juego-portada" loading="lazy" />
        <button class="boton-favorito ${esFavorito ? 'favorito-activo' : ''}" data-id="${juego.id}">
          ${esFavorito ? '❤️' : '🤍'}
        </button>
        ${precioInfo.mostrarOriginal && precioInfo.descuento > 0 ? `<span class="badge badge-oferta">-${precioInfo.descuento}%</span>` : ''}
      </div>

      <div class="juego-info">
        <h3 class="juego-titulo">${juego.title || 'Sin título'}</h3>
        <p class="juego-descripcion">${juego.description ? juego.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
        <div class="juego-precios ${precioInfo.clase}">
          ${precioInfo.mostrarOriginal && precioInfo.descuento > 0 ? `
            <div class="precio-con-descuento">
              <span class="precio-original tachado">$${precioInfo.precioOriginal.toFixed(2)}</span>
              <span class="precio-final">${precioInfo.texto}</span>
            </div>
          ` : `
            <span class="precio-final ${precioInfo.clase}">${precioInfo.texto}</span>
          `}
        </div>
      </div>
    `;

    // Click en tarjeta → perfil del juego
    div.addEventListener('click', e => {
      if (!e.target.classList.contains('boton-favorito') && !e.target.closest('.boton-favorito')) {
        window.location.href = `perfil-juegos.html?id=${juego.id}`;
      }
    });

    // Botón de favoritos
    const btnFavorito = div.querySelector('.boton-favorito');
    btnFavorito.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorito(juego.id, btnFavorito);
    });

    return div;
  }

  // ==========================
  // Mostrar detalle de juego COMPLETO (VERSIÓN RÁPIDA)
  // ==========================
  function mostrarJuegoDetalle(juego) {
    const contenedor = $("juego-detalle");
    if (!contenedor) return;

    const precioInfo = formatearPrecio(juego);

    contenedor.innerHTML = `
      <div class="juego-detalle-container">
        <div class="juego-detalle-portada">
          <img src="${getPortada(juego)}" alt="${juego.title}" class="portada-principal">
          
          <!-- Badges en detalle -->
          <div class="badges-detalle">
            ${juego.pricing === 'free' || juego.pricing === 'gratis' ? '<span class="badge badge-free">Gratis</span>' : ''}
            ${juego.pricing === 'paid' ? '<span class="badge badge-paid">Pago</span>' : ''}
            ${juego.pricing === 'donation' ? '<span class="badge badge-donation">❤️ Donación</span>' : ''}
            ${precioInfo.mostrarOriginal && precioInfo.descuento > 0 ? `<span class="badge badge-oferta">-${precioInfo.descuento}% OFF</span>` : ''}
          </div>

          ${juego.screenshots && juego.screenshots.length > 0 ? `
            <div class="juego-capturas">
              ${juego.screenshots.map((captura, index) => `
                <img src="${captura}" alt="Captura ${index + 1}" class="captura-miniatura">
              `).join('')}
            </div>
          ` : ''}
        </div>
        
        <div class="juego-detalle-info">
          <h1>${juego.title}</h1>
          <div class="juego-meta">
            <span class="categoria">${juego.category || 'Sin categoría'}</span>
            <span class="genero">${juego.main_genre || 'Sin género'}</span>
          </div>
          <p class="descripcion-completa">${juego.description || 'Sin descripción disponible'}</p>
          
          <!-- Información de precio en detalle -->
          <div class="juego-precio-detalle ${precioInfo.clase}">
            ${precioInfo.mostrarOriginal && precioInfo.descuento > 0 ? `
              <div class="precio-detalle-con-descuento">
                <div class="precios-comparacion">
                  <span class="precio-original-detalle tachado">$${precioInfo.precioOriginal.toFixed(2)}</span>
                  <span class="precio-final-detalle">${precioInfo.texto}</span>
                </div>
                <div class="ahorro-detalle">
                  Ahorras $${(precioInfo.precioOriginal - precioInfo.precioFinal).toFixed(2)} (${precioInfo.descuento}% OFF)
                </div>
              </div>
            ` : `
              <span class="precio-final-simple ${precioInfo.clase}">${precioInfo.texto}</span>
            `}
          </div>

          <!-- Botones de acción -->
          <div class="juego-acciones">
            ${juego.mediafire_url ? `
              <a href="${juego.mediafire_url}" target="_blank" class="btn-descarga">
                <i class="fas fa-download"></i> 
                ${juego.pricing === 'donation' ? 'Descargar (Donación)' : 'Descargar juego'}
              </a>
            ` : ''}
            
            ${juego.pricing === 'donation' ? `
              <button class="btn-donacion" onclick="realizarDonacion(${juego.id})">
                <i class="fas fa-heart"></i> Realizar donación
              </button>
            ` : ''}
          </div>

          ${juego.youtube_url ? `
            <div class="juego-video">
              <h3>Video del juego</h3>
              <iframe width="100%" height="315" src="https://www.youtube.com/embed/${extraerIdYouTube(juego.youtube_url)}" 
                      frameborder="0" allowfullscreen></iframe>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ==========================
  // Función para realizar donación
  // ==========================
  window.realizarDonacion = function(juegoId) {
    const monto = prompt('Ingresa el monto de tu donación:');
    if (monto && !isNaN(monto) && parseFloat(monto) > 0) {
      mostrarNotificacion(`¡Gracias por tu donación de $${parseFloat(monto).toFixed(2)}! ❤️`, 'success');
      console.log(`Donación de $${monto} para juego ${juegoId}`);
    } else if (monto !== null) {
      mostrarNotificacion('Por favor ingresa un monto válido', 'error');
    }
  };

  // ==========================
  // Extraer ID de YouTube
  // ==========================
  function extraerIdYouTube(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : '';
  }

  // ==========================
  // Mostrar notificación
  // ==========================
  function mostrarNotificacion(mensaje, tipo) {
    let notificacion = $('notificacion-global');
    if (!notificacion) {
      notificacion = document.createElement('div');
      notificacion.id = 'notificacion-global';
      notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        z-index: 10000;
        font-weight: 600;
        transition: all 0.3s ease;
        transform: translateX(100%);
      `;
      document.body.appendChild(notificacion);
    }

    const estilos = {
      success: 'background: #10b981;',
      error: 'background: #ef4444;',
      info: 'background: #3b82f6;'
    };

    notificacion.style.cssText += estilos[tipo] || estilos.info;
    notificacion.textContent = mensaje;

    setTimeout(() => {
      notificacion.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      notificacion.style.transform = 'translateX(100%)';
      setTimeout(() => notificacion.remove(), 300);
    }, 3000);
  }

  // ==========================
  // Renderizar lista de juegos (VERSIÓN RÁPIDA)
  // ==========================
  function renderJuegos(juegosArray, contenedorId) {
    const contenedor = $(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (!juegosArray || juegosArray.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-gamepad"></i>
          <h3>No hay juegos para mostrar</h3>
          <p>Prueba con otros filtros o vuelve más tarde</p>
        </div>
      `;
      return;
    }

    // Crear tarjetas de forma síncrona (más rápido)
    juegosArray.forEach(juego => {
      const juegoHTML = crearJuegoHTML(juego);
      contenedor.appendChild(juegoHTML);
    });
  }

  // ==========================
  // Renderizar juegos en oferta (FUNCIÓN ESPECÍFICA Y RÁPIDA)
  // ==========================
  function renderJuegosOferta(juegos) {
    const contenedor = $('#juegos-ofertas');
    if (!contenedor) return;

    console.log('Renderizando ofertas...');

    // Filtrar juegos que tengan descuento > 0
    const juegosEnOferta = juegos.filter(j => {
      const discount = parseFloat(j.discount_percentage) || 0;
      return discount > 0;
    });

    console.log('Juegos en oferta encontrados:', juegosEnOferta.length);
    console.log('Juegos en oferta:', juegosEnOferta.map(j => ({ 
      title: j.title, 
      discount: j.discount_percentage,
      price: j.price
    })));

    if (juegosEnOferta.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-tag"></i>
          <h3>No hay juegos en oferta</h3>
          <p>Revisa más tarde para ver descuentos especiales</p>
        </div>
      `;
      return;
    }

    // Limitar a 8 juegos máximo
    const juegosLimitados = juegosEnOferta.slice(0, 8);
    
    // Crear y agregar tarjetas de forma síncrona
    juegosLimitados.forEach(juego => {
      const tarjeta = crearJuegoHTML(juego);
      contenedor.appendChild(tarjeta);
    });
  }

  // ==========================
  // Función para mezclar un array (Fisher-Yates shuffle)
  // ==========================
  function shuffleArray(array) {
    const arr = array.slice(); // Crear copia
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ==========================
  // Renderizar secciones home (VERSIÓN RÁPIDA)
  // ==========================
  function renderSecciones(juegos) {
    if (!juegos) return;

    console.log('Total de juegos cargados:', juegos.length);

    // Juegos destacados (últimos 6)
    const destacados = juegos.slice(0, 6);
    renderJuegos(destacados, "juegos-destacados");
    
    // Juegos gratis
    const gratis = juegos.filter(j => j.pricing === 'free' || j.pricing === 'gratis');
    console.log('Juegos gratis:', gratis.length);
    renderJuegos(gratis.slice(0, 6), "juegos-gratis");
    
    // Juegos de pago
    const pagos = juegos.filter(j => j.pricing === 'paid' || j.pricing === 'pago');
    console.log('Juegos pagos:', pagos.length);
    renderJuegos(pagos.slice(0, 6), "juegos-pagos");
    
    // Juegos con oferta - usar la función específica
    renderJuegosOferta(juegos);
    
    // Juegos de donación
    const donaciones = juegos.filter(j => j.pricing === 'donation');
    console.log('Juegos donación:', donaciones.length);
    renderJuegos(donaciones.slice(0, 6), "juegos-donacion");
    
    // Más Juegos (aleatorio y diferente de destacados)
    const juegosDestacadosIds = destacados.map(j => j.id);
    const restantes = juegos.filter(j => !juegosDestacadosIds.includes(j.id));
    const aleatorio = shuffleArray(restantes).slice(0, 6);
    renderJuegos(aleatorio, "juegos-mas");
    console.log('Más juegos aleatorios:', aleatorio.length);
  }

  // ==========================
  // Mostrar loading
  // ==========================
  function mostrarLoading(contenedorId) {
    const contenedor = $(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando juegos...</p>
      </div>
    `;
  }

  // ==========================
  // Ocultar loading
  // ==========================
  function ocultarLoading(contenedorId) {
    const contenedor = $(contenedorId);
    if (!contenedor) return;
    
    const loading = contenedor.querySelector('.loading-container');
    if (loading) {
      loading.remove();
    }
  }

  // ==========================
  // Cargar juegos desde API (VERSIÓN OPTIMIZADA)
  // ==========================
  async function cargarJuegos() {
    try {
      console.log('Iniciando carga de juegos...');
      
      // Mostrar loading en todas las secciones posibles
      const secciones = [
        "juegos-destacados", 
        "juegos-gratis", 
        "juegos-pagos", 
        "juegos-ofertas", 
        "juegos-donacion",
        "juegos-mas"
      ];
      
      secciones.forEach(sec => {
        if ($(sec)) mostrarLoading(sec);
      });

      const resp = await fetch(`${API_BASE}/api/juegos`);
      const data = await resp.json();

      if (!data.ok || !data.juegos) {
        throw new Error("Error cargando juegos desde la API");
      }

      const juegos = data.juegos;
      console.log('Juegos recibidos del API:', juegos);
      
      const juegoId = getJuegoId();

      if (juegoId) {
        // Modo detalle de juego
        const juego = juegos.find(j => j.id == juegoId);
        if (!juego) {
          $("juego-detalle").innerHTML = "<p>Juego no encontrado</p>";
          return;
        }
        mostrarJuegoDetalle(juego);
      } else {
        // Modo lista de juegos - renderizar inmediatamente
        renderSecciones(juegos);
        
        // Ocultar loadings después de renderizar
        setTimeout(() => {
          secciones.forEach(sec => {
            if ($(sec)) ocultarLoading(sec);
          });
        }, 100);
      }

    } catch (err) {
      console.error("Error cargando juegos:", err);
      
      const contenedores = [
        "juegos-destacados", 
        "juegos-gratis", 
        "juegos-pagos", 
        "juegos-ofertas", 
        "juegos-donacion", 
        "juegos-mas",
        "juego-detalle"
      ];
      
      contenedores.forEach(id => {
        const contenedor = $(id);
        if (contenedor) {
          contenedor.innerHTML = `
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error al cargar los juegos</h3>
              <p>Intenta recargar la página</p>
              <button onclick="location.reload()">Reintentar</button>
            </div>
          `;
        }
      });
    }
  }

  // ==========================
  // Inicializar
  // ==========================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarJuegos);
  } else {
    cargarJuegos();
  }

})();