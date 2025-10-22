document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("ranking-juegos");
  const API_BASE = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app";
  const ITEMS_PER_PAGE = 10;
  let currentPage = 1;
  let juegosConVotos = [];

  // ========================
  // Función para cargar juegos y votos
  // ========================
  async function cargarJuegos() {
    try {
      const resJuegos = await fetch(`${API_BASE}/api/juegos`);
      const dataJuegos = await resJuegos.json();
      if (!dataJuegos.ok) {
        tbody.innerHTML = `<tr><td colspan="4" data-i18n="ranking.errorLoading">Error cargando juegos</td></tr>`;
        return;
      }
      const juegos = dataJuegos.juegos;

      juegosConVotos = await Promise.all(
        juegos.map(async (juego) => {
          const resVotos = await fetch(`${API_BASE}/api/juegos/${juego.id}/votos`);
          const dataVotos = await resVotos.json();
          return {
            ...juego,
            promedio: dataVotos.ok ? parseFloat(dataVotos.promedio) : 0,
            totalVotos: dataVotos.ok ? dataVotos.votos.length : 0
          };
        })
      );

      juegosConVotos.sort((a, b) => b.promedio - a.promedio);

      renderizarTabla();

    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="4" data-i18n="ranking.errorConnection">Error cargando datos</td></tr>`;
    }
  }

  // ========================
  // Función para renderizar tabla según la página
  // ========================
  function renderizarTabla() {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = juegosConVotos.slice(start, end);

    tbody.innerHTML = pageItems.map((juego, index) => `
      <tr>
        <td>${start + index + 1}</td>
        <td>
          <img src="${juego.cover || 'https://via.placeholder.com/40'}" width="40" height="40" style="vertical-align:middle; margin-right:5px;">
          <span data-i18n-text="${juego.title}">${juego.title}</span>
        </td>
        <td>${juego.main_genre || "N/A"}</td>
        <td>
          <span data-i18n-text="ranking.stars">${juego.promedio} ★</span> 
          (<span data-i18n-text="ranking.votes">${juego.totalVotos}</span>)
        </td>
      </tr>
    `).join("");

    renderPaginacion();
  }

  // ========================
  // Función de paginación
  // ========================
  function renderPaginacion() {
    const totalPages = Math.ceil(juegosConVotos.length / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById("pagination");

    if (!paginationContainer) {
      const nav = document.createElement("div");
      nav.id = "pagination";
      nav.style.marginTop = "10px";
      nav.style.textAlign = "center";
      tbody.parentNode.insertAdjacentElement("afterend", nav);
    }

    document.getElementById("pagination").innerHTML = `
      <button ${currentPage === 1 ? "disabled" : ""} id="prevPage" data-i18n="ranking.prev">Anterior</button>
      <span data-i18n="ranking.pageInfo">Página ${currentPage} de ${totalPages}</span>
      <button ${currentPage === totalPages ? "disabled" : ""} id="nextPage" data-i18n="ranking.next">Siguiente</button>
    `;

    document.getElementById("prevPage").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderizarTabla();
      }
    });
    document.getElementById("nextPage").addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderizarTabla();
      }
    });
  }

  cargarJuegos();
});
