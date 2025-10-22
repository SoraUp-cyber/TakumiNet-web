document.addEventListener("DOMContentLoaded", () => {
  const jamsContainer = document.getElementById("jamsContainer");
  const fechaInicioInput = document.getElementById("fechaInicio");
  const fechaFinInput = document.getElementById("fechaFin");
  const btnFiltrar = document.getElementById("btnFiltrar");
  const notificacion = document.getElementById("notificacion");

  const paginacionContainer = document.createElement("div");
  paginacionContainer.id = "paginacion";
  paginacionContainer.style.display = "flex";
  paginacionContainer.style.justifyContent = "center";
  paginacionContainer.style.gap = "10px";
  paginacionContainer.style.marginTop = "20px";
  jamsContainer.after(paginacionContainer);

  let todasJams = [];
  let paginaActual = 1;
  const itemsPorPagina = 5;

  function mostrarNotificacion(msg, tipo = "exito") {
    notificacion.textContent = msg;
    notificacion.style.background = tipo === "exito" ? "#4caf50" : "#f44336";
    notificacion.style.display = "block";
    requestAnimationFrame(() => {
      notificacion.style.opacity = 1;
      notificacion.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      notificacion.style.opacity = 0;
      notificacion.style.transform = "translateY(-20px)";
      setTimeout(() => (notificacion.style.display = "none"), 400);
    }, 3000);
  }

  function crearJamCard(jam) {
    const card = document.createElement("div");
    card.className = "jam-card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <img src="${jam.imagen_portada || 'assets/img/logo.png'}" alt="${jam.titulo}" class="jam-cover">
      <div class="jam-info">
        <h3>${jam.titulo}</h3>
        <p>${jam.descripcion_corta || ''}</p>
        <p><strong>Inicio:</strong> ${new Date(jam.fecha_inicio).toLocaleDateString()}</p>
        <p><strong>Fin:</strong> ${new Date(jam.fecha_fin).toLocaleDateString()}</p>
      </div>
    `;
    
    // ✅ Asegúrate de usar el campo correcto que devuelve tu API
    const jamId = jam.id || jam.juego_id || jam.game_jam_id; 
    card.addEventListener("click", () => {
      if (!jamId) {
        mostrarNotificacion("❌ ID de Game Jam no disponible", "error");
        return;
      }
      window.location.href = `jams.html?id=${jamId}`;
    });

    return card;
  }

  function renderizarJams(jams) {
    jamsContainer.innerHTML = "";
    if (jams.length === 0) {
      jamsContainer.innerHTML = "<p>No hay Game Jams disponibles.</p>";
      paginacionContainer.innerHTML = "";
      return;
    }

    const totalPaginas = Math.ceil(jams.length / itemsPorPagina);
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const jamsPagina = jams.slice(inicio, fin);

    jamsPagina.forEach(jam => jamsContainer.appendChild(crearJamCard(jam)));

    // Paginación
    paginacionContainer.innerHTML = "";
    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "← Anterior";
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderizarJams(jams);
      }
    });

    const btnSiguiente = document.createElement("button");
    btnSiguiente.textContent = "Siguiente →";
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnSiguiente.addEventListener("click", () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarJams(jams);
      }
    });

    paginacionContainer.appendChild(btnAnterior);
    paginacionContainer.appendChild(btnSiguiente);
  }

  function filtrarJams() {
    const inicio = fechaInicioInput.value ? new Date(fechaInicioInput.value) : null;
    const fin = fechaFinInput.value ? new Date(fechaFinInput.value) : null;

    const filtradas = todasJams.filter(jam => {
      const jamInicio = new Date(jam.fecha_inicio);
      const jamFin = new Date(jam.fecha_fin);

      if (inicio && fin) return jamFin >= inicio && jamInicio <= fin;
      if (inicio) return jamFin >= inicio;
      if (fin) return jamInicio <= fin;
      return true;
    });

    paginaActual = 1;
    renderizarJams(filtradas);
  }

  btnFiltrar.addEventListener("click", filtrarJams);

  async function cargarGameJams() {
    try {
      const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/game_jams");
      const data = await res.json();

      if (!data.ok) {
        mostrarNotificacion("❌ Error al cargar Game Jams: " + (data.error || "Desconocido"), "error");
        return;
      }

      todasJams = data.jams;
      renderizarJams(todasJams);
    } catch (err) {
      console.error(err);
      mostrarNotificacion("❌ Error al conectar con el servidor", "error");
    }
  }

  cargarGameJams();
});
