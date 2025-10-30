document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");

  // Elementos UI
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  const ratingStars = document.querySelectorAll("#rating span");
  const ratingInfo = document.getElementById("rating-info");
  const btnEnviar = document.getElementById("btnEnviarRating");
  const mensajeBox = document.getElementById("mensaje-box");

  let currentRating = 0;
  let currentUser = null;

  // ✅ Clave única por usuario y juego
  function obtenerClaveVoto() {
    const userKey = currentUser ? currentUser.id : "anonimo";
    return `votado_${juegoId}_${userKey}`;
  }

  // =========================
  // Mostrar mensaje flotante
  // =========================
  function mostrarMensaje(texto, tipo = "success") {
    mensajeBox.textContent = texto;
    mensajeBox.className = tipo;
    mensajeBox.style.display = "block";
    setTimeout(() => (mensajeBox.style.display = "none"), 3000);
  }

  // =========================
  // Cargar usuario
  // =========================
  async function loadUser() {
    if (!token) return;

    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.ok) {
        currentUser = data.user;
        currentUsername.textContent = currentUser.username || "Invitado";

        if (currentUser.avatar) {
          avatarCircle.style.backgroundImage = `url(${currentUser.avatar})`;
          avatarCircle.style.backgroundSize = "cover";
          avatarIcon.style.display = "none";
        } else {
          avatarCircle.style.backgroundImage = "none";
          avatarIcon.style.display = "block";
        }

        // ✅ Desactivar si ya votó
        verificarVotoPrevio();
      }
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  // =========================
  // Seleccionar estrellas
  // =========================
  ratingStars.forEach(star => {
    star.addEventListener("click", () => {
      const clave = obtenerClaveVoto();
      if (localStorage.getItem(clave)) {
        mostrarMensaje("⭐ Ya calificaste este juego", "error");
        return;
      }

      currentRating = parseInt(star.dataset.value);
      ratingStars.forEach(s => {
        s.style.color = parseInt(s.dataset.value) <= currentRating ? "gold" : "gray";
      });
    });
  });

  // =========================
  // Enviar calificación
  // =========================
  btnEnviar.addEventListener("click", async () => {
    const clave = obtenerClaveVoto();

    if (localStorage.getItem(clave)) {
      mostrarMensaje("⭐ Ya calificaste este juego anteriormente", "error");
      return;
    }

    if (!currentRating) {
      mostrarMensaje("Selecciona una puntuación antes de enviar.", "error");
      return;
    }

    try {
      const res = await fetch(`https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/juegos/${juegoId}/votos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          puntuacion: currentRating,
          user_id: currentUser ? currentUser.id : null,
          username: currentUser ? currentUser.username : "Anónimo"
        })
      });

      const data = await res.json();

      if (data.ok) {
        mostrarMensaje("✅ Tu voto ha sido publicado", "success");
        localStorage.setItem(clave, "true"); // ✅ Bloquear nuevo voto
        btnEnviar.disabled = true;
        btnEnviar.textContent = "⭐ Ya calificaste";
        cargarPromedio();
      } else {
        mostrarMensaje("❌ " + data.error, "error");
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje("❌ Error al enviar tu voto", "error");
    }
  });

  // =========================
  // Verificar voto previo
  // =========================
  function verificarVotoPrevio() {
    const clave = obtenerClaveVoto();
    if (localStorage.getItem(clave)) {
      btnEnviar.disabled = true;
      btnEnviar.textContent = "⭐ Ya calificaste este juego";
    }
  }

  // =========================
  // Cargar promedio y votos
  // =========================
  async function cargarPromedio() {
    try {
      const res = await fetch(`https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/juegos/${juegoId}/votos`);
      const data = await res.json();

      if (data.ok) {
        ratingInfo.textContent = `Promedio: ${data.promedio} (${data.votos.length} votos)`;
      }
    } catch (err) {
      console.error("Error cargando promedio:", err);
    }
  }

  // Init
  loadUser();
  cargarPromedio();
});
