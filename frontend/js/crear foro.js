document.addEventListener("DOMContentLoaded", () => {
  const forumForm = document.getElementById("forumForm");
  const imagenInput = document.getElementById("imagen");
  const previewContainer = document.getElementById("preview-container");
  const imagePreview = document.getElementById("image-preview");
  const removeImageBtn = document.getElementById("remove-image");

  let selectedFile = null;
  const MAX_SIZE_MB = 10;

  // Vista previa de imagen
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

  // Quitar imagen
  removeImageBtn.addEventListener("click", () => {
    selectedFile = null;
    imagenInput.value = "";
    imagePreview.src = "";
    previewContainer.style.display = "none";
  });

  // Enviar formulario
  forumForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const categoria = document.getElementById("categoria").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const etiquetas = document.getElementById("etiquetas").value.trim();

    if (!titulo || !categoria || !descripcion) return;

    let imagenBase64 = null;
    if (selectedFile) {
      imagenBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(selectedFile);
      });
    }

    try {
      const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/foros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          titulo,
          categoria,
          descripcion,
          etiquetas,
          imagenBase64
        })
      });

      const data = await res.json();

      if (data.ok) {
        alert("Se publicó correctamente 🎉");
        forumForm.reset();
        removeImageBtn.click();
        window.location.href = "comunidad.html";
      } else {
        alert("Error: " + (data.error || "No se pudo crear el foro"));
      }
    } catch (err) {
      console.error("Error al enviar formulario:", err);
      alert("Error al crear el foro, revisa la consola");
    }
  });
});
