document.addEventListener("DOMContentLoaded", () => {
  const forumContainer = document.getElementById("forum-container");

  // ===========================
  // Función para obtener los foros desde la API
  // ===========================
  async function cargarForos() {
    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/foros", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });

      const data = await res.json();

      if (!data.ok) {
        forumContainer.innerHTML = "<p>No se pudieron cargar los foros.</p>";
        return;
      }

      mostrarForos(data.foros || []);
    } catch (err) {
      console.error("Error cargando foros:", err);
      forumContainer.innerHTML = "<p>Error al cargar los foros.</p>";
    }
  }

  // ===========================
  // Función para renderizar foros
  // ===========================
  function mostrarForos(foros) {
    if (foros.length === 0) {
      forumContainer.innerHTML = "<p>No hay foros creados aún.</p>";
      return;
    }

    forumContainer.innerHTML = ""; // limpiar contenedor

    foros.forEach(foro => {
      const foroCard = document.createElement("div");
      foroCard.className = "foro-card";

      foroCard.innerHTML = `
        ${foro.imagen ? `<img src="${foro.imagen}" alt="${foro.titulo}" class="foro-image">` : ""}
        <h3 class="foro-title">${foro.titulo}</h3>
        <p class="foro-category">Categoría: ${foro.categoria}</p>
        <p class="foro-description">${foro.descripcion}</p>
        ${foro.etiquetas ? `<p class="foro-tags">Etiquetas: ${foro.etiquetas.join(", ")}</p>` : ""}
      `;

      // Redirigir al chat de comunidad al hacer clic en toda la tarjeta
      foroCard.addEventListener("click", () => {
        window.location.href = `chat comunidad.html?foroId=${foro.id}`;
      });

      // Cambiar el cursor para indicar que es clickeable
      foroCard.style.cursor = "pointer";

      forumContainer.appendChild(foroCard);
    });
  }

  // ===========================
  // Inicializar
  // ===========================
  cargarForos();
});
