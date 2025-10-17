// ============================
// CARGAR DATOS DEL USUARIO
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");

  async function loadUser() {
    try {
      const res = await fetch("http://localhost:3001/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.ok) return console.error("❌ No se pudo cargar usuario:", data.error);

      const user = data.user;
      currentUsername.textContent = user.username || "Invitado";

      if (user.avatar) {
        avatarCircle.style.backgroundImage = `url(${user.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarIcon.style.display = "none";
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
    }
  }

  loadUser();
});

// ============================
// BOTÓN DESCARGAR / COMPRAR / DONAR (PAYPAL)
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://localhost:3001";
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");
  if (!juegoId) return console.error("❌ No se encontró el ID del juego en la URL");

  // Esperar a que el SDK de PayPal esté cargado
  async function waitForPayPal(timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        if (window.paypal) return resolve();
        if (Date.now() - start > timeout)
          return reject(new Error("PayPal SDK no cargó"));
        setTimeout(check, 50);
      })();
    });
  }

  try {
    await waitForPayPal();
  } catch (err) {
    console.error("❌ SDK PayPal no cargó:", err);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`);
    const data = await res.json();
    if (!data.ok) return console.error("❌ Error al cargar el juego:", data.error);

    const juego = data.juego;
    const cont = document.getElementById("contenedor-boton-juego");
    if (!cont) return;
    cont.innerHTML = "";

    // ============================
    // JUEGO GRATIS
    // ============================
    if (juego.pricing === "free") {
      const btn = document.createElement("button");
      btn.classList.add("boton-descargar");
      btn.innerHTML = `
        <img width="18" height="18"
             src="https://img.icons8.com/material-two-tone/24/download--v1.png"
             alt="descargar" style="vertical-align:middle; margin-right:6px;">
        Descargar Gratis
      `;
      btn.onclick = () => (window.location.href = `descarga.html?id=${juegoId}`);
      cont.appendChild(btn);
      return;
    }

    // ============================
    // JUEGO DE PAGO (SANDBOX)
    // ============================
    if (juego.pricing === "paid") {
      const divPayPal = document.createElement("div");
      divPayPal.id = "paypal-button-container";
      cont.appendChild(divPayPal);

      paypal
        .Buttons({
          style: {
            color: "gold",
            shape: "pill",
            label: "paypal",
            layout: "vertical",
          },
          createOrder: (data, actions) => {
            const price = parseFloat(juego.price) || 1.0; // Precio de prueba si no hay
            return actions.order.create({
              purchase_units: [
                {
                  description: juego.nombre || "Juego",
                  amount: { currency_code: "USD", value: price.toFixed(2) },
                },
              ],
            });
          },
          onApprove: async (data, actions) => {
            const details = await actions.order.capture();
            alert(`✅ Pago completado por ${details.payer.name.given_name} (Sandbox)`);
            window.location.href = `descarga.html?id=${juegoId}`;
          },
          onError: (err) => {
            console.error("❌ Error en el pago:", err);
            alert("❌ Error al procesar el pago (modo Sandbox).");
          },
        })
        .render("#paypal-button-container");

      return;
    }

    // ============================
    // DONACIÓN OPCIONAL
    // ============================
    if (juego.pricing === "donation") {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "10px";

      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.step = "0.01";
      input.placeholder = "Monto a donar (USD)";
      input.style.padding = "8px";
      input.style.width = "240px";
      input.style.borderRadius = "8px";
      input.style.border = "1px solid #ccc";
      input.style.textAlign = "center";

      const btn = document.createElement("button");
      btn.classList.add("boton-descargar");
      btn.textContent = "Donar o Descargar";

      const divPayPal = document.createElement("div");
      divPayPal.id = "paypal-donation-container";
      divPayPal.style.marginTop = "10px";

      wrapper.appendChild(input);
      wrapper.appendChild(btn);
      wrapper.appendChild(divPayPal);
      cont.appendChild(wrapper);

      btn.onclick = () => {
        const amount = parseFloat(input.value);
        if (!amount || amount <= 0) {
          alert("🎮 Gracias, puedes descargar el juego gratis.");
          window.location.href = `descarga.html?id=${juegoId}`;
          return;
        }

        divPayPal.innerHTML = "";

        paypal
          .Buttons({
            style: {
              color: "blue",
              shape: "rect",
              label: "donate",
              layout: "vertical",
            },
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    description: `Donación para ${juego.nombre || "Juego"}`,
                    amount: { currency_code: "USD", value: amount.toFixed(2) },
                  },
                ],
              });
            },
            onApprove: async (data, actions) => {
              const details = await actions.order.capture();
              alert(`🙏 Gracias ${details.payer.name.given_name} por donar $${amount.toFixed(2)} ❤️`);
              window.location.href = `descarga.html?id=${juegoId}`;
            },
            onError: (err) => {
              console.error("❌ Error en la donación:", err);
              alert("❌ Error al procesar la donación (modo Sandbox).");
            },
          })
          .render("#paypal-donation-container");
      };

      return;
    }

    // ============================
    // JUEGO NO DISPONIBLE
    // ============================
    const btn = document.createElement("button");
    btn.textContent = "No disponible";
    btn.disabled = true;
    cont.appendChild(btn);
  } catch (err) {
    console.error("❌ Error cargando juego:", err);
  }
});
