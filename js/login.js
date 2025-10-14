document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const discordBtn = document.getElementById('discordBtn');

  // Contenedor de mensajes dinámico
  const errorBox = document.createElement('div');
  errorBox.className = 'message-container';
  loginForm.prepend(errorBox);

  const showMessage = (text, type = 'error') => {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>${text}`;
    errorBox.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
  };

  // Función para mostrar overlay de bienvenida
  const mostrarBienvenida = (username) => {
    const overlay = document.createElement('div');
    overlay.className = 'welcome-overlay';
    overlay.innerHTML = `
      <div class="welcome-content">
        <h1>🎉 Bienvenido, ${username}!</h1>
        <div class="progress-container">
          <div id="progressBar" class="progress-bar"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const progress = overlay.querySelector('#progressBar');
    let width = 0;
    const interval = setInterval(() => {
      width += 5;
      progress.style.width = width + '%';
      if (width >= 100) {
        clearInterval(interval);
        overlay.remove();
        window.location.href = "index.html"; // Redirige a la página principal
      }
    }, 20);
  };

  // Función para guardar token en localStorage
  const saveToken = (token) => {
    localStorage.setItem("token", token);
  };

  // Función para cargar usuario desde backend
  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:3001/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        const user = data.user;
        document.getElementById("current-username").textContent = user.username;
        const avatarCircle = document.getElementById("avatar-circle");
        const avatarIcon = document.getElementById("avatar-icon");

        if (user.avatar) {
          avatarCircle.style.backgroundImage = `url(${user.avatar})`;
          avatarCircle.style.backgroundSize = "cover";
          avatarIcon.style.display = "none";
        } else {
          avatarCircle.style.backgroundImage = "none";
          avatarIcon.style.display = "block";
        }
      }
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  };

  // Evento submit del formulario de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';

    const username = loginForm.querySelector('input[placeholder="Usuario o Apodo"]').value.trim();
    const password = loginForm.querySelector('input[placeholder="Contraseña"]').value.trim();

    if (!username || !password) {
      showMessage("⚠️ Completa todos los campos");
      return;
    }

    loginForm.classList.add('loading');

    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      loginForm.classList.remove('loading');

      if (!data.ok) {
        showMessage(data.error || "Usuario o contraseña inválidos");
        return;
      }

      // Guardar token JWT en localStorage
      saveToken(data.token);

      // Mostrar bienvenida
      mostrarBienvenida(data.user.username);

    } catch (err) {
      loginForm.classList.remove('loading');
      console.error(err);
      showMessage("❌ No se pudo conectar al servidor");
    }
  });

  // Botón Discord (solo mensaje)
  if (discordBtn) {
    discordBtn.addEventListener("click", () => {
      showMessage("⚠️ Login con Discord solo funciona en backend real.");
    });
  }

  // Cargar usuario automáticamente si ya hay token
  loadUser();
});