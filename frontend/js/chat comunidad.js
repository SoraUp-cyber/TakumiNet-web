document.addEventListener("DOMContentLoaded", async () => {
  // ======================
  // Obtener ID del foro desde la URL
  // ======================
  const params = new URLSearchParams(window.location.search);
  const foroId = params.get("id") || params.get("foroId");

  if (!foroId) {
    console.error("❌ No se encontró ID del foro en la URL");
    return;
  }

  // ======================
  // Elementos del DOM
  // ======================
  const foroImagen = document.getElementById("foroImagen");
  const foroTitulo = document.getElementById("foroTitulo");
  const foroCategoria = document.getElementById("foroCategoria");
  const foroFecha = document.getElementById("foroFecha");
  const foroDescripcion = document.getElementById("foroDescripcion");
  const foroEtiquetas = document.getElementById("foroEtiquetas");

  // ======================
  // Función para cargar foro desde API
  // ======================
  async function cargarForo(id) {
    try {
      const res = await fetch(`https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/foros/${id}`);
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Foro no encontrado");

      mostrarForo(data.foro);
    } catch (err) {
      console.error("❌ Error cargando foro:", err);
      foroTitulo.textContent = "Foro no encontrado";
      foroDescripcion.textContent = "";
      foroImagen.src = "default-image.png";
    }
  }

  // ======================
  // Función para mostrar datos en el DOM
  // ======================
  function mostrarForo(foro) {
    foroImagen.src = foro.imagen || "default-image.png";
    foroTitulo.textContent = foro.titulo || "Sin título";
    foroCategoria.textContent = foro.categoria || "General";
    foroFecha.textContent = foro.fecha
      ? new Date(foro.fecha).toLocaleDateString()
      : "Fecha no disponible";
    foroDescripcion.textContent = foro.descripcion || "Sin descripción";

    // Limpiar etiquetas anteriores
    foroEtiquetas.innerHTML = "";

    // Cargar etiquetas
    if (foro.etiquetas?.length) {
      foro.etiquetas.forEach(tag => {
        const span = document.createElement("span");
        span.className = "foro-tag";
        span.textContent = tag;
        foroEtiquetas.appendChild(span);
      });
    }
  }

  // ======================
  // Ejecutar carga del foro
  // ======================
  cargarForo(foroId);
});
