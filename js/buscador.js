document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.querySelector(".search-input");

  // Crear contenedor de resultados si no existe
  let resultados = document.getElementById("resultados-busqueda");
  if (!resultados) {
    resultados = document.createElement("div");
    resultados.id = "resultados-busqueda";
    searchInput.parentElement.appendChild(resultados);
  }

  const API_BASE = "http://localhost:3001";
  const token = localStorage.getItem("token");
  let juegosData = [];

  // =========================
  // Cargar juegos desde API
  // =========================
  async function cargarJuegos() {
    try {
      const res = await fetch(`${API_BASE}/api/juegos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      juegosData = data.juegos || [];
    } catch (err) {
      console.error("Error cargando juegos:", err);
    }
  }

  await cargarJuegos();

  // =========================
  // Función para mostrar resultados con portada
  // =========================
  function mostrarResultados(query) {
    resultados.innerHTML = "";
    if (!query) {
      resultados.style.display = "none"; // Ocultar lista si no hay texto
      return;
    }

    const filtrados = juegosData.filter(j =>
      (j.title && j.title.toLowerCase().includes(query)) ||
      (j.description && j.description.toLowerCase().includes(query))
    );

    if (filtrados.length === 0) {
      resultados.innerHTML = "<p>No se encontraron juegos</p>";
    } else {
      filtrados.forEach(juego => {
        const div = document.createElement("div");

        const img = document.createElement("img");
        img.src = juego.cover || "https://via.placeholder.com/50x50?text=Sin+Portada";
        img.alt = juego.title;

        const title = document.createElement("span");
        title.textContent = juego.title;

        div.appendChild(img);
        div.appendChild(title);

        // =========================
        // Click para ir al perfil del juego
        // =========================
        div.addEventListener("click", () => {
          window.location.href = `perfil-juegos.html?id=${juego.id}`;
        });

        resultados.appendChild(div);
      });
    }

    resultados.style.display = "block"; // Mostrar lista
  }

  // =========================
  // Búsqueda instantánea
  // =========================
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    mostrarResultados(query);
  });
});
