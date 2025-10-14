document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://localhost:3001";
  const token = localStorage.getItem("token"); // Token guardado al login

  const favoritesContainer = document.getElementById("favoritesContainer");
  const noFavoritesMessage = document.getElementById("noFavoritesMessage");

  if (!token) {
    favoritesContainer.innerHTML = "<p>Debes iniciar sesión para ver tus favoritos.</p>";
    noFavoritesMessage.style.display = "none";
    return;
  }

  // Función para cargar los favoritos del usuario
  async function cargarFavoritos() {
    try {
      const res = await fetch(`${API_BASE}/api/favoritos`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();

      // Si no hay favoritos
      if (!data.ok || !data.favoritos || data.favoritos.length === 0) {
        noFavoritesMessage.style.display = "block";
        favoritesContainer.innerHTML = "";
        return;
      }

      // Ocultar mensaje y limpiar contenedor
      noFavoritesMessage.style.display = "none";
      favoritesContainer.innerHTML = "";

      // Crear tarjetas para cada juego favorito
      data.favoritos.forEach(juego => {
        const juegoDiv = document.createElement("div");
        juegoDiv.classList.add("juego-card");

        const imagenPrincipal = juego.cover || 'https://via.placeholder.com/300x200?text=Sin+Portada';

        juegoDiv.innerHTML = `
          <div class="juego-cover">
            <img src="${imagenPrincipal}" alt="${juego.title || 'Juego sin nombre'}">
          </div>
          <div class="juego-info">
            <h3>${juego.title || 'Sin título'}</h3>
            <p>${juego.description ? juego.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
            <p>${juego.pricing === "free" ? "<strong>Gratis</strong>" : `<strong>Precio:</strong> $${juego.price || 0}`}</p>
            <button class="btn-remove-fav" data-juego-id="${juego.juego_id}">❌ Quitar</button>
          </div>
        `;

        favoritesContainer.appendChild(juegoDiv);
      });

      // Evento para quitar favoritos
      document.querySelectorAll(".btn-remove-fav").forEach(boton => {
        boton.addEventListener("click", async (e) => {
          const juegoId = e.target.dataset.juegoId; // Usar juego_id correcto
          if (!juegoId) return;

          try {
            const res = await fetch(`${API_BASE}/api/favoritos/${juegoId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await res.json();

            if (result.ok) {
              // Recargar la lista de favoritos después de eliminar
              cargarFavoritos();
            } else {
              alert(result.error || "No se pudo quitar de favoritos");
            }
          } catch (err) {
            console.error(err);
            alert("Error al quitar favorito");
          }
        });
      });

    } catch (err) {
      console.error(err);
      favoritesContainer.innerHTML = "<p>Error al cargar tus juegos favoritos.</p>";
    }
  }

  // Cargar favoritos al iniciar
  cargarFavoritos();
});
