document.addEventListener("DOMContentLoaded", async () => {
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  let token = localStorage.getItem("token");
  let username = localStorage.getItem("username");
  let avatar = localStorage.getItem("avatar");

  // =========================
  // 1️⃣ MOSTRAR DATOS GUARDADOS LOCALMENTE
  // =========================
  if (username) {
    currentUsername.textContent = username;
    if (avatar) {
      avatarCircle.style.backgroundImage = `url(${avatar})`;
      avatarCircle.style.backgroundSize = "cover";
      avatarCircle.style.backgroundPosition = "center";
      avatarIcon.style.display = "none";
    } else {
      resetAvatar();
    }
  } else {
    currentUsername.textContent = "Iniciar Sesión";
    resetAvatar();
  }

  // =========================
  // 2️⃣ SI HAY TOKEN, VALIDAR USUARIO
  // =========================
  if (token) {
    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.ok && data.user) {
        const user = data.user;
        currentUsername.textContent = user.username || "Usuario";
        localStorage.setItem("username", user.username);

        if (user.avatar) {
          avatarCircle.style.backgroundImage = `url(${user.avatar})`;
          avatarCircle.style.backgroundSize = "cover";
          avatarCircle.style.backgroundPosition = "center";
          avatarIcon.style.display = "none";
          localStorage.setItem("avatar", user.avatar);
        } else {
          resetAvatar();
        }
      } else {
        console.warn("⚠ Sesión inválida. Reiniciando...");
        logoutUser();
      }
    } catch (err) {
      console.error("❌ Error al cargar usuario:", err);
      logoutUser();
    }
  }

  // =========================
  // 3️⃣ FUNCIONES AUXILIARES
  // =========================
  function resetAvatar() {
    avatarCircle.style.backgroundImage = "none";
    avatarIcon.style.display = "block";
  }
});
