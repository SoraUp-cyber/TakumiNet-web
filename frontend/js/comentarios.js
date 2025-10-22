document.addEventListener("DOMContentLoaded", () => {
  // ======================
  // Obtener ID del foro desde la URL
  // ======================
  const params = new URLSearchParams(window.location.search);
  const foroId = params.get("id") || params.get("foroId"); // soporta ?id= y ?foroId=
  if (!foroId) {
    console.error("❌ No se encontró ID del foro en la URL");
    return;
  }

  // ======================
  // Elementos del DOM (foro)
  // ======================
  const foroImagen = document.getElementById("foroImagen");
  const foroTitulo = document.getElementById("foroTitulo");
  const foroCategoria = document.getElementById("foroCategoria");
  const foroFecha = document.getElementById("foroFecha");
  const foroDescripcion = document.getElementById("foroDescripcion");
  const foroEtiquetas = document.getElementById("foroEtiquetas");

  // ======================
  // Elementos del DOM (comentarios)
  // ======================
  const comentariosList = document.getElementById("comentariosList");
  const comentarioForm = document.getElementById("comentarioForm");
  const comentarioInput = document.getElementById("comentarioInput");

  // ======================
  // Función para cargar un foro por ID
  // ======================
  async function cargarForo(id) {
    try {
      const res = await fetch(`https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/foros/${id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });
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

  function mostrarForo(foro) {
    foroImagen.src = foro.imagen || "default-image.png";
    foroTitulo.textContent = foro.titulo;
    foroCategoria.textContent = foro.categoria;
    foroFecha.textContent = foro.fecha
      ? new Date(foro.fecha).toLocaleDateString()
      : new Date().toLocaleDateString();
    foroDescripcion.textContent = foro.descripcion;

    foroEtiquetas.innerHTML = "";
    if (foro.etiquetas && foro.etiquetas.length > 0) {
      foro.etiquetas.forEach(tag => {
        const span = document.createElement("span");
        span.className = "foro-tag";
        span.textContent = tag;
        foroEtiquetas.appendChild(span);
      });
    }
  }

  // ======================
  // Función para cargar comentarios
  // ======================
  async function cargarComentarios() {
    try {
      const res = await fetch(`https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/foros/${foroId}/comentarios`);
      const data = await res.json();

      comentariosList.innerHTML = "";

      if (!data.ok || data.comentarios.length === 0) {
        comentariosList.innerHTML = "<p>No hay comentarios aún ✍️</p>";
        return;
      }

      data.comentarios.forEach(c => {
        const div = document.createElement("div");
        div.classList.add("comentario");
        div.innerHTML = `
          <div class="comentario-header" style="display:flex;align-items:center;gap:10px;">
            <img src="${c.avatar || "https://via.placeholder.com/40"}"
                 alt="avatar"
                 style="width:40px;height:40px;border-radius:50%;">
            <div>
              <strong>${c.username || "Usuario"}</strong><br>
              <span style="color:#888;font-size:12px;">${new Date(c.created_at).toLocaleString()}</span>
            </div>
          </div>
          <p style="margin-top:5px;">${c.comentario}</p>
        `;
        comentariosList.appendChild(div);
      });
    } catch (err) {
      console.error("❌ Error cargando comentarios:", err);
    }
  }

  // ======================
  // Evento enviar comentario
  // ======================
  if (comentarioForm) {
    comentarioForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const texto = comentarioInput.value.trim();
      if (!texto) return;

      try {
        const res = await fetch(`https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/foros/${foroId}/comentarios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
          },
          body: JSON.stringify({ comentario: texto })
        });
        const data = await res.json();
        if (data.ok) {
          comentarioInput.value = "";
          cargarComentarios();
        } else {
          alert("❌ Error: " + (data.error || "No se pudo enviar el comentario"));
        }
      } catch (err) {
        console.error("❌ Error enviando comentario:", err);
      }
    });
  }

  // ======================
  // Inicializar
  // ======================
  cargarForo(foroId);
  cargarComentarios();
});