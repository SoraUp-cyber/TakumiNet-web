document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token"); // Token guardado al login
  if (!token) return;

  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  // =========================
  // Cargar usuario
  // =========================
  async function loadUser() {
    try {
      const res = await fetch("http://localhost:3001/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok) return console.error("No se pudo cargar usuario:", data.error);

      const user = data.user;
      currentUsername.textContent = user.username || "Invitado";

      if (user.avatar) {
        avatarCircle.style.backgroundImage = `url(${user.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarIcon.style.display = "none";
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  loadUser();
});
