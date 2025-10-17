// =========================
// 🔹 MENÚ HAMBURGUESA
// =========================
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  const hamburger = document.querySelector(".hamburger");

  navLinks.classList.toggle("active");
  hamburger.classList.toggle("active");

  const expanded = hamburger.classList.contains("active");
  hamburger.setAttribute("aria-expanded", expanded);
}

// Cerrar el menú al hacer clic en un enlace
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".nav-links").classList.remove("active");
    document.querySelector(".hamburger").classList.remove("active");
  });
});

