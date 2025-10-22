document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const connectPayPalBtn = document.getElementById("connectPayPalButton");
  const connectPayPalForm = document.getElementById("connectPayPalForm");
  const paypalInput = document.getElementById("paypalEmail");
  const paypalStatus = document.getElementById("paypalStatus");

  const BACKEND_URL = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app";

  // =========================
  // Cargar usuario - ACTUALIZADO
  // =========================
  async function loadUser() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.ok) return console.error("No se pudo cargar usuario:", data.error);

      const user = data.user;
      localStorage.setItem("userId", user.user_id); // ✅ CORREGIDO: user.user_id en lugar de user.id

      // PAYPAL STATUS - ACTUALIZADO
      if (user.paypalEmail) {
        paypalInput.value = user.paypalEmail;
        paypalStatus.textContent = "Cuenta PayPal conectada ✅";
        connectPayPalBtn.textContent = "PayPal Conectado ✅";
        connectPayPalBtn.style.background = "#00a86b";
        connectPayPalBtn.disabled = true;
      }
    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  await loadUser();

  // =========================
  // Botón "Conectar con PayPal"
  // =========================
  connectPayPalBtn.addEventListener("click", () => {
    connectPayPalForm.style.display = "block"; // Mostrar formulario
  });

  // =========================
  // Guardar cuenta PayPal
  // =========================
  connectPayPalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const paypalEmail = paypalInput.value.trim();
    const userId = localStorage.getItem("userId");

    if (!userId || !paypalEmail) {
      paypalStatus.textContent = "Falta el ID del usuario o el correo.";
      return;
    }

    paypalStatus.textContent = "Guardando cuenta PayPal...";

    try {
      const res = await fetch(`${BACKEND_URL}/api/connect-paypal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, paypalEmail }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        paypalStatus.textContent = data.message || "Cuenta PayPal guardada ✅";
        connectPayPalBtn.textContent = "PayPal Conectado ✅";
        connectPayPalBtn.style.background = "#00a86b";
        connectPayPalBtn.disabled = true;

        // 🔁 Redirigir después de guardar
        setTimeout(() => {
          window.location.href = "/frontend/pagos-desarrollador.html";
        }, 2000);
      } else {
        paypalStatus.textContent = data.error || "Error al conectar cuenta PayPal ❌";
      }
    } catch (err) {
      console.error("Error guardando PayPal:", err);
      paypalStatus.textContent = "Error al conectar cuenta PayPal ❌";
    }
  });
});