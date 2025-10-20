document.addEventListener("DOMContentLoaded", async () => {
  // =============================
  // 🧩 REFERENCIAS A ELEMENTOS
  // =============================
  const form = document.getElementById("gameFilters");
  const resetBtn = document.getElementById("resetFilters");
  const contenedor = document.getElementById("contenedor-juegos");
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  // =============================
  // ⚙️ CONFIGURACIÓN BASE API
  // =============================
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const API_BASE = isLocal ? "http://localhost:3001" : "https://takuminet.vercel.app";
  console.log(`🌐 Conectando a: ${API_BASE}`);

  // =============================
  // 🔑 TOKEN Y AUTENTICACIÓN
  // =============================
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Debes iniciar sesión para ver los juegos");
    window.location.href = "login.html";
    return;
  }

  // =============================
  // 👤 FUNCIÓN: Cargar Usuario
  // =============================
  async function loadUser() {
    try {
      console.log("👤 Cargando datos del usuario...");
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const data = await res.json();
      if (!data.ok) {
        console.error("No se pudo cargar usuario:", data.error);
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
      }

      const user = data.user;
      currentUsername.textContent = user.username || "Invitado";

      // Imagen del usuario
      if (user.avatar) {
        avatarCircle.style.backgroundImage = `url(${user.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarIcon.style.display = "none";
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }

      console.log("✅ Usuario cargado:", user.username);
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
      alert("Error de conexión. Verifica que el servidor esté funcionando.");
    }
  }

  // =============================
  // 🎮 FUNCIÓN: Cargar Juegos
  // =============================
  async function cargarJuegos(filtros = {}) {
    try {
      console.log("🎮 Cargando juegos...");
      contenedor.innerHTML = "<p>Cargando juegos...</p>";

      const res = await fetch(`${API_BASE}/api/juegos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const data = await res.json();
      if (!data.ok) {
        contenedor.innerHTML = `<p>Error: ${data.error}</p>`;
        return;
      }

      // -------------------------
      // Normalizar datos
      // -------------------------
      let juegos = Array.isArray(data.juegos)
        ? data.juegos.map((j) => ({
            ...j,
            genresArray: j.main_genre ? j.main_genre.split(",").map((g) => g.trim().toLowerCase()) : [],
            categoryLower: j.category ? j.category.trim().toLowerCase() : "",
            pricingLower: j.pricing ? j.pricing.trim().toLowerCase() : "",
          }))
        : [];

      console.log(`📊 ${juegos.length} juegos encontrados`);

      // -------------------------
      // Filtros
      // -------------------------
      if (filtros.category) {
        const catLower = filtros.category.toLowerCase().trim();
        juegos = juegos.filter((j) => j.categoryLower === catLower);
      }

      if (filtros.genre) {
        const genreLower = filtros.genre.toLowerCase().trim();
        juegos = juegos.filter((j) => j.genresArray.includes(genreLower));
      }

      if (filtros.price) {
        const priceMap = { gratis: "free", pago: "paid", donation: "donation", oferta: "sale" };
        const filtroPrice = priceMap[filtros.price.toLowerCase().trim()] || filtros.price.toLowerCase().trim();
        juegos = juegos.filter((j) => j.pricingLower === filtroPrice);
      }

      if (filtros.requirements) {
        juegos = juegos.filter((j) => {
          const ram = parseInt(j.min_ram) || 0;
          if (filtros.requirements === "low") return ram <= 4;
          if (filtros.requirements === "medium") return ram > 4 && ram <= 8;
          if (filtros.requirements === "high") return ram > 8;
          return true;
        });
      }

      // -------------------------
      // Renderizar juegos
      // -------------------------
      contenedor.innerHTML = "";

      if (juegos.length === 0) {
        contenedor.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p>🎮 No se encontraron juegos con estos filtros.</p>
            <button onclick="cargarJuegos()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Ver todos los juegos
            </button>
          </div>
        `;
        return;
      }

      for (const juego of juegos) {
        try {
          const precioOriginal = parseFloat(juego.price) || 0;
          const descuento = parseFloat(juego.discount) || 0;
          const finalPrice = descuento > 0 && !juego.final_price
            ? precioOriginal * (1 - descuento / 100)
            : parseFloat(juego.final_price) || precioOriginal;

          const imagen = juego.cover || "https://via.placeholder.com/300x200/667eea/ffffff?text=No+Cover";

          let precioHTML = "";
          if (juego.pricing === "free") {
            precioHTML = `<strong style="color: #10b981;">🎁 Gratis</strong>`;
          } else if (juego.pricing === "donation") {
            precioHTML = `<strong style="color: #f59e0b;">💝 Donación</strong>`;
          } else {
            const tachado = descuento > 0 ? 'style="color:#ef4444;text-decoration:line-through;"' : "";
            const descuentoTxt = descuento > 0 ? `<span style="color:#10b981;"> (${descuento}% OFF)</span>` : "";
            precioHTML = `
              <strong>💰 Precio:</strong> 
              <span ${tachado}>$${precioOriginal.toFixed(2)}</span>
              ${descuento > 0 ? `<br><strong>🎯 Final: $${finalPrice.toFixed(2)}</strong>` : ""}
              ${descuentoTxt}
            `;
          }

          // Crear tarjeta del juego
          const card = document.createElement("div");
          card.classList.add("juego-card");
          card.innerHTML = `
            <div class="juego-cover" style="position: relative;">
              <img src="${imagen}" alt="${juego.title}" style="width:100%;height:200px;object-fit:cover;border-radius:8px 8px 0 0;">
              <button class="btn-favorito" data-id="${juego.id}" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:18px;">❤️</button>
            </div>
            <div class="juego-info" style="padding:1rem;">
              <h3 style="margin:0 0 0.5rem 0;color:#1f2937;">${juego.title}</h3>
              <p style="margin:0 0 0.5rem 0;color:#6b7280;font-size:0.9rem;">${juego.description ? juego.description.substring(0,100) + "..." : "Sin descripción disponible"}</p>
              <p style="margin:0;font-size:0.9rem;">${precioHTML}</p>
              ${juego.username ? `<p style="margin-top:0.5rem;color:#9ca3af;font-size:0.8rem;">Por: ${juego.username}</p>` : ""}
            </div>
          `;

          // Evento para abrir perfil del juego
          card.addEventListener("click", () => {
            window.location.href = `perfil-juegos.html?id=${juego.id}`;
          });

          contenedor.appendChild(card);
        } catch (err) {
          console.error(`❌ Error renderizando juego ${juego.id}:`, err);
        }
      }

      // -------------------------
      // Evento agregar a favoritos
      // -------------------------
      document.querySelectorAll(".btn-favorito").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          if (!id) return;

          try {
            const res = await fetch(`${API_BASE}/api/favoritos`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ juego_id: id }),
            });
            const result = await res.json();

            alert(result.ok ? "🎉 Juego agregado a favoritos ❤️" : result.error || "❌ No se pudo agregar a favoritos");
          } catch {
            alert("🔌 Error de conexión con el servidor");
          }
        });
      });
    } catch (err) {
      console.error("❌ Error cargando juegos:", err);
      contenedor.innerHTML = `
        <div style="text-align:center;padding:2rem;">
          <p>🔌 Error de conexión con el servidor</p>
          <p style="font-size:0.9rem;color:#6b7280;">Verifica que el servidor esté funcionando en: ${API_BASE}</p>
          <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer;">
            Reintentar
          </button>
        </div>
      `;
    }
  }

  // =============================
  // 🎛️ EVENTOS DE FILTROS
  // =============================
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const filtros = {
        genre: form.genre.value,
        category: form.category.value,
        price: form.price?.value,
        requirements: form.requirements?.value,
      };
      console.log("🔍 Aplicando filtros:", filtros);
      cargarJuegos(filtros);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      form?.reset();
      console.log("🔄 Reiniciando filtros...");
      cargarJuegos();
    });
  }

  // =============================
  // 🚀 INICIALIZACIÓN
  // =============================
  console.log("🚀 Inicializando página de juegos...");
  await loadUser();
  await cargarJuegos();
  console.log("✅ Página de juegos inicializada correctamente");
});

// =============================
// 🌐 FUNCIÓN GLOBAL REINTENTAR
// =============================
window.cargarJuegos = async function () {
  location.reload();
};
