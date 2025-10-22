document.addEventListener("DOMContentLoaded", () => {
  const btnInfo = document.getElementById("btnInfo");
  const infoUsuario = document.getElementById("infoUsuario");
  const API_BASE = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app";
  const token = localStorage.getItem("token");

  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");
  let panelVisible = false;

  btnInfo.addEventListener("click", async () => {
    panelVisible = !panelVisible;

    // Alternar visibilidad
    infoUsuario.style.display = panelVisible ? "block" : "none";
    btnInfo.textContent = panelVisible ? "Ocultar información" : "Ver información";

    if (!panelVisible) return;
    if (!juegoId) {
      infoUsuario.innerHTML = "<p style='color:red;'>No se especificó un juego</p>";
      return;
    }

    infoUsuario.innerHTML = "<p>Cargando información del creador...</p>";

    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "No se pudo cargar el juego");

      const creador = data.juego;

      infoUsuario.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
          <img src="${creador.avatar || 'https://via.placeholder.com/50'}" alt="Avatar" width="50" style="border-radius:50%;"/>
          <strong>${creador.username || 'Desconocido'}</strong>
        </div>
        <p><strong>Bio:</strong> ${creador.descripcion || 'Sin descripción'}</p>
        <p><strong>Contacto:</strong> ${creador.contacto_email || 'N/A'}</p>
        <p><strong>Redes:</strong>
          ${creador.twitter ? `<a href="${creador.twitter}" target="_blank">Twitter</a> ` : ''}
          ${creador.instagram ? `<a href="${creador.instagram}" target="_blank">Instagram</a> ` : ''}
          ${creador.youtube ? `<a href="${creador.youtube}" target="_blank">YouTube</a> ` : ''}
          ${creador.discord ? `<a href="${creador.discord}" target="_blank">Discord</a>` : ''}
        </p>
      `;

    } catch (err) {
      console.error(err);
      infoUsuario.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
  });
});
