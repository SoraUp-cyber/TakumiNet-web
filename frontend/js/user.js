document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app"; // ⚙️ tu backend
  const token = localStorage.getItem("token");

  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");
  const discordBtn = document.getElementById("discordBtn");

  // ============================
  // 🔐 LOGIN CON DISCORD
  // ============================
  if (discordBtn) {
    discordBtn.addEventListener("click", () => {
      const CLIENT_ID = "1397287228744532162"; // 👈 tu client_id de Discord
      const REDIRECT_URI = "https://takuminet-app.netlify.app/discord-callback.html"; // 👈 callback autorizado en Discord
      const SCOPES = "identify email";

      // Construye la URL de autenticación
      const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;

      // Redirige al login de Discord
      window.location.href = DISCORD_AUTH_URL;
    });
  }

  // ============================
  // 👤 CARGAR USUARIO LOGUEADO
  // ============================
  async function loadUser() {
    if (!token) return; // No hay usuario logueado

    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.ok || !data.user) {
        console.warn("No se pudo cargar usuario:", data.error);
        return;
      }

      const user = data.user;

      // 🟢 Mostrar nombre de usuario
      if (currentUsername) {
        currentUsername.textContent = user.username || "Usuario de Discord";
      }

      // 🟢 Mostrar avatar del usuario
      if (avatarCircle && avatarIcon) {
        if (user.avatar) {
          avatarCircle.style.backgroundImage = `url(${user.avatar})`;
          avatarCircle.style.backgroundSize = "cover";
          avatarCircle.style.backgroundPosition = "center";
          avatarIcon.style.display = "none";
        } else {
          avatarCircle.style.backgroundImage = "none";
          avatarIcon.style.display = "block";
        }
      }
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
    }
  }

  await loadUser();
});
