document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
  const API = `${API_BASE}/api`;
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
  // Cargar usuario actual
  // ========================
  async function loadUser() {
    if (!token) return;
    try {
      const res = await fetch(`${API}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Respuesta no JSON al cargar usuario:", text);
        return;
      }

      if (data.ok) currentUser = data.user;
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  // ========================
  // Mostrar comentario en DOM
  // ========================
  function agregarComentarioDOM(c) {
    if (!listaComentarios) return;

    const li = document.createElement("li");
    li.classList.add("comentario-item");
    const avatarURL = c.avatar || "https://via.placeholder.com/40";

    li.innerHTML = `
      <img src="${avatarURL}" alt="avatar" class="avatar comentario-avatar">
      <div class="comentario-contenido">
        <div class="comentario-header">
          <strong>${c.username}</strong>
          <span class="comentario-fecha">
            ${new Date(c.creado_en || Date.now()).toLocaleString()}
          </span>
        </div>
        <div class="comentario-texto">${c.comentario}</div>
      </div>
    `;

    listaComentarios.appendChild(li);
  }

  // ========================
  // Cargar comentarios
  // ========================
  async function cargarComentarios() {
    if (!listaComentarios) return;

    try {
      const res = await fetch(`${API}/game_jams/${jamId}/comentarios`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Respuesta no JSON al cargar comentarios:", text);
        listaComentarios.innerHTML = "<li>Error cargando comentarios</li>";
        return;
      }

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

  // ========================
  // Enviar nuevo comentario
  // ========================
  async function enviarComentario() {
    if (!inputComentario) return;
    const comentario = inputComentario.value.trim();
    if (!comentario) return alert("Escribe un comentario antes de enviar");
    if (!token) return alert("Debes iniciar sesión para comentar");

    try {
      const res = await fetch(`${API}/game_jams/${jamId}/comentarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comentario }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Respuesta no JSON al enviar comentario:", text);
        return alert("Error inesperado del servidor");
      }

      if (data.ok) {
        inputComentario.value = "";
        agregarComentarioDOM({
          username: currentUser.username,
          avatar: currentUser.avatar,
          comentario,
          creado_en: new Date(),
        });
      } else {
        alert(data.error || "Error enviando comentario");
      }
    } catch (err) {
      console.error("Error enviando comentario:", err);
      alert("Error enviando comentario");
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
      const res = await fetch(`${API}/game_jams/${jamId}/votos`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Respuesta no JSON al cargar votos:", text);
        ratingInfo.textContent = "Promedio: 0 (0 votos)";
        return;
      }

      if (data.ok) {
        ratingInfo.textContent = `Promedio: ${data.promedio.toFixed(1)} (${data.totalVotos} votos)`;
      } else {
        ratingInfo.textContent = "Promedio: 0 (0 votos)";
      }
    } catch (err) {
      console.error("Error cargando votos:", err);
      ratingInfo.textContent = "Promedio: 0 (0 votos)";
    }
  }

  async function enviarVoto() {
    const valor = obtenerValorSeleccionado();
    if (valor === 0) return alert("Selecciona una calificación antes de enviar");
    if (!token) return alert("Debes iniciar sesión para votar");

    try {
      const res = await fetch(`${API}/game_jams/${jamId}/votos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ puntuacion: valor }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Respuesta no JSON al enviar voto:", text);
        return alert("Error inesperado del servidor");
      }

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
      console.error("Error enviando voto:", err);
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
