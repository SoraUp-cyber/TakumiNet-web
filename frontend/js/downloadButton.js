// ============================
// CONFIGURACIÓN MERCADO PAGO
// ============================
const MERCADO_PAGO_CONFIG = {
  PUBLIC_KEY: "APP_USR-ddfbdc07-b2fb-4188-8aca-eb40a90ee910",
  ACCESS_TOKEN: "APP_USR-2794725193382250-103011-9a3f5cfa029a24e8debf31adbf03b5a9-2669472141",
  API_BASE: "https://distinct-oralla-takumi-net-0d317399.koyeb.app"
};

// ============================
// BOTÓN DESCARGAR / COMPRAR / DONAR (MERCADO PAGO)
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");
  if (!juegoId) return console.error("❌ No se encontró el ID del juego en la URL");

  // Cargar SDK de Mercado Pago
  function loadMercadoPagoSDK() {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) return resolve();
      
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Error cargando SDK de Mercado Pago'));
      document.head.appendChild(script);
    });
  }

  try {
    await loadMercadoPagoSDK();
    console.log("✅ SDK Mercado Pago cargado");
  } catch (err) {
    console.error("❌ SDK Mercado Pago no cargó:", err);
    return;
  }

  try {
    const res = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/juegos/${juegoId}`);
    const data = await res.json();
    if (!data.ok) return console.error("❌ Error al cargar el juego:", data.error);

    const juego = data.juego;
    const cont = document.getElementById("contenedor-boton-juego");
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
      btn.onclick = () => mostrarAviso(() => {
        window.location.href = `descarga.html?id=${juegoId}`;
      });
      cont.appendChild(btn);
      return;
    }

    // ============================
    // JUEGO DE PAGO (MERCADO PAGO)
    // ============================
    if (juego.pricing === "paid") {
      const price = parseFloat(juego.price) || 1.0;
      
      // ✅ NUEVO: Información del desarrollador
      const infoDesarrollador = juego.username ? `
        <div style="text-align: center; margin-bottom: 10px; color: #fff; background: #2a2a2a; padding: 10px; border-radius: 8px; border: 1px solid #555;">
          <small>💼 Desarrollador: <strong>${juego.username}</strong></small>
        </div>
      ` : '';
      
      const infoDiv = document.createElement("div");
      infoDiv.innerHTML = `
        ${infoDesarrollador}
        <div style="text-align: center; margin-bottom: 15px; color: #fff; background: #1e3a1e; padding: 15px; border-radius: 10px; border: 1px solid #00ff00;">
          <strong style="font-size: 18px; color: #00ff00;">💰 $${price.toFixed(2)} USD</strong><br>
          <small>Pago seguro con Mercado Pago</small>
          <br><small style="color: #ffa500;">💸 Distribución: 70% ${juego.username || 'desarrollador'} + 30% TakumiNet</small>
        </div>
      `;
      cont.appendChild(infoDiv);

      const mpContainer = document.createElement("div");
      mpContainer.id = "mercadopago-button-container";
      cont.appendChild(mpContainer);

      // Inicializar Mercado Pago
      const mp = new MercadoPago(MERCADO_PAGO_CONFIG.PUBLIC_KEY, {
        locale: 'es-CO'
      });

      // Crear preferencia de pago
      const preferenceData = {
        items: [
          {
            title: juego.nombre || "Juego TakumiNet",
            unit_price: parseFloat(price),
            quantity: 1,
            currency_id: "USD"
          }
        ],
        back_urls: {
          success: `${window.location.origin}/descarga.html?id=${juegoId}&status=success`,
          failure: `${window.location.origin}/descarga.html?id=${juegoId}&status=failure`,
          pending: `${window.location.origin}/descarga.html?id=${juegoId}&status=pending`
        },
        auto_return: "approved",
        notification_url: `${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/notifications`
      };

      try {
        // Crear preferencia en el backend
        const preferenceResponse = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/create-preference`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify(preferenceData)
        });

        const preferenceResult = await preferenceResponse.json();
        
        if (preferenceResult.ok && preferenceResult.preferenceId) {
          // Inicializar botón de Mercado Pago
          mp.bricks().create("wallet", "mercadopago-button-container", {
            initialization: {
              preferenceId: preferenceResult.preferenceId,
            },
            customization: {
              texts: {
                action: "pay",
                valueProp: "security_safety"
              }
            }
          });
        } else {
          throw new Error("No se pudo crear la preferencia de pago");
        }
      } catch (error) {
        console.error("❌ Error creando preferencia:", error);
        // Fallback: botón simple que redirige a Mercado Pago
        const fallbackBtn = document.createElement("button");
        fallbackBtn.innerHTML = "💳 Pagar con Mercado Pago";
        fallbackBtn.classList.add("boton-descargar");
        fallbackBtn.style.background = "#009ee3";
        fallbackBtn.onclick = () => {
          alert("🔧 Función en desarrollo - Pronto podrás pagar con Mercado Pago");
        };
        cont.appendChild(fallbackBtn);
      }
      return;
    }

    // ============================
    // DONACIÓN (MERCADO PAGO)
    // ============================
    if (juego.pricing === "donation") {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "10px";

      // ✅ NUEVO: Información del desarrollador para donaciones
      const infoDesarrollador = juego.username ? `
        <div style="text-align: center; color: #fff; background: #2a2a2a; padding: 8px; border-radius: 8px; border: 1px solid #555; width: 100%;">
          <small>💼 Apoyar a: <strong>${juego.username}</strong></small>
        </div>
      ` : '';

      const input = document.createElement("input");
      input.type = "number";
      input.min = "1";
      input.step = "0.01";
      input.placeholder = "Monto a donar (USD)";
      input.value = "5.00";
      input.style.padding = "10px";
      input.style.width = "240px";
      input.style.borderRadius = "8px";
      input.style.border = "1px solid #ccc";
      input.style.textAlign = "center";
      input.style.background = "#1d1d1d";
      input.style.color = "white";

      const btnDonar = document.createElement("button");
      btnDonar.classList.add("boton-descargar");
      btnDonar.innerHTML = `💝 Donar a ${juego.username || 'Desarrollador'}`;
      btnDonar.style.background = "#009ee3";
      btnDonar.style.color = "white";
      btnDonar.style.border = "none";
      btnDonar.style.padding = "12px 20px";
      btnDonar.style.borderRadius = "8px";
      btnDonar.style.cursor = "pointer";
      btnDonar.style.fontWeight = "bold";

      const btnDescargarGratis = document.createElement("button");
      btnDescargarGratis.classList.add("boton-descargar");
      btnDescargarGratis.textContent = "📥 Descargar Gratis";
      btnDescargarGratis.style.background = "#666";
      btnDescargarGratis.style.color = "white";
      btnDescargarGratis.style.border = "none";
      btnDescargarGratis.style.padding = "10px 15px";
      btnDescargarGratis.style.borderRadius = "8px";
      btnDescargarGratis.style.cursor = "pointer";
      btnDescargarGratis.style.marginTop = "5px";

      wrapper.innerHTML = infoDesarrollador;
      wrapper.appendChild(input);
      wrapper.appendChild(btnDonar);
      wrapper.appendChild(btnDescargarGratis);
      cont.appendChild(wrapper);

      btnDonar.onclick = async () => {
        const amount = parseFloat(input.value);
        if (!amount || amount <= 0) {
          alert("❌ Ingresa un monto válido para donar");
          return;
        }

        try {
          const preferenceData = {
            items: [
              {
                title: `Donación para ${juego.username || 'el desarrollador'}`,
                unit_price: parseFloat(amount),
                quantity: 1,
                currency_id: "USD"
              }
            ],
            back_urls: {
              success: `${window.location.origin}/descarga.html?id=${juegoId}&status=success`,
              failure: `${window.location.origin}/descarga.html?id=${juegoId}&status=failure`,
              pending: `${window.location.origin}/descarga.html?id=${juegoId}&status=pending`
            },
            auto_return: "approved"
          };

          const preferenceResponse = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/create-preference`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify(preferenceData)
          });

          const preferenceResult = await preferenceResponse.json();
          
          if (preferenceResult.ok && preferenceResult.preferenceId) {
            // Redirigir al checkout de Mercado Pago
            window.location.href = `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=${preferenceResult.preferenceId}`;
          } else {
            throw new Error("No se pudo crear la preferencia de donación");
          }
        } catch (error) {
          console.error("❌ Error en donación:", error);
          alert("❌ Error al procesar la donación. Intenta nuevamente.");
        }
      };

      btnDescargarGratis.onclick = () => {
        mostrarAviso(() => {
          window.location.href = `descarga.html?id=${juegoId}`;
        });
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