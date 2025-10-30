document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const discordBtn = document.getElementById("discordBtn");
  
  // ✅ CONFIGURACIÓN PRODUCCIÓN
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";

  // =======================
  // OVERLAY DE BIENVENIDA
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
  // FUNCIONES PRINCIPALES
  // =======================

  const showWelcome = (message = "Registro completado con éxito") => {
    const subtitle = welcomeOverlay.querySelector(".welcome-subtitle");
    const progressBar = welcomeOverlay.querySelector(".progress-bar");
    const continueBtn = welcomeOverlay.querySelector(".continue-btn");

    subtitle.textContent = message;
    welcomeOverlay.style.display = "flex";

    progressBar.style.width = "0";
    setTimeout(() => progressBar.style.width = "100%", 50);

    setTimeout(() => window.location.href = "index.html", 2500);
    continueBtn.onclick = () => window.location.href = "index.html";
  };

  const showError = (msg) => {
    const existingErrors = document.querySelectorAll('.error-box');
    existingErrors.forEach(error => error.remove());

    const errorBox = document.createElement("div");
    errorBox.className = "error-box";
    errorBox.textContent = msg;
    document.body.appendChild(errorBox);

    setTimeout(() => {
      errorBox.classList.add("fade-out");
      setTimeout(() => errorBox.remove(), 500);
    }, 4000);
  };

  const showFieldError = (fieldId, message) => {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  };

  const clearFieldErrors = () => {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });
  };

  // =======================
  // VALIDACIÓN EN TIEMPO REAL
  // =======================
  const setupRealTimeValidation = () => {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    usernameInput.addEventListener('blur', () => {
      const username = usernameInput.value.trim();
      if (username.length > 0 && username.length < 3) {
        showFieldError('usernameError', 'Mínimo 3 caracteres');
      } else {
        showFieldError('usernameError', '');
      }
    });

    emailInput.addEventListener('blur', () => {
      const email = emailInput.value.trim();
      if (email.length > 0 && !email.includes('@')) {
        showFieldError('emailError', 'Email debe contener @');
      } else {
        showFieldError('emailError', '');
      }
    });

    passwordInput.addEventListener('blur', () => {
      const password = passwordInput.value;
      if (password.length > 0 && password.length < 6) {
        showFieldError('passwordError', 'Mínimo 6 caracteres');
      } else {
        showFieldError('passwordError', '');
      }
    });

    confirmPasswordInput.addEventListener('blur', () => {
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      if (confirmPassword.length > 0 && password !== confirmPassword) {
        showFieldError('confirmError', 'Las contraseñas no coinciden');
      } else {
        showFieldError('confirmError', '');
      }
    });
  };

  // =======================
  // LOGIN AUTOMÁTICO
  // =======================
  const autoLogin = async (username, password) => {
    try {
      console.log('🔐 Haciendo login automático...');
      
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        console.log('✅ Login automático exitoso');
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user.id);
        localStorage.setItem("username", data.user.username);
        
        if (data.user.avatar) {
          localStorage.setItem("avatar", data.user.avatar);
        }
        
        return true;
      } else {
        console.error('❌ Error en login automático:', data.error);
        return false;
      }
    } catch (err) {
      console.error('🔌 Error de conexión en login:', err);
      return false;
    }
  };

  // =======================
  // MANEJO DEL FORMULARIO
  // =======================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms")?.checked || false;

    // VALIDACIONES
    let hasErrors = false;

    if (!terms) {
      showError("⚠️ Debes aceptar los términos y condiciones");
      hasErrors = true;
    }

    if (username.length < 3) {
      showFieldError('usernameError', 'Mínimo 3 caracteres');
      hasErrors = true;
    }
    
    if (!email.includes("@")) {
      showFieldError('emailError', 'Email debe contener @');
      hasErrors = true;
    }
    
    if (password.length < 6) {
      showFieldError('passwordError', 'Mínimo 6 caracteres');
      hasErrors = true;
    }
    
    if (password !== confirmPassword) {
      showFieldError('confirmError', 'Las contraseñas no coinciden');
      hasErrors = true;
    }

    if (hasErrors) return;

    // ESTADO DEL BOTÓN
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    submitBtn.disabled = true;

    try {
      console.log('📤 Registrando usuario...');
      
      // ✅ REGISTRO
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        console.log('✅ Registro exitoso, procediendo a login...');
        
        // ✅ LOGIN AUTOMÁTICO
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        const loginSuccess = await autoLogin(username, password);
        
        if (loginSuccess) {
          console.log('🎉 Registro y login completados');
          showWelcome("🎉 ¡Cuenta creada y sesión iniciada!");
        } else {
          console.log('⚠️ Registro exitoso pero login falló');
          showWelcome("✅ ¡Registro exitoso! Inicia sesión manualmente");
        }
        
      } else {
        const errorMsg = data.error || "Error desconocido";
        console.error('❌ Error del servidor:', errorMsg);
        
        if (errorMsg.includes("Usuario o email ya existe")) {
          showError("❌ El usuario o email ya está registrado");
        } else if (errorMsg.includes("Username corto")) {
          showError("❌ El nombre de usuario es muy corto");
        } else if (errorMsg.includes("Email inválido")) {
          showError("❌ El email no es válido");
        } else if (errorMsg.includes("Contraseña corta")) {
          showError("❌ La contraseña es muy corta");
        } else {
          showError(`❌ ${errorMsg}`);
        }
      }

    } catch (err) {
      console.error("🔌 Error de conexión:", err);
      showError("🔌 No se pudo conectar con el servidor");
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // =======================
  // BOTÓN DISCORD
  // =======================
  if (discordBtn) {
    discordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showError("🔗 Función Discord en desarrollo");
    });
  }

  // =======================
  // INICIALIZACIÓN
  // =======================
  setupRealTimeValidation();

  // ESTILOS DINÁMICOS
  const style = document.createElement("style");
  style.textContent = `
    .welcome-overlay {
      position: fixed; top:0; left:0; right:0; bottom:0;
      background: rgba(40,40,40,0.95);
      display:flex; align-items:center; justify-content:center;
      z-index:9999;
      color: #ffffff;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .welcome-content {
      background:#2c2c2c;
      padding:30px; border-radius:12px; text-align:center; max-width:400px; width:90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      border: 1px solid #404040;
    }
    .welcome-icon { font-size:48px; margin-bottom:10px; }
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
      max-width: 300px;
      border-left: 4px solid #d32f2f;
    }
    .error-box.fade-out { animation: fadeOut 0.5s ease forwards; }
    @keyframes slideIn { from {transform:translateX(100%); opacity:0;} to {transform:translateX(0); opacity:1;} }
    @keyframes fadeOut { to {opacity:0; transform:translateY(-20px);} }
    button[disabled] { opacity: 0.7; cursor: not-allowed; }
    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 5px;
      display: none;
    }
    .fa-spinner { animation: spin 1s linear infinite; }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  console.log('✅ Formulario de registro inicializado');
  console.log('🔗 Conectando a:', API_BASE);
});