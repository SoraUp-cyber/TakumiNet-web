document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
  const token = localStorage.getItem("token");

  const favoritesContainer = document.getElementById("favoritesContainer");
  const noFavoritesMessage = document.getElementById("noFavoritesMessage");

  if (!token) {
    favoritesContainer.innerHTML = "<p>⚠️ Debes iniciar sesión para ver tus favoritos.</p>";
    noFavoritesMessage.style.display = "none";
    return;
  }

  async function cargarFavoritos() {
    try {
      const res = await fetch(`${API_BASE}/api/favoritos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      console.log("🎯 DATOS COMPLETOS DEL BACKEND:", data);

      const favoritos = Array.isArray(data) ? data : data.favoritos || data.data || [];

      if (!favoritos || favoritos.length === 0) {
        favoritesContainer.innerHTML = "";
        noFavoritesMessage.style.display = "block";
        return;
      }

      favoritesContainer.innerHTML = "";
      noFavoritesMessage.style.display = "none";

      favoritos.forEach((juego, index) => {
        console.log(`🔍 JUEGO ${index + 1}:`, juego);
        
        const card = document.createElement("div");
        card.classList.add("juego-card");

        // 🎯 EXTRAER DATOS DIRECTAMENTE
        const titulo = juego.title || juego.nombre || "Sin título";
        const portada = juego.cover || juego.imagen || "https://via.placeholder.com/300x200?text=Sin+Portada";
        const idJuego = juego.juego_id || juego.id || juego.juegoId;

        const precio = juego.pricing === "free" ? "<strong>Gratis</strong>" : `<strong>Precio:</strong> $${juego.price || 0}`;
        const enlace = `/perfil-juegos.html?id=${idJuego}`;

        // 🎨 TARJETA SIN DESCRIPCIÓN
        card.innerHTML = `
          <div class="juego-cover">
            <a href="${enlace}">
              <img src="${portada}" alt="${titulo}" width="250">
            </a>
          </div>
          <div class="juego-info">
            <h3><a href="${enlace}">${titulo}</a></h3>
            <p>${precio}</p>
            <button class="btn-remove-fav" data-juego-id="${idJuego}">❌ Quitar</button>
          </div>
        `;

        favoritesContainer.appendChild(card);
      });

      // Quitar favoritos
      document.querySelectorAll(".btn-remove-fav").forEach((boton) => {
        boton.addEventListener("click", async (e) => {
          e.stopPropagation();
          const juegoId = e.target.dataset.juegoId;
          if (!juegoId) return;

          if (!confirm("¿Estás seguro de que quieres quitar este juego de favoritos?")) {
            return;
          }

          const botonOriginal = e.target;
          const textoOriginal = botonOriginal.textContent;
          botonOriginal.textContent = "Eliminando...";
          botonOriginal.disabled = true;

          try {
            const delRes = await fetch(`${API_BASE}/api/favoritos/${juegoId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });

            const result = await delRes.json();
            if (result.ok || delRes.ok) {
              alert("✅ Juego eliminado de favoritos");
              cargarFavoritos();
            } else {
              alert("No se pudo eliminar el favorito");
              botonOriginal.textContent = textoOriginal;
              botonOriginal.disabled = false;
            }
          } catch (err) {
            console.error("Error al quitar favorito:", err);
            alert("Error de conexión al servidor");
            botonOriginal.textContent = textoOriginal;
            botonOriginal.disabled = false;
          }
        });
      });
    } catch (err) {
      console.error("Error al cargar favoritos:", err);
      favoritesContainer.innerHTML = "";
      noFavoritesMessage.style.display = "block";
    }
  }

  cargarFavoritos();
});