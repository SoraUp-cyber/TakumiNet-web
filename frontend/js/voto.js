document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token"); // Token guardado al login
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id"); // ID del juego desde la URL

  // Elementos UI
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  const ratingStars = document.querySelectorAll("#rating span");
  const ratingInfo = document.getElementById("rating-info");
  const btnEnviar = document.getElementById("btnEnviarRating");
  const mensajeBox = document.getElementById("mensaje-box"); // div para mensajes

  let currentRating = 0;
  let currentUser = null;

  // =========================
  // Mostrar mensaje flotante
  // =========================
  function mostrarMensaje(texto, tipo = "success") {
    mensajeBox.textContent = texto;
    mensajeBox.className = tipo; // success o error
    mensajeBox.style.display = "block";

    setTimeout(() => {
      mensajeBox.style.display = "none";
    }, 3000);
  }

  // =========================
  // Cargar usuario
  // =========================
  async function loadUser() {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3001/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.ok) {
        currentUser = data.user; // <- { id, username, avatar }
        currentUsername.textContent = currentUser.username || "Invitado";

        if (currentUser.avatar) {
          avatarCircle.style.backgroundImage = `url(${currentUser.avatar})`;
          avatarCircle.style.backgroundSize = "cover";
          avatarIcon.style.display = "none";
        } else {
          avatarCircle.style.backgroundImage = "none";
          avatarIcon.style.display = "block";
        }
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
    if (!currentRating) {
      mostrarMensaje("Selecciona una puntuación antes de enviar.", "error");
      return;
    }

    try {
      await fetch(`http://localhost:3001/api/juegos/${juegoId}/votos`, {
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

      mostrarMensaje("✅ Tu voto ha sido publicado", "success");
      cargarPromedio();
    } catch (err) {
      console.error(err);
      mostrarMensaje("❌ Error al enviar tu voto", "error");
    }
  });

  // =========================
  // Cargar promedio y votos
  // =========================
  async function cargarPromedio() {
    try {
      const res = await fetch(`http://localhost:3001/api/juegos/${juegoId}/votos`);
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
