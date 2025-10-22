document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const connectPayPalBtn = document.getElementById("connectPayPalButton");
  const paypalStatus = document.getElementById("paypalStatus");
  const paypalData = document.getElementById("paypalData");

  const BACKEND_URL = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app";
  const PAYPAL_PARTNER_URL = "https://www.paypal.com/bizsignup/partner/entry?referralToken=YmIxMjkyNjctOTU0Ny00ZTZlLWIxZjgtZWQ0NDBmZGZhNDk5VkFld0Vla211QjBCME44VEwzNjFEaVVjMzhtRGhWcnRaNUR3d1lyNm9ZTT12Mg==";
  const REDIRECT_URL = "https://takuminet-app.netlify.app/pagos-desarrollador";

  // =========================
  // Cargar usuario y estado de PayPal
  // =========================
  async function loadUser() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.ok) return console.error("No se pudo cargar usuario:", data.error);

      const user = data.user;

      // Estado de PayPal
      if (user.paypalConnected) {
        paypalStatus.textContent = "Cuenta PayPal conectada ✅";
        connectPayPalBtn.textContent = "PayPal Conectado ✅";
        connectPayPalBtn.style.background = "#00a86b";
        connectPayPalBtn.disabled = true;

        // Mostrar datos reales de la cuenta
        loadPayPalData();
      } else {
        paypalStatus.textContent = "Conecta tu cuenta PayPal para recibir pagos";
        connectPayPalBtn.textContent = "Conectar con PayPal";
        connectPayPalBtn.style.background = "#1f9900";
        connectPayPalBtn.disabled = false;
      }
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  await loadUser();

  // =========================
  // Botón "Conectar con PayPal" - Redirección real a PayPal Partners
  // =========================
  connectPayPalBtn.addEventListener("click", async () => {
    try {
      paypalStatus.textContent = "Iniciando conexión con PayPal...";
      
      // 1. Obtener URL de autorización del backend con la URL de retorno correcta
      const authRes = await fetch(`${BACKEND_URL}/api/paypal/auth-url?redirect_url=${encodeURIComponent(REDIRECT_URL)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const authData = await authRes.json();
      
      if (authData.ok && authData.authUrl) {
        // 2. Redirigir a la URL de autorización de PayPal
        window.location.href = authData.authUrl;
      } else {
        // 3. Fallback: Redirigir al registro de partners
        paypalStatus.textContent = "Redirigiendo a PayPal Partners...";
        setTimeout(() => {
          window.open(PAYPAL_PARTNER_URL, '_blank');
        }, 1000);
      }
    } catch (err) {
      console.error("Error iniciando conexión PayPal:", err);
      // Fallback al registro directo
      paypalStatus.textContent = "Redirigiendo a PayPal Partners...";
      setTimeout(() => {
        window.open(PAYPAL_PARTNER_URL, '_blank');
      }, 1000);
    }
  });

  // =========================
  // Cargar datos reales de PayPal
  // =========================
  async function loadPayPalData() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/paypal/account-info`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      
      if (!data.ok) {
        paypalData.innerHTML = `
          <div style="color:orange; background:#fff8e6; padding:10px; border-radius:5px;">
            ⚠️ Información de cuenta no disponible
          </div>
        `;
        return;
      }

      // Mostrar información real de la cuenta PayPal con botón de desconexión
      paypalData.innerHTML = `
        <div style="background:#f0f8f0; padding:15px; border-radius:8px; margin-top:10px;">
          <h4 style="margin-top:0; color:#2d5016;">✅ Cuenta PayPal Conectada</h4>
          <p><strong>Email de la cuenta:</strong> ${data.email || 'No disponible'}</p>
          <p><strong>ID de comerciante:</strong> ${data.merchant_id || 'No disponible'}</p>
          <p><strong>Estado de verificación:</strong> ${data.verification_status || 'No disponible'}</p>
          <p><strong>Capacidad de recibir pagos:</strong> ${data.payments_receivable ? '✅ Sí' : '❌ No'}</p>
          ${data.primary_currency ? `<p><strong>Moneda principal:</strong> ${data.primary_currency}</p>` : ''}
          <p><strong>Conectado desde:</strong> ${data.connected_at ? new Date(data.connected_at).toLocaleDateString() : 'Recientemente'}</p>
          
          <!-- Botón para desconectar PayPal -->
          <button id="disconnectPayPalBtn" class="button" style="background:#dc3545; color:white; margin-top:10px;">
            🚫 Desconectar Cuenta PayPal
          </button>
        </div>
      `;

      // Agregar evento al botón de desconexión
      const disconnectBtn = document.getElementById("disconnectPayPalBtn");
      if (disconnectBtn) {
        disconnectBtn.addEventListener("click", disconnectPayPal);
      }

    } catch (err) {
      console.error("Error al cargar datos PayPal:", err);
      paypalData.innerHTML = `
        <div style="color:orange; background:#fff8e6; padding:10px; border-radius:5px;">
          ⚠️ Error cargando información de la cuenta
        </div>
      `;
    }
  }

  // =========================
  // Función para desconectar PayPal
  // =========================
  async function disconnectPayPal() {
    if (!confirm("¿Estás seguro de que quieres desconectar tu cuenta de PayPal?\n\n⚠️ No podrás recibir pagos hasta que reconectes tu cuenta.")) {
      return;
    }

    try {
      paypalStatus.textContent = "Desconectando cuenta PayPal...";
      
      const res = await fetch(`${BACKEND_URL}/api/paypal-disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      const data = await res.json();
      
      if (res.ok && data.ok) {
        paypalStatus.textContent = "✅ Cuenta PayPal desconectada correctamente";
        
        // Resetear interfaz
        connectPayPalBtn.textContent = "Conectar con PayPal";
        connectPayPalBtn.style.background = "#1f9900";
        connectPayPalBtn.disabled = false;
        
        // Limpiar datos mostrados
        paypalData.innerHTML = "";
        
        // Recargar después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        paypalStatus.textContent = "❌ Error al desconectar PayPal: " + (data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error("Error desconectando PayPal:", err);
      paypalStatus.textContent = "❌ Error al desconectar la cuenta PayPal";
    }
  }

  // Verificar si hay código de autorización en la URL (callback de PayPal)
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get('code');
  const sharedId = urlParams.get('shared_id');

  if (authCode && sharedId) {
    processPayPalCallback(authCode, sharedId);
  }

  // =========================
  // Procesar callback de PayPal OAuth
  // =========================
  async function processPayPalCallback(authCode, sharedId) {
    try {
      paypalStatus.textContent = "Procesando autorización de PayPal...";
      
      const res = await fetch(`${BACKEND_URL}/api/paypal/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ authCode, sharedId })
      });

      const data = await res.json();
      
      if (res.ok && data.ok) {
        paypalStatus.textContent = "✅ Cuenta PayPal conectada exitosamente";
        connectPayPalBtn.textContent = "PayPal Conectado ✅";
        connectPayPalBtn.style.background = "#00a86b";
        connectPayPalBtn.disabled = true;
        
        // Limpiar URL pero mantenernos en la misma página
        window.history.replaceState({}, document.title, "/pagos-desarrollador");
        
        // Cargar datos de la cuenta
        setTimeout(() => {
          loadPayPalData();
        }, 1000);
      } else {
        paypalStatus.textContent = "❌ Error conectando con PayPal: " + (data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error("Error procesando callback PayPal:", err);
      paypalStatus.textContent = "❌ Error procesando la autorización de PayPal";
    }
  }
});