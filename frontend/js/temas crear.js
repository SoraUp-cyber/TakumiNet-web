document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:3001/api";
  const token = localStorage.getItem("token");
  const jamId = new URLSearchParams(window.location.search).get("id");

  if (!jamId) return console.error("No se encontró jamId en la URL");

  // ========================
  // Elementos DOM
  // ========================
  const estadoVoto = document.getElementById("estado-voto");
  const ratingInfo = document.getElementById("rating-info");
  const btnEnviarCalificacion = document.getElementById("btnEnviarCalificacion");
  const listaComentarios = document.getElementById("lista-comentarios");
  const btnEnviarComentario = document.getElementById("btn-enviar-comentario");
  const inputComentario = document.getElementById("nuevo-comentario");

  let currentUser = { username: "Invitado", avatar: null };

  // ========================
  // Cargar usuario
  // ========================
  async function loadUser() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) currentUser = data.user;
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  // ========================
  // Comentarios
  // ========================
  function agregarComentarioDOM(c) {
    if (!listaComentarios) return;

    const li = document.createElement("li");
    li.classList.add("comentario-item");
    const avatarURL = c.avatar || "https://via.placeholder.com/40";

    const denuncias = JSON.parse(localStorage.getItem("denuncias") || "{}");
    const ahora = Date.now();
    const denunciado = denuncias[c._id] && ahora - denuncias[c._id] < 24 * 60 * 60 * 1000;

    li.innerHTML = `
      <img src="${avatarURL}" alt="avatar" class="avatar">
      <div class="comentario-contenido">
        <div class="comentario-header">
          <strong>${c.username}</strong>
          <span class="comentario-fecha">${new Date(c.creado_en || Date.now()).toLocaleString()}</span>
        </div>
        <div class="comentario-texto">${c.comentario}</div>
        <button class="denunciar-btn" data-id="${c._id}" title="Reportar comentario"
          style="${denunciado ? 'background:#aaa; cursor:not-allowed;' : ''}">${denunciado ? 'Denunciado' : 'Reporta'}</button>
      </div>
    `;
    listaComentarios.appendChild(li);

    const btnDenunciar = li.querySelector(".denunciar-btn");
    if (!denunciado && btnDenunciar) {
      btnDenunciar.addEventListener("click", () => denunciarComentario(c._id, btnDenunciar));
    }
  }

  async function cargarComentarios() {
    if (!listaComentarios) return;

    try {
      const res = await fetch(`${API_BASE}/game_jams/${jamId}/comentarios`);
      const data = await res.json();
      listaComentarios.innerHTML = "";

      if (data.ok && data.comentarios.length) {
        data.comentarios.forEach(c => agregarComentarioDOM(c));
      } else {
        listaComentarios.innerHTML = "<li>No hay comentarios aún.</li>";
      }
    } catch (err) {
      console.error("Error cargando comentarios:", err);
      listaComentarios.innerHTML = "<li>Error cargando comentarios</li>";
    }
  }

  async function enviarComentario() {
    if (!inputComentario) return;
    const comentario = inputComentario.value.trim();
    if (!comentario) return alert("Escribe un comentario antes de enviar");
    if (!token) return alert("Debes iniciar sesión para comentar");

    try {
      const res = await fetch(`${API_BASE}/game_jams/${jamId}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentario }),
      });
      const data = await res.json();
      if (data.ok) {
        inputComentario.value = "";
        agregarComentarioDOM({
          username: currentUser.username,
          comentario,
          creado_en: new Date(),
        });
      } else {
        alert(data.error || "Error enviando comentario");
      }
    } catch (err) {
      console.error("Error enviando comentario:", err);
    }
  }

  async function denunciarComentario(idComentario, btnDenunciar) {
    if (!token) return alert("Debes iniciar sesión para denunciar");
    if (!confirm("¿Seguro que deseas reportar este comentario?")) return;

    try {
      const res = await fetch(`${API_BASE}/comentarios/${idComentario}/reportar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        const denuncias = JSON.parse(localStorage.getItem("denuncias") || "{}");
        denuncias[idComentario] = Date.now();
        localStorage.setItem("denuncias", JSON.stringify(denuncias));

        btnDenunciar.textContent = "Denunciado";
        btnDenunciar.style.background = "#aaa";
        btnDenunciar.style.cursor = "not-allowed";

        alert("Comentario reportado con éxito 🚩 (válido por 1 día)");
      } else alert(data.error || "Error al reportar comentario");
    } catch (err) {
      console.error("Error al reportar comentario:", err);
      alert("Error al reportar comentario");
    }
  }

  // ========================
  // Votos
  // ========================
  function obtenerValorSeleccionado() {
    const seleccion = document.querySelector('input[name="rating"]:checked');
    return seleccion ? parseInt(seleccion.value) : 0;
  }

  async function cargarVotos() {
    try {
      const res = await fetch(`${API_BASE}/game_jams/${jamId}/votos`);
      const data = await res.json();

      if (data.ok) {
        ratingInfo.textContent = `Promedio: ${data.promedio.toFixed(1)} (${data.totalVotos} votos)`;
      } else {
        ratingInfo.textContent = "Promedio: 0 (0 votos)";
      }
    } catch (err) {
      console.error(err);
      ratingInfo.textContent = "Promedio: 0 (0 votos)";
    }
  }

  async function enviarVoto() {
    const valor = obtenerValorSeleccionado();
    if (valor === 0) return alert("Selecciona una calificación antes de enviar");
    if (!token) return alert("Debes iniciar sesión para votar");

    try {
      const res = await fetch(`${API_BASE}/game_jams/${jamId}/votos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ puntuacion: valor }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        estadoVoto.textContent = data.mensaje || "✅ Voto registrado";
        estadoVoto.className = "mensaje-voto correcto";
        setTimeout(() => {
          estadoVoto.textContent = "";
          estadoVoto.className = "mensaje-voto";
        }, 4000);

        cargarVotos(); // actualizar promedio
      } else {
        alert(data.error || "Error enviando voto");
      }
    } catch (err) {
      console.error(err);
      alert("Error enviando voto");
    }
  }

  // ========================
  // Eventos
  // ========================
  if (btnEnviarComentario) btnEnviarComentario.addEventListener("click", enviarComentario);
  if (btnEnviarCalificacion) btnEnviarCalificacion.addEventListener("click", enviarVoto);

  // ========================
  // Inicialización
  // ========================
  loadUser();
  cargarComentarios();
  cargarVotos();
});
