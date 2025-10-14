document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".header_tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();

      // Quitar "active" de todas las pestañas
      tabs.forEach(t => t.classList.remove("active"));
      // Quitar "active" y ocultar todos los contenidos
      contents.forEach(c => c.classList.remove("active"));

      // Activar pestaña clickeada
      tab.classList.add("active");
      // Mostrar contenido correspondiente
      const tabId = tab.getAttribute("data-tab");
      document.getElementById("tab-" + tabId).classList.add("active");
    });
  });
});