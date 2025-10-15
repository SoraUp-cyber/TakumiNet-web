document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("gameFilters");
  const resetBtn = document.getElementById("resetFilters");
  const contenedor = document.getElementById("contenedor-juegos");
  const API_BASE = "http://localhost:3001";
  const token = localStorage.getItem("token");
  
  // Elementos del usuario
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  // =====================
  // Verificar autenticación
  // =====================
  if (!token) {
    alert("Debes iniciar sesión para ver los juegos");
    return;
  }

  // =====================
  // Cargar datos del usuario
  // =====================
  async function loadUser() {
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!data.ok) {
        console.error("No se pudo cargar usuario:", data.error);
        return;
      }

      const user = data.user;
      currentUsername.textContent = user.username || "Invitado";

      if (user.avatar) {
        avatarCircle.style.backgroundImage = `url(${user.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarIcon.style.display = "none";
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  // =====================
  // Función para cargar juegos con filtros
  // =====================
  async function cargarJuegos(filtros = {}) {
    try {
      const res = await fetch(`${API_BASE}/api/juegos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok) {
        contenedor.innerHTML = "<p>Error al cargar los juegos.</p>";
        return;
      }

      // =====================
      // Normalizar datos
      // =====================
      let juegos = Array.isArray(data.juegos) ? data.juegos.map(j => ({
        ...j,
        // Normalizar géneros a array en minúsculas sin espacios extra
        genresArray: j.main_genre ? j.main_genre.split(",").map(g => g.trim().toLowerCase()) : [],
        categoryLower: j.category ? j.category.trim().toLowerCase() : "",
        pricingLower: j.pricing ? j.pricing.trim().toLowerCase() : ""
      })) : [];

      // =====================
      // FILTROS FLEXIBLES
      // =====================

      // Filtrar por categoría
      if (filtros.category) {
        const catLower = filtros.category.toLowerCase().trim();
        juegos = juegos.filter(j => j.categoryLower === catLower);
      }

      // Filtrar por género
      if (filtros.genre) {
        const genreLower = filtros.genre.toLowerCase().trim();
        juegos = juegos.filter(j => j.genresArray.includes(genreLower));
      }

      // Filtrar por precio
      if (filtros.price) {
        let priceMap = {
          'gratis': 'free',
          'pago': 'paid',
          'donation': 'donation',
          'oferta': 'sale'
        };
        const filtroPrice = priceMap[filtros.price.toLowerCase().trim()] || filtros.price.toLowerCase().trim();
        juegos = juegos.filter(j => j.pricingLower === filtroPrice);
      }

      // Filtrar por requisitos mínimos (RAM)
      if (filtros.requirements) {
        juegos = juegos.filter(j => {
          const ram = parseInt(j.min_ram) || 0;
          if (filtros.requirements === "low") return ram <= 4;
          if (filtros.requirements === "medium") return ram > 4 && ram <= 8;
          if (filtros.requirements === "high") return ram > 8;
          return true;
        });
      }

// =====================
// Renderizar juegos
// =====================
contenedor.innerHTML = "";

if (juegos.length === 0) {
  contenedor.innerHTML = "<p>No se encontraron juegos con estos filtros.</p>";
  return;
}

for (const juego of juegos) {
  try {
    // =====================
    // Obtener precio actualizado desde el endpoint
    // =====================
    const precioRes = await fetch(`${API_BASE}/api/juegos/${juego.id}/precio`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const precioData = await precioRes.json();

    let precioOriginal = 0;
    let descuento = 0;
    let finalPrice = 0;

    if (precioData.ok) {
      precioOriginal = parseFloat(precioData.price) || 0;
      descuento = parseFloat(precioData.discount) || 0;
      finalPrice = parseFloat(precioData.final_price ?? precioOriginal * (1 - descuento / 100)).toFixed(2);
    }

    const div = document.createElement("div");
    div.classList.add("juego-card");

    // Agregar evento de clic para ir al perfil del juego
    div.addEventListener("click", () => {
      if (juego.id) window.location.href = `perfil-juegos.html?id=${juego.id}`;
    });

    const imagenPrincipal = juego.cover || 'https://via.placeholder.com/300x200?text=No+Cover';

    // Determinar tipo de precio
    let precioHTML = "";
    if (juego.pricing === "free") {
      precioHTML = `<strong>Gratis</strong>`;
    } else if (juego.pricing === "donation") {
      precioHTML = `<strong>Donación</strong>`;
    } else {
      precioHTML = `<strong>Precio Final:</strong> $${finalPrice} (${descuento}%)`;
    }

    div.innerHTML = `
      <div class="juego-cover" style="position: relative;">
        <img src="${imagenPrincipal}" alt="${juego.title || 'Untitled Game'}">
        <button class="btn-favorito" data-id="${juego.id}">❤️</button>
      </div>
      <div class="juego-info">
        <h3>${juego.title || 'Untitled'}</h3>
        <p>${juego.description ? juego.description.substring(0, 100) + '...' : 'No description'}</p>
        <p class="precio-juego">
          ${precioHTML}
        </p>
      </div>
    `;

    contenedor.appendChild(div);

  } catch (err) {
    console.error(`Error obteniendo precio de juego ${juego.id}:`, err);
  }
}



      // =====================
      // Evento favoritos (versión mejorada con API)
      // =====================
      document.querySelectorAll(".btn-favorito").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation(); // Evitar que se active el clic de la tarjeta
          
          const juegoId = btn.dataset.id;
          if (!juegoId) return;

          try {
            const res = await fetch(`${API_BASE}/api/favoritos`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ juego_id: juegoId })
            });

            const result = await res.json();

            if (result.ok) {
              alert("Juego agregado a favoritos ❤️");
              window.location.href = "juegos favoritos.html";
            } else {
              alert(result.error || "No se pudo agregar a favoritos");
            }
          } catch (err) {
            console.error(err);
            alert("Error de conexión al servidor");
          }
        });
      });

    } catch (err) {
      console.error(err);
      contenedor.innerHTML = "<p>Error de conexión con el servidor</p>";
    }
  }

  // =====================
  // Eventos de filtros
  // =====================
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const filtros = {
        genre: form.genre.value,
        category: form.category.value,
        price: form.price?.value,
        requirements: form.requirements?.value
      };
      cargarJuegos(filtros);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (form) form.reset();
      cargarJuegos();
    });
  }

  // =====================
  // Inicialización
  // =====================
  await loadUser();
  await cargarJuegos();
});