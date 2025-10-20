document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const backendUrl = "https://takumi-api-fawn.vercel.app"; // Cambiar si es producción

  // =======================
  // Overlay de bienvenida
  // =======================
  const welcomeOverlay = document.createElement("div");
  welcomeOverlay.className = "welcome-overlay";
  welcomeOverlay.style.display = "none";
  welcomeOverlay.innerHTML = `
    <div class="welcome-content">
      <div class="welcome-icon">🎉</div>
      <h1 class="welcome-title">¡Bienvenido a TakumiNet!</h1>
      <p class="welcome-subtitle">Registro completado con éxito</p>
      <div class="progress-bar"></div>
      <button class="continue-btn">Continuar</button>
    </div>
  `;
  document.body.appendChild(welcomeOverlay);

  // =======================
// =======================
// Función: Mostrar overlay y redirigir
// =======================
const showWelcome = (message = "Registro completado con éxito") => {
  const subtitle = welcomeOverlay.querySelector(".welcome-subtitle");
  const progressBar = welcomeOverlay.querySelector(".progress-bar");
  const continueBtn = welcomeOverlay.querySelector(".continue-btn");

  // Mostrar mensaje
  subtitle.textContent = message;
  welcomeOverlay.style.display = "flex";

  // Animación de barra de progreso
  progressBar.style.width = "0";
  setTimeout(() => {
    progressBar.style.width = "100%";
  }, 50);

  // Redirigir automáticamente después de 2.5 segundos
  setTimeout(() => {
    window.location.href = "index.html";
  }, 2500);

  // Permitir clic manual en el botón
  continueBtn.onclick = () => {
    window.location.href = "index.html";
  };
};

  // =======================
  // Función mostrar errores
  // =======================
  const showError = (msg) => {
    const errorBox = document.createElement("div");
    errorBox.className = "error-box";
    errorBox.textContent = msg;
    document.body.appendChild(errorBox);

    setTimeout(() => {
      errorBox.classList.add("fade-out");
      setTimeout(() => errorBox.remove(), 500);
    }, 3000);
  };

  // =======================
  // Manejo del formulario
  // =======================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = form.querySelector("#username").value.trim();
    const email = form.querySelector("#email").value.trim();
    const password = form.querySelector("#password").value;
    const confirmPassword = form.querySelector("#confirmPassword").value;
    const playGames = form.querySelector("#playGames")?.checked || false;
    const distributeContent = form.querySelector("#distributeContent")?.checked || false;
    const newsletter = form.querySelector("#newsletter")?.checked || false;

    // Validaciones rápidas
    if (username.length < 3) return showError("⚠️ El nombre de usuario debe tener al menos 3 caracteres.");
    if (!email.includes("@")) return showError("⚠️ Introduce un correo válido.");
    if (password.length < 6) return showError("⚠️ La contraseña debe tener mínimo 6 caracteres.");
    if (password !== confirmPassword) return showError("⚠️ Las contraseñas no coinciden.");

    try {
      const res = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, playGames, distributeContent, newsletter })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        showWelcome(data.message || "🎉 Registro exitoso");
      } else {
        showError(data.error || "❌ Error al registrarse");
      }
    } catch (err) {
      console.error(err);
      showError("❌ No se pudo conectar con el servidor.");
    }
  });

  // =======================
  // Estilos dinámicos overlay y errores
  // =======================
  const style = document.createElement("style");
  style.textContent = `
    .welcome-overlay {
      position: fixed; top:0; left:0; right:0; bottom:0;
      background: rgba(40,40,40,0.9);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; display:none;
      color: #ffffff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .welcome-content {
      background:#2c2c2c;
      padding:30px; border-radius:12px; text-align:center; max-width:400px; width:90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .welcome-icon { font-size:48px; margin-bottom:10px; color:#4CAF50; }
    .welcome-title { font-size:22px; margin:10px 0; color:#ffffff; }
    .welcome-subtitle { font-size:16px; color:#dddddd; margin-bottom:15px; }
    .progress-bar { 
      height:5px; width:0; background:#4CAF50; margin-bottom:15px; 
      transition: width 2.5s linear; border-radius:3px;
    }
    .continue-btn {
      padding:10px 20px; border:none; background:#4CAF50; color:white; border-radius:6px; cursor:pointer;
      font-weight: bold; transition: background 0.3s ease;
    }
    .continue-btn:hover { background: #45a049; }
    .error-box {
      position: fixed; top:20px; right:20px; background:#f44336; color:white; padding:12px 20px; border-radius:6px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5); z-index:10000; animation: slideIn 0.3s ease;
    }
    .error-box.fade-out { animation: fadeOut 0.5s ease forwards; }
    @keyframes slideIn { from {transform:translateX(100%); opacity:0;} to {transform:translateX(0); opacity:1;} }
    @keyframes fadeOut { to {opacity:0; transform:translateY(-20px);} }
  `;
  document.head.appendChild(style);
});
