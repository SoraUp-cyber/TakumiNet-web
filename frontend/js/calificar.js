(async function () {
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
  const juegoId = new URLSearchParams(window.location.search).get("juego_id");
  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");

  let valorSeleccionado = 0;
  const ratingStars = document.querySelectorAll("#rating span");
  const ratingInfo = document.getElementById("rating-info");
  const btnEnviar = document.getElementById("btnEnviarRating");

  // ✅ Clave única por usuario y juego
  const claveVoto = `votado_${juegoId}_${userId}`;

  // Función para actualizar estrellas según valor
  function actualizarEstrellas(valor) {
    ratingStars.forEach(s => s.classList.remove("active"));
    for (let i = 0; i < valor; i++) ratingStars[i].classList.add("active");
  }

  // Manejo de clic en estrellas
  ratingStars.forEach(star => {
    star.addEventListener("click", () => {
      if (localStorage.getItem(claveVoto)) {
        alert("Ya calificaste este juego ⭐");
        return;
      }
      valorSeleccionado = parseInt(star.dataset.value);
      actualizarEstrellas(valorSeleccionado);
    });
  });

  // Función para cargar promedio y número de votos
  async function cargarCalificaciones() {
    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}/calificaciones`);
      const data = await res.json();
      if (!data.ok) return;

      const { promedio, total } = data;
      ratingInfo.textContent = `Promedio: ${promedio.toFixed(1)} (${total} voto${total !== 1 ? 's' : ''})`;
      actualizarEstrellas(Math.round(promedio));
    } catch (err) {
      console.error("Error cargando calificaciones:", err);
    }
  }

  // ✅ Enviar calificación solo una vez
  btnEnviar.addEventListener("click", async () => {
    if (localStorage.getItem(claveVoto)) {
      alert("Ya calificaste este juego anteriormente ⭐");
      return;
    }

    if (!userId || !username) {
      alert("⭐ Ya calificaste este juego.");
      return;
    }

    if (valorSeleccionado === 0) {
      alert("Selecciona una calificación antes de enviar");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}/calificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, username, valor: valorSeleccionado })
      });

      const data = await res.json();

      if (data.ok) {
        alert("✔ Calificación enviada correctamente");
        localStorage.setItem(claveVoto, "true"); // ✅ Guardar bloqueo local
        btnEnviar.disabled = true;
        cargarCalificaciones();
      } else {
        alert("❌ " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión con el servidor");
    }
  });

  // Desactivar botón si ya votó
  if (localStorage.getItem(claveVoto)) {
    btnEnviar.disabled = true;
    btnEnviar.textContent = "⭐ Ya calificaste este juego";
  }

  document.addEventListener("DOMContentLoaded", cargarCalificaciones);
})();
