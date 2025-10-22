  // === Función para mostrar y usar el botón de subir arriba ===
document.addEventListener("DOMContentLoaded", () => {
  const btnScroll = document.getElementById("btn-scroll-top");

  if (!btnScroll) return;

  // Mostrar/ocultar según el scroll
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      btnScroll.classList.add("show");
    } else {
      btnScroll.classList.remove("show");
    }
  });

  // Subir con animación suave
  btnScroll.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    btnScroll.blur(); // quita el foco del botón
  });
});
