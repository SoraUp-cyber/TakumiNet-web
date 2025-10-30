document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const jamForm = document.getElementById("jamForm");
  const notificacion = document.getElementById("notificacion");
  const preview = document.getElementById("preview");

  // =====================
  // Mostrar notificación
  // =====================
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
    }, 4000);
  }

  // =====================
  // Convertir imagen a Base64
  // =====================
  function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // =====================
  // Obtener user_id del token
  // =====================
  function obtenerUserId() {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.user_id || null;
    } catch {
      return null;
    }
  }

  // =====================
  // Validar y mostrar preview de imagen
  // =====================
  document.getElementById("imagen_portada").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 10; // Límite 10 MB
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      mostrarNotificacion(`❌ La imagen no puede superar ${MAX_SIZE_MB} MB`, "error");
      this.value = "";
      preview.style.display = "none";
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // =====================
  // Obtener datos del formulario
  // =====================
  async function obtenerDatosGameJam() {
    const archivo = document.getElementById("imagen_portada").files[0];
    const imagen_base64 = archivo ? await convertirImagenABase64(archivo) : null;

    return {
      user_id: obtenerUserId(),
      titulo: document.getElementById("titulo").value.trim(),
      descripcion_corta: document.getElementById("descripcion_corta").value.trim(),
      url: document.getElementById("url").value.trim(),
      tipo_jam: document.getElementById("tipo_jam").value,
      quien_vota: document.getElementById("quien_vota").value,
      fecha_inicio: document.getElementById("fecha_inicio").value,
      fecha_fin: document.getElementById("fecha_fin").value,
      fecha_votacion: document.getElementById("fecha_votacion").value,
      imagen_portada_base64: imagen_base64,
      contenido: document.getElementById("contenido").value.trim(),
      criterios: document.getElementById("criterios").value.trim(),
      hashtag: document.getElementById("hashtag").value.trim(),
      comunidad: document.getElementById("comunidad").checked ? 1 : 0,
      bloquear_subidas: document.getElementById("bloquear_subidas").checked ? 1 : 0,
      ocultar_resultados: document.getElementById("ocultar_resultados").checked ? 1 : 0,
      ocultar_submisiones: document.getElementById("ocultar_submisiones").checked ? 1 : 0,
      visibilidad: document.getElementById("visibilidad").value
    };
  }

  // =====================
  // Enviar formulario
  // =====================
  jamForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validar campos obligatorios
    const requeridos = [
      "titulo", "descripcion_corta", "url", "tipo_jam",
      "quien_vota", "fecha_inicio", "fecha_fin",
      "fecha_votacion", "contenido", "visibilidad"
    ];

    for (let id of requeridos) {
      if (!document.getElementById(id).value.trim()) {
        mostrarNotificacion("❌ Completa todos los campos obligatorios", "error");
        return;
      }
    }

    // Validar que haya token
    if (!token) {
      mostrarNotificacion("❌ Debes estar logueado", "error");
      return;
    }

    // Validar tamaño de imagen antes de enviar
    const archivo = document.getElementById("imagen_portada").files[0];
    if (archivo) {
      const MAX_SIZE_MB = 10;
      if (archivo.size > MAX_SIZE_MB * 1024 * 1024) {
        mostrarNotificacion(`❌ La imagen no puede superar ${MAX_SIZE_MB} MB`, "error");
        return;
      }
    }

    // Obtener datos y enviar
    const data = await obtenerDatosGameJam();

    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/game_jams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (result.ok) {
        mostrarNotificacion("✅ Game Jam creada! ID: " + result.id, "exito");
        jamForm.reset();
        preview.style.display = "none";
      } else {
        mostrarNotificacion("❌ Error: " + result.error, "error");
      }
    } catch (err) {
      console.error(err);
      mostrarNotificacion("❌ Error al crear la Game Jam", "error");
    }
  });
});
