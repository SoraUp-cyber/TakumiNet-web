document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.querySelector(".mobile-search-input");
  const resultados = document.getElementById("resultados-busqueda-movil");
  const cerrarBtn = document.createElement("button");

  // 🔘 Botón de cierre (X)
  cerrarBtn.classList.add("cerrar-resultados");
  cerrarBtn.innerHTML = "×";
  cerrarBtn.setAttribute("aria-label", "Cerrar resultados");
  cerrarBtn.style.position = "absolute";
  cerrarBtn.style.top = "8px";
  cerrarBtn.style.right = "10px";
  cerrarBtn.style.background = "transparent";
  cerrarBtn.style.border = "none";
  cerrarBtn.style.color = "#fff";
  cerrarBtn.style.fontSize = "22px";
  cerrarBtn.style.cursor = "pointer";

  resultados.appendChild(cerrarBtn);

  // 🔗 URL del backend
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
  let juegosData = [];

  // ⚙️ Cargar juegos desde la API
  async function cargarJuegos() {
    try {
      const res = await fetch(`${API_BASE}/api/juegos`);
      const data = await res.json();
      juegosData = data.juegos || [];
    } catch (err) {
      console.error("Error cargando juegos:", err);
    }
  }

  await cargarJuegos();

  // 🎯 Mostrar resultados filtrados
  function mostrarResultados(query) {
    resultados.innerHTML = ""; // Limpia antes de volver a llenar
    resultados.appendChild(cerrarBtn); // Vuelve a agregar el botón X

    if (!query) {
      resultados.style.display = "none";
      return;
    }

    const filtrados = juegosData.filter(j =>
      (j.title && j.title.toLowerCase().includes(query)) ||
      (j.description && j.description.toLowerCase().includes(query))
    );

    if (filtrados.length === 0) {
      resultados.innerHTML += "<p style='padding:5px;'>No se encontraron juegos</p>";
    } else {
      filtrados.forEach(juego => {
        const div = document.createElement("div");
        div.classList.add("resultado-item");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.gap = "10px";
        div.style.padding = "8px";
        div.style.cursor = "pointer";
        div.style.borderBottom = "1px solid #444";

        const img = document.createElement("img");
        img.src = juego.cover || "https://via.placeholder.com/50x50?text=Sin+Portada";
        img.alt = juego.title;
        img.style.width = "50px";
        img.style.height = "50px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "6px";

        const title = document.createElement("span");
        title.textContent = juego.title;
        title.style.color = "#fff";

        div.appendChild(img);
        div.appendChild(title);

        div.addEventListener("click", () => {
          window.location.href = `perfil-juegos.html?id=${juego.id}`;
        });

        resultados.appendChild(div);
      });
    }

    resultados.style.display = "block";
  }

  // 🔎 Búsqueda en tiempo real
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    mostrarResultados(query);
  });

  // 🛑 Evita que el formulario recargue la página
  const form = document.querySelector(".mobile-search-box");
  if (form) form.addEventListener("submit", e => e.preventDefault());

  // ❌ Cerrar resultados al presionar la X
  cerrarBtn.addEventListener("click", () => {
    resultados.style.display = "none";
    searchInput.value = "";
  });
});
