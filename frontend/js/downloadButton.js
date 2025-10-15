// ============================
// BOTÓN DESCARGAR / COMPRAR / DONAR (PRO)
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://localhost:3001"; // Cambia si usas hosting o dominio
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");

  if (!juegoId) return console.error("❌ No se encontró el ID del juego en la URL");

  try {
    const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`);
    const data = await res.json();
    if (!data.ok || !data.juego) throw new Error(data.error || "Juego no encontrado");

    const juego = data.juego;
    const cont = document.getElementById("contenedor-boton-juego");
    if (!cont) return;

    cont.innerHTML = "";

    // ============================
    // 🎁 CASO 1️⃣: JUEGO GRATIS
    // ============================
    if (juego.pricing === "free") {
      const btn = crearBoton("Descargar Gratis", "descargar", () => {
        window.location.href = `descarga.html?id=${juegoId}`;
      });
      cont.appendChild(btn);
      return;
    }

    // ============================
    // 💰 CASO 2️⃣: JUEGO DE PAGO
    // ============================
    if (juego.pricing === "paid") {
      crearBotonPayPal(cont, juego, juego.price || "1.00", "Comprar Ahora 💸");
      return;
    }

// ============================
// ❤️ CASO 3️⃣: DONACIÓN OPCIONAL
// ============================
if (juego.pricing === "donation") {
  // 🧾 Campo para ingresar el monto de donación
  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.placeholder = "Monto (USD)";
  input.classList.add("input-donacion");
  cont.appendChild(input);

  // 💖 Botón principal (donar o descargar)
  const btnDonar = crearBoton("💖 Donar / Descargar", "donar", () => {
    const monto = parseFloat(input.value) || 0;

    // 🎁 Si no dona nada → descarga directa
    if (monto <= 0) {
      window.location.href = `descarga.html?id=${juegoId}`;
      return;
    }

    // 💰 Si ingresa monto → inicia flujo PayPal
    iniciarDonacionPayPal(cont, juego, monto);
  });

  // Añadir botón al contenedor
  cont.appendChild(btnDonar);

  return;
}


    // ============================
    // ❌ OTRO CASO
    // ============================
    const btn = crearBoton("No disponible", "deshabilitado");
    btn.disabled = true;
    cont.appendChild(btn);
  } catch (err) {
    console.error("❌ Error cargando juego:", err);
  }

  // ============================
  // 🔧 FUNCIONES AUXILIARES
  // ============================

  function crearBoton(texto, tipo, accion) {
    const btn = document.createElement("button");
    btn.className = `boton-juego ${tipo}`;
    btn.textContent = texto;
    if (accion) btn.onclick = accion;
    return btn;
  }

  function crearBotonPayPal(contenedor, juego, monto, texto) {
    const paypalDiv = document.createElement("div");
    paypalDiv.id = "paypal-button-container";
    contenedor.appendChild(paypalDiv);

    // Cargar SDK si no existe
    if (!document.getElementById("paypal-sdk")) {
      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = "https://www.paypal.com/sdk/js?client-id=AaVT5Wtj5NoNpg6BVlcDSyE0vPXJ7Cs5A1ZQkOPY7pQYXvTLbp6Uf5HTsn4J0_Ulz0CbBEwvGRk5eMea&currency=USD&intent=capture";
      script.onload = () => renderPayPal(juego, monto);
      document.body.appendChild(script);
    } else {
      renderPayPal(juego, monto);
    }

    function renderPayPal(juego, monto) {
      paypal.Buttons({
        style: { color: "gold", shape: "pill", label: "checkout", height: 45 },
        createOrder: (data, actions) => actions.order.create({
          purchase_units: [{
            description: juego.title,
            amount: { currency_code: "USD", value: monto }
          }]
        }),
        onApprove: (data, actions) => actions.order.capture().then(details => {
          alert(`✅ Gracias ${details.payer.name.given_name}, tu compra fue exitosa.`);
          console.log("🧾 Compra:", details);
        }),
        onError: err => {
          console.error("❌ Error en PayPal:", err);
          alert("Error en PayPal. Intenta nuevamente.");
        }
      }).render("#paypal-button-container");
    }
  }

  function iniciarDonacionPayPal(contenedor, juego, monto) {
    const div = document.createElement("div");
    div.id = "paypal-donation-container";
    contenedor.appendChild(div);

    if (!document.getElementById("paypal-sdk")) {
      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = "https://www.paypal.com/sdk/js?client-id=AaVT5Wtj5NoNpg6BVlcDSyE0vPXJ7Cs5A1ZQkOPY7pQYXvTLbp6Uf5HTsn4J0_Ulz0CbBEwvGRk5eMea&currency=USD&intent=capture";
      script.onload = () => renderDonacion(juego, monto);
      document.body.appendChild(script);
    } else {
      renderDonacion(juego, monto);
    }

    function renderDonacion(juego, monto) {
      paypal.Buttons({
        style: { color: "blue", shape: "pill", label: "donate", height: 45 },
        createOrder: (data, actions) => actions.order.create({
          purchase_units: [{
            description: `Donación para ${juego.title}`,
            amount: { currency_code: "USD", value: monto.toFixed(2) }
          }]
        }),
        onApprove: (data, actions) => actions.order.capture().then(details => {
          alert(`🙏 Gracias ${details.payer.name.given_name} por donar ${monto.toFixed(2)} USD ❤️`);
          window.location.href = `descarga.html?id=${juego.id}`;
        }),
        onError: err => {
          console.error("❌ Error en PayPal:", err);
          alert("Hubo un problema con PayPal.");
        }
      }).render("#paypal-donation-container");
    }
  }
});
