document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("gameFilters");
  const resetBtn = document.getElementById("resetFilters");
  const contenedor = document.getElementById("contenedor-juegos");
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
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
  // Cargar datos del usuario (no bloqueante)
  // =====================
  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok) return;

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
  })();

  // =====================
  // Función para cargar juegos
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

      let juegos = Array.isArray(data.juegos)
        ? data.juegos.map(j => ({
            ...j,
            genresArray: j.main_genre
              ? j.main_genre.split(",").map(g => g.trim().toLowerCase())
              : [],
            categoryLower: j.category ? j.category.trim().toLowerCase() : "",
            pricingLower: j.pricing ? j.pricing.trim().toLowerCase() : ""
          }))
        : [];

      // ====== FILTROS ======
      if (filtros.category)
        juegos = juegos.filter(
          j => j.categoryLower === filtros.category.toLowerCase().trim()
        );

      if (filtros.genre)
        juegos = juegos.filter(j =>
          j.genresArray.includes(filtros.genre.toLowerCase().trim())
        );

      if (filtros.price) {
        const priceMap = {
          gratis: "free",
          pago: "paid",
          donation: "donation",
          oferta: "sale"
        };
        const filtroPrice =
          priceMap[filtros.price.toLowerCase().trim()] ||
          filtros.price.toLowerCase().trim();
        juegos = juegos.filter(j => j.pricingLower === filtroPrice);
      }

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
      // Renderizar juegos instantáneamente
      // =====================
      contenedor.innerHTML = "";

      if (juegos.length === 0) {
        contenedor.innerHTML = "<p>No se encontraron juegos con estos filtros.</p>";
        return;
      }

      juegos.forEach(juego => {
        const div = document.createElement("div");
        div.classList.add("juego-card");
        div.addEventListener("click", () => {
          if (juego.id) window.location.href = `perfil-juegos.html?id=${juego.id}`;
        });

        const imagenPrincipal = juego.cover || "https://via.placeholder.com/300x200?text=No+Cover";

        div.innerHTML = `
          <div class="juego-cover" style="position: relative;">
            <img src="${imagenPrincipal}" alt="${juego.title || 'Untitled Game'}">
            <button class="btn-favorito" data-id="${juego.id}">❤️</button>
          </div>
          <div class="juego-info">
            <h3>${juego.title || "Untitled"}</h3>
            <p>${juego.description ? juego.description.substring(0, 100) + "..." : "No description"}</p>
            <p class="precio-juego">—</p>
          </div>
        `;
        contenedor.appendChild(div);
      });

      // =====================
      // Cargar precios en segundo plano
      // =====================
      juegos.forEach(async (juego, index) => {
        try {
          const precioRes = await fetch(`${API_BASE}/api/juegos/${juego.id}/precio`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const precioData = await precioRes.json();

          let precioHTML = "";
          if (juego.pricing === "free") {
            precioHTML = `<strong>Gratis</strong>`;
          } else if (juego.pricing === "donation") {
            precioHTML = `<strong>Donación</strong>`;
          } else if (precioData.ok) {
            const finalPrice = parseFloat(precioData.final_price || 0).toFixed(2);
            const descuento = parseFloat(precioData.discount || 0);
            precioHTML = `<strong>Precio Final:</strong> $${finalPrice} (${descuento}%)`;
          } else {
            precioHTML = `<strong>No disponible</strong>`;
          }

          const card = contenedor.children[index];
          const precioEl = card.querySelector(".precio-juego");
          if (precioEl) precioEl.innerHTML = precioHTML;
        } catch (err) {
          console.error(`Error cargando precio del juego ${juego.id}:`, err);
        }
      });

      // =====================
      // Evento favoritos
      // =====================
      document.querySelectorAll(".btn-favorito").forEach(btn => {
        btn.addEventListener("click", async e => {
          e.stopPropagation();
          const juegoId = btn.dataset.id;
          if (!juegoId) return;

          try {
            const res = await fetch(`${API_BASE}/api/favoritos`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
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
  // Filtros y reinicio
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
  // Cargar instantáneamente los juegos
  // =====================
  cargarJuegos();
});
