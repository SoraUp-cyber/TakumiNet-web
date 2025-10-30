document.addEventListener("DOMContentLoaded", async () => {
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  let token = localStorage.getItem("token");

  // =========================
  // 1️⃣ DETECTAR Y PROCESAR LOGIN CON DISCORD
  // =========================
  const params = new URLSearchParams(window.location.search);
  const discordCode = params.get("code");

  if (discordCode) {
    console.log("🔐 Código OAuth de Discord detectado:", discordCode);

    try {
      currentUsername.textContent = "Conectando con Discord...";
      
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/auth/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discordCode })
      });

      const data = await res.json();
      console.log("📨 Respuesta del backend:", data);

      if (data.ok) {
        // ✅ MOSTRAR DATOS DE DISCORD INMEDIATAMENTE
        if (data.discordUser) {
          const discordUser = data.discordUser;
          currentUsername.textContent = discordUser.global_name || discordUser.username;
          
          if (discordUser.avatar) {
            avatarCircle.style.backgroundImage = `url(${discordUser.avatar})`;
            avatarCircle.style.backgroundSize = "cover";
            avatarCircle.style.backgroundPosition = "center";
            avatarIcon.style.display = "none";
          }
        }

        // ✅ GUARDAR TOKEN SI EXISTE
        if (data.token) {
          localStorage.setItem("token", data.token);
          token = data.token;
          console.log("✅ Token guardado");
        }

        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log("✅ Login con Discord exitoso");
        
      } else {
        console.error("❌ Error en autenticación Discord:", data.error);
        currentUsername.textContent = "Error en login";
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err);
      currentUsername.textContent = "Error de conexión";
    }
  }

  // =========================
  // 2️⃣ CARGAR USUARIO (NORMAL O DISCORD)
  // =========================
  if (token) {
    await loadUser(token);
  } else {
    currentUsername.textContent = "Iniciar Sesión";
    resetAvatar();
  }

  async function loadUser(userToken) {
    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      const data = await res.json();

      if (data.ok && data.user) {
        const user = data.user;
        currentUsername.textContent = user.username || "Usuario";
        
        if (user.avatar) {
          avatarCircle.style.backgroundImage = `url(${user.avatar})`;
          avatarCircle.style.backgroundSize = "cover";
          avatarCircle.style.backgroundPosition = "center";
          avatarIcon.style.display = "none";
        } else {
          resetAvatar();
        }
      } else {
        console.error("❌ Error cargando usuario:", data.error);
        localStorage.removeItem("token");
        currentUsername.textContent = "Iniciar Sesión";
        resetAvatar();
      }
    } catch (err) {
      console.error("❌ Error en carga de usuario:", err);
    }
  }

  function resetAvatar() {
    avatarCircle.style.backgroundImage = "none";
    avatarIcon.style.display = "block";
  }
});