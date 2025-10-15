document.addEventListener("DOMContentLoaded", () => {
  // ===========================
  // Elementos del DOM
  // ===========================
  const forumForm = document.getElementById("forumForm");
  const imagenInput = document.getElementById("imagen");
  const previewContainer = document.getElementById("preview-container");
  const imagePreview = document.getElementById("image-preview");
  const removeImageBtn = document.getElementById("remove-image");

  let selectedFile = null;
  const MAX_SIZE_MB = 10;

  // ===========================
  // Vista previa de imagen y validación de tamaño
  // ===========================
  imagenInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`La imagen no puede superar los ${MAX_SIZE_MB} MB.`);
      imagenInput.value = "";
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.src = reader.result;
      previewContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // ===========================
  // Quitar imagen
  // ===========================
  removeImageBtn.addEventListener("click", () => {
    selectedFile = null;
    imagenInput.value = "";
    imagePreview.src = "";
    previewContainer.style.display = "none";
  });

  // ===========================
  // Enviar formulario
  // ===========================
  forumForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const categoria = document.getElementById("categoria").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const etiquetas = document.getElementById("etiquetas").value.trim();

    if (!titulo || !categoria || !descripcion) return;

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("categoria", categoria);
    formData.append("descripcion", descripcion);
    formData.append("etiquetas", etiquetas);

    if (selectedFile) formData.append("imagen", selectedFile);

    try {
      const res = await fetch("http://localhost:3001/api/foros", {
        method: "POST",
        body: formData,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });

      const data = await res.json();

      if (data.ok) {
        // ✅ Mensaje de éxito y redirección
        alert("Se publicó correctamente 🎉");
        forumForm.reset();
        removeImageBtn.click();
        // Redirigir automáticamente a comunidad.html
        window.location.href = "comunidad.html";
      }
    } catch (err) {
      console.error("Error al enviar formulario:", err);
      // No mostramos alert, solo log
    }
  });
});
