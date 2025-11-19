// ============================
// CALIFICAR.JS - SIN ERRORES EN CONSOLA
// ============================
(async function () {
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("juego_id");
  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");

  // Esperar que el DOM esté listo
  await new Promise(resolve => {
    if (document.readyState === "complete" || document.readyState === "interactive") resolve();
    else document.addEventListener("DOMContentLoaded", resolve);
  });

  // Elementos
  const ratingStars = document.querySelectorAll("#rating span");
  const ratingInfo = document.getElementById("rating-info");
  const btnEnviar = document.getElementById("btnEnviarRating");
  if (!ratingStars.length || !btnEnviar || !ratingInfo) return;

  let valorSeleccionado = 0;
  const claveVoto = `votado_${juegoId}_${userId}`;

  // ⭐ Actualizar estrellas
  function actualizarEstrellas(valor) {
    ratingStars.forEach((s, i) => {
      s.classList.toggle("active", i < valor);
    });
  }

  // 📊 Cargar calificaciones sin errores visibles
  async function cargarCalificaciones() {
    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}/calificaciones`).catch(() => null);
      if (!res || !res.ok) return;

      const data = await res.json().catch(() => ({}));
      if (!data || !data.ok) return;

      const { promedio = 0, total = 0 } = data;
      ratingInfo.textContent = `Promedio: ${promedio.toFixed(1)} (${total} voto${total !== 1 ? "s" : ""})`;
      actualizarEstrellas(Math.round(promedio));
    } catch {
      // No mostrar nada en consola
    }
  }

  // ⭐ Selección de estrella
  ratingStars.forEach(star => {
    star.addEventListener("click", () => {
      if (localStorage.getItem(claveVoto)) {
        alert("Ya calificaste este juego ⭐");
        return;
      }
      valorSeleccionado = parseInt(star.dataset.value || "0");
      actualizarEstrellas(valorSeleccionado);
    });
  });

  // 🚀 Enviar calificación
  btnEnviar.addEventListener("click", async () => {
    if (localStorage.getItem(claveVoto)) {
      alert("⭐ Ya calificaste este juego anteriormente");
      return;
    }
    if (!userId || !username) {
      alert("Debes iniciar sesión para calificar un juego.");
      return;
    }
    if (valorSeleccionado === 0) {
      alert("Selecciona una calificación antes de enviar ⭐");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}/calificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, username, valor: valorSeleccionado })
      }).catch(() => null);

      const data = await res?.json().catch(() => ({})) || {};

      if (data.ok) {
        alert("✔ Calificación enviada correctamente");
        localStorage.setItem(claveVoto, "true");
        btnEnviar.disabled = true;
        btnEnviar.textContent = "⭐ Ya calificaste este juego";
        await cargarCalificaciones();
      } else {
        alert("❌ " + (data.error || "Error desconocido"));
      }
    } catch {
      // Silencio total en consola
      alert("Error de conexión con el servidor");
    }
  });

  // 🔒 Si ya votó
  if (localStorage.getItem(claveVoto)) {
    btnEnviar.disabled = true;
    btnEnviar.textContent = "⭐ Ya calificaste este juego";
  }

  // 🔹 Cargar calificaciones iniciales
  await cargarCalificaciones();
})();
