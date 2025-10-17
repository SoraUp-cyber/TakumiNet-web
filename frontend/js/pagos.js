document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const connectPayPalBtn = document.getElementById("connectPayPal");

  // =========================
  // Cargar usuario y estado PayPal
  // =========================
  async function loadUser() {
    try {
      const res = await fetch("http://localhost:3001/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.ok) return console.error("No se pudo cargar usuario:", data.error);

      const user = data.user;

      localStorage.setItem("userId", user.id);
      if (user.paypalConnected) {
        localStorage.setItem("paypalConnected", "true");
      } else {
        localStorage.setItem("paypalConnected", "false");
      }

      if (localStorage.getItem("paypalConnected") === "true") {
        connectPayPalBtn.textContent = "PayPal Conectado ✅";
        connectPayPalBtn.classList.add("connected");
        connectPayPalBtn.href = "#";
        connectPayPalBtn.disabled = true;
      }

    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  await loadUser();

  // =========================
  // Botón: Conectar PayPal
  // =========================
  connectPayPalBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const clientId = "AW2Kw82wf0gEkP-5iMLlZUachT2-l5M9l-chRt13lPkRSzAEZL1edMRSD64O-X9rZIKCS3BM-HUQwA3_"; 
    const redirectUri = encodeURIComponent("https://takuminet-app.netlify.app/pagos-desarrollador");
    const scope = encodeURIComponent("openid");
    const userId = localStorage.getItem("userId");

    const paypalAuthUrl = `https://www.sandbox.paypal.com/connect?flowEntry=static&client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=${userId}`;

    window.location.href = paypalAuthUrl;
  });

  // =========================
  // Detectar retorno de PayPal
  // =========================
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state"); // userId pasado desde PayPal

  if (code && state) {
    localStorage.setItem("paypalConnected", "true");
    localStorage.setItem("paypalCode", code);
    localStorage.setItem("paypalUserId", state);

    connectPayPalBtn.textContent = "PayPal Conectado ✅";
    connectPayPalBtn.classList.add("connected");
    connectPayPalBtn.href = "#";
    connectPayPalBtn.disabled = true;

    // ✅ Enviar al backend para guardar en DB
    fetch("http://localhost:3001/api/paypal/conectar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code }) // backend obtiene userId del token
    })
    .then(res => res.json())
    .then(data => {
      if (!data.ok) console.error("Error guardando PayPal:", data.error);
      else console.log("PayPal conectado en backend ✅");
    })
    .catch(err => console.error("Error en fetch:", err));
  }
});
