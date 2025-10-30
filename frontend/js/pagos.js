// =========================
// SISTEMA DE CONEXIÓN MERCADO PAGO MEJORADO
// =========================
document.addEventListener("DOMContentLoaded", async () => {
  const connectButton = document.getElementById("connectMPButton");
  const statusDiv = document.getElementById("mpStatus");
  const dataDiv = document.getElementById("mpData");

  // Verificar si estamos en una página con elementos de Mercado Pago
  if (!connectButton || !statusDiv || !dataDiv) {
    return;
  }

  let token = localStorage.getItem("token");
  let currentUser = null;

  // Función para mostrar mensajes
  function showStatus(message, color = "#33fc0b") {
    statusDiv.textContent = message;
    statusDiv.style.color = color;
    statusDiv.style.fontWeight = "bold";
  }

  // Función para mostrar loading
  function showLoading(message = "Cargando...") {
    showStatus(message, "#33fc0b");
    connectButton.disabled = true;
  }

  // Función para habilitar botón
  function enableButton() {
    connectButton.disabled = false;
  }

  // Verificar si el usuario está autenticado
  if (!token) {
    showStatus("🔒 Inicia sesión para conectar Mercado Pago", "#ff4444");
    connectButton.disabled = true;
    connectButton.textContent = "Inicia sesión primero";
    return;
  }

  // Cargar información del usuario actual
  async function loadCurrentUser() {
    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (data.ok && data.user) {
        currentUser = data.user;
        console.log("👤 Usuario cargado:", currentUser.username, "ID:", currentUser.user_id);
        return true;
      } else {
        console.error("❌ Error cargando usuario:", data.error);
        return false;
      }
    } catch (err) {
      console.error("❌ Error en carga de usuario:", err);
      return false;
    }
  }

  // Verificar estado actual de Mercado Pago
  async function checkMPStatus() {
    showLoading("Verificando estado de Mercado Pago...");

    try {
      // Primero cargar el usuario actual
      const userLoaded = await loadCurrentUser();
      if (!userLoaded) {
        showStatus("❌ Error al cargar usuario", "#ff4444");
        enableButton();
        return;
      }

      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/mercadopago/status", {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const data = await res.json();
      
      if (data.ok && data.connected) {
        showStatus("✅ Cuenta de Mercado Pago conectada", "#33fc0b");
        dataDiv.innerHTML = `
          <div style="margin-bottom: 15px; color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>👤 Usuario TakumiNet:</strong> ${currentUser.username} (ID: ${currentUser.user_id})<br>
                <strong>📧 Email MP:</strong> ${data.data.email}<br>
                <strong>🆔 ID de Cuenta MP:</strong> ${data.data.account_id}<br>
                <strong>📅 Conectado:</strong> ${new Date(data.data.connected_at).toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div style="text-align: right;">
                <span style="background: #33fc0b; color: black; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                  ✅ Conectado
                </span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="disconnectMPButton" class="button" style="background:#ff4444; color:white; padding:8px 15px; flex:1; border: none; border-radius: 5px; cursor: pointer;">
              🚫 Desconectar
            </button>
            <button id="refreshMPButton" class="button" style="background:#008cba; color:white; padding:8px 15px; flex:1; border: none; border-radius: 5px; cursor: pointer;">
              🔄 Actualizar
            </button>
          </div>
        `;
        connectButton.textContent = "🔄 Cambiar cuenta";
        
        // Agregar eventos a los botones
        document.getElementById("disconnectMPButton").addEventListener("click", disconnectMercadoPago);
        document.getElementById("refreshMPButton").addEventListener("click", checkMPStatus);
        
      } else {
        showStatus(`Conecta tu cuenta de Mercado Pago para recibir pagos 💰`, "#33fc0b");
        dataDiv.innerHTML = `
          <div style="background: #1d1d1d; border: 1px solid #33fc0b; padding: 10px; border-radius: 5px; margin-bottom: 10px; color: #ffffff;">
            <strong>👤 Usuario actual:</strong> ${currentUser.username} (ID: ${currentUser.user_id})<br>
            <strong>💡 ¿Por qué conectar Mercado Pago?</strong><br>
            - Recibe pagos por tus juegos<br>
            - Cobros automáticos y seguros<br>
            - Retiros inmediatos a tu cuenta
          </div>
        `;
        connectButton.textContent = "🔗 Conectar con Mercado Pago";
      }
      enableButton();
    } catch (err) {
      console.error("Error verificando estado:", err);
      showStatus("❌ Error al verificar estado de Mercado Pago", "#ff4444");
      enableButton();
    }
  }

  // Función para conectar Mercado Pago
  async function connectMercadoPago() {
    showLoading("Conectando con Mercado Pago...");

    try {
      // Primero cargar el usuario actual
      const userLoaded = await loadCurrentUser();
      if (!userLoaded) {
        showStatus("❌ Error al cargar usuario", "#ff4444");
        enableButton();
        return;
      }

      // Mostrar información del usuario actual
      const userInfo = `
        <div style="background: #2a2a2a; padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 3px solid #33fc0b;">
          <strong>👤 Conectando para:</strong> ${currentUser.username}<br>
          <strong>🆔 ID Usuario:</strong> ${currentUser.user_id}<br>
          <strong>📧 Email TakumiNet:</strong> ${currentUser.email}
        </div>
      `;

      // Pedir email de Mercado Pago
      const mpEmail = await showEmailModal(userInfo);
      if (!mpEmail) {
        showStatus("Conexión cancelada por el usuario", "#ffa500");
        enableButton();
        return;
      }

      // Validación básica de email
      if (!isValidEmail(mpEmail)) {
        showStatus("❌ Formato de email inválido", "#ff4444");
        enableButton();
        return;
      }

      // Pedir User ID de Mercado Pago
      const mpUserId = await showUserIdModal();
      if (!mpUserId) {
        showStatus("Conexión cancelada por el usuario", "#ffa500");
        enableButton();
        return;
      }

      // Enviar datos al servidor
      const response = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/mercadopago/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          mp_email: mpEmail.trim(),
          mp_user_id: mpUserId.trim()
        })
      });

      const result = await response.json();

      if (result.ok) {
        showStatus("✅ Cuenta de Mercado Pago conectada correctamente", "#33fc0b");
        
        // Mostrar resumen de la conexión
        dataDiv.innerHTML += `
          <div style="background: #1d3b1d; border: 1px solid #33fc0b; padding: 10px; border-radius: 5px; margin-top: 10px; color: #ffffff;">
            <strong>🎉 ¡Conectado exitosamente!</strong><br>
            Ahora puedes recibir pagos en: <strong>${result.data.email}</strong><br>
            Tu User ID: <strong>${result.data.user_id}</strong>
          </div>
        `;
        
        await checkMPStatus(); // Actualizar la interfaz
        
      } else {
        showStatus(`❌ Error: ${result.error}`, "#ff4444");
        enableButton();
      }
    } catch (err) {
      console.error(err);
      showStatus("❌ Error de conexión al servidor", "#ff4444");
      enableButton();
    }
  }

  // Función para desconectar Mercado Pago
  async function disconnectMercadoPago() {
    if (!confirm("¿Estás seguro de que quieres desconectar tu cuenta de Mercado Pago?\n\n⚠️ No podrás recibir pagos hasta que conectes una cuenta nuevamente.")) {
      return;
    }

    showLoading("Desconectando cuenta...");

    try {
      const response = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/mercadopago/disconnect", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const result = await response.json();

      if (result.ok) {
        showStatus("✅ Cuenta de Mercado Pago desconectada", "#33fc0b");
        setTimeout(() => {
          checkMPStatus(); // Actualizar la interfaz
        }, 1500);
      } else {
        showStatus(`❌ Error: ${result.error}`, "#ff4444");
        enableButton();
      }
    } catch (err) {
      console.error(err);
      showStatus("❌ Error al desconectar cuenta", "#ff4444");
      enableButton();
    }
  }

  // Helper: Validar email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Helper: Modal para email
  function showEmailModal(userInfo = "") {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="background: #2e2e2e; padding: 25px; border-radius: 10px; width: 90%; max-width: 500px; border: 2px solid #33fc0b; color: white;">
          <h3 style="margin-top: 0; color: #33fc0b;">🔗 Conectar Mercado Pago</h3>
          ${userInfo}
          <p>Ingresa el email de tu cuenta real de Mercado Pago:</p>
          <input type="email" id="mpEmailInput" 
                 placeholder="tu-email@mercadopago.com" 
                 style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #555; border-radius: 5px; background: #1d1d1d; color: white;">
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="confirmEmail" style="background: #33fc0b; color: black; border: none; padding: 12px 20px; border-radius: 5px; flex: 1; font-weight: bold; cursor: pointer;">✅ Continuar</button>
            <button id="cancelEmail" style="background: #ff4444; color: white; border: none; padding: 12px 20px; border-radius: 5px; flex: 1; cursor: pointer;">❌ Cancelar</button>
          </div>
          <div style="margin-top: 15px; padding: 10px; background: #1d1d1d; border-radius: 5px; font-size: 12px; border-left: 3px solid #33fc0b;">
            <strong>💡 Importante:</strong> Usa el mismo email de tu cuenta real de Mercado Pago donde quieres recibir los pagos.
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const input = document.getElementById('mpEmailInput');
      input.focus();
      
      document.getElementById('confirmEmail').onclick = () => {
        const email = input.value.trim();
        document.body.removeChild(modal);
        resolve(email);
      };
      
      document.getElementById('cancelEmail').onclick = () => {
        document.body.removeChild(modal);
        resolve(null);
      };

      // Cerrar modal al hacer click fuera
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(null);
        }
      };
    });
  }

  // Helper: Modal para User ID
  function showUserIdModal() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="background: #2e2e2e; padding: 25px; border-radius: 10px; width: 90%; max-width: 500px; border: 2px solid #33fc0b; color: white;">
          <h3 style="margin-top: 0; color: #33fc0b;">🆔 User ID de Mercado Pago</h3>
          <p>Ingresa tu <strong>User ID</strong> de Mercado Pago:</p>
          <input type="text" id="mpUserIdInput" 
                 placeholder="Ej: 2669472141" 
                 style="width: 100%; padding: 12px; margin: 15px 0; border: 1px solid #555; border-radius: 5px; background: #1d1d1d; color: white;">
          
          <div style="background: #1d1d1d; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 12px; border-left: 3px solid #008cba;">
            <strong>📌 ¿Dónde encuentro mi User ID?</strong><br>
            1. Ve a <a href="https://www.mercadopago.com.co" target="_blank" style="color: #33fc0b;">MercadoPago.com.co</a><br>
            2. Inicia sesión en tu cuenta<br>
            3. Ve a tu perfil → Configuración<br>
            4. Busca "Tu número de usuario" o "User ID"
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="confirmUserId" style="background: #33fc0b; color: black; border: none; padding: 12px 20px; border-radius: 5px; flex: 1; font-weight: bold; cursor: pointer;">✅ Conectar</button>
            <button id="cancelUserId" style="background: #ff4444; color: white; border: none; padding: 12px 20px; border-radius: 5px; flex: 1; cursor: pointer;">❌ Cancelar</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const input = document.getElementById('mpUserIdInput');
      input.focus();
      
      document.getElementById('confirmUserId').onclick = () => {
        const userId = input.value.trim();
        document.body.removeChild(modal);
        resolve(userId);
      };
      
      document.getElementById('cancelUserId').onclick = () => {
        document.body.removeChild(modal);
        resolve(null);
      };

      // Cerrar modal al hacer click fuera
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve(null);
        }
      };
    });
  }

  // Inicializar el sistema
  connectButton.addEventListener("click", connectMercadoPago);
  await checkMPStatus();
});

// =========================
// SISTEMA DE AVATAR Y USUARIO
// =========================
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