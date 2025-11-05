// ============================
// CONFIGURACIÓN MERCADO PAGO
// ============================
const MERCADO_PAGO_CONFIG = {
  PUBLIC_KEY: "APP_USR-ddfbdc07-b2fb-4188-8aca-eb40a90ee910",
  ACCESS_TOKEN: "APP_USR-2794725193382250-103011-9a3f5cfa029a24e8debf31adbf03b5a9-2669472141",
  API_BASE: "https://distinct-oralla-takumi-net-0d317399.koyeb.app"
};

// ============================
// FUNCIONES BÁSICAS
// ============================
function usuarioLogueado() {
    return localStorage.getItem('token') !== null;
}

// ============================
// FUNCIONES DE UI MEJORADAS
// ============================
function mostrarAlerta(mensaje, tipo = "info", duracion = 0) {
  const alertaAnterior = document.getElementById('alerta-global');
  if (alertaAnterior) {
    alertaAnterior.remove();
  }

  const alerta = document.createElement('div');
  alerta.id = 'alerta-global';
  alerta.innerHTML = mensaje;
  alerta.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;

  if (tipo === "error") {
    alerta.style.background = "#dc3545";
  } else if (tipo === "success") {
    alerta.style.background = "#28a745";
  } else {
    alerta.style.background = "#17a2b8";
  }

  document.body.appendChild(alerta);

  if (duracion > 0) {
    setTimeout(() => {
      if (alerta.parentNode) {
        alerta.parentNode.removeChild(alerta);
      }
    }, duracion);
  }
}

function mostrarLoading(mensaje = "Procesando...") {
  const loading = document.createElement('div');
  loading.id = 'loading-global';
  loading.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
    ">
      <div style="
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 15px;
      "></div>
      <div>${mensaje}</div>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    </style>
  `;
  document.body.appendChild(loading);
}

function ocultarLoading() {
  const loading = document.getElementById('loading-global');
  if (loading) {
    loading.remove();
  }
}

// ============================
// COMPONENTES DE BOTONES MEJORADOS
// ============================
function crearBotonPago(precio, juegoId) {
  const btn = document.createElement("button");
  btn.innerHTML = `
    <img src="https://img.icons8.com/external-tanah-basah-glyph-tanah-basah/48/external-payments-social-media-ui-tanah-basah-glyph-tanah-basah.png" 
         style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
    <div style="font-size: 20px; font-weight: bold;">PAGA DE UNA - $${precio} USD</div>
    <div style="font-size: 12px; font-weight: normal; margin-top: 5px;">
      ⚡ Pago rápido y seguro • 💳 Crédito, Débito y PSE
    </div>
  `;
  btn.style.cssText = `
    width: 100%;
    max-width: 500px;
    padding: 20px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #07ac02, #037e01, #023d01);
    color: white;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    margin: 10px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(7, 172, 2, 0.3);
    border: 2px solid #05d401;
  `;
  
  btn.onmouseover = () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 20px rgba(7, 172, 2, 0.4)';
    btn.style.background = 'linear-gradient(135deg, #05d401, #05a002, #037e01)';
  };
  
  btn.onmouseout = () => {
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 15px rgba(7, 172, 2, 0.3)';
    btn.style.background = 'linear-gradient(135deg, #07ac02, #037e01, #023d01)';
  };
  
  btn.onclick = () => crearModalPagoReal(precio, juegoId, false);
  
  return btn;
}

function crearInputDonacion(juegoId, juego) {
    const container = document.createElement("div");
    container.style.cssText = `
        width: 100%;
        max-width: 500px;
        background: #2a2a2a;
        padding: 20px;
        border-radius: 12px;
        margin: 10px 0;
        border: 2px solid #009ee3;
    `;

    const titulo = document.createElement("div");
    titulo.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px; color: #009ee3; font-size: 18px; font-weight: bold;">
            <img src="https://img.icons8.com/ios-filled/50/donate.png" 
                 style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
            APOYA AL DESARROLLADOR
        </div>
        <div style="text-align: center; font-size: 12px; color: #ccc; margin-bottom: 10px;">
            ⚡ PAGA DE UNA • 💳 Crédito, Débito y PSE
        </div>
    `;
    container.appendChild(titulo);

    const inputGroup = document.createElement("div");
    inputGroup.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        margin-bottom: 15px;
    `;

    const btnMenos = document.createElement("button");
    btnMenos.innerHTML = "➖";
    btnMenos.style.cssText = `
        padding: 15px 20px;
        border-radius: 8px;
        border: 1px solid #ccc;
        background: #333;
        color: white;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
    `;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.placeholder = "Monto (USD)";
    input.value = "1";
    input.style.cssText = `
        padding: 15px;
        width: 150px;
        border-radius: 8px;
        border: 2px solid #009ee3;
        text-align: center;
        background: #1d1d1d;
        color: white;
        font-size: 18px;
        font-weight: bold;
    `;

    const btnMas = document.createElement("button");
    btnMas.innerHTML = "➕";
    btnMas.style.cssText = `
        padding: 15px 20px;
        border-radius: 8px;
        border: 1px solid #ccc;
        background: #333;
        color: white;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
    `;

    btnMenos.onclick = () => {
        let valor = parseInt(input.value) || 1;
        if (valor > 1) input.value = valor - 1;
        actualizarBotonDonacion();
    };

    btnMas.onclick = () => {
        let valor = parseInt(input.value) || 1;
        input.value = valor + 1;
        actualizarBotonDonacion();
    };

    input.oninput = actualizarBotonDonacion;

    inputGroup.appendChild(btnMenos);
    inputGroup.appendChild(input);
    inputGroup.appendChild(btnMas);
    container.appendChild(inputGroup);

    const btnDonacion = document.createElement("button");
    btnDonacion.style.cssText = `
        width: 100%;
        padding: 18px;
        border: none;
        border-radius: 10px;
        background: #009ee3;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 158, 227, 0.3);
        border: 2px solid #00bfff;
    `;

    function actualizarBotonDonacion() {
        const amount = parseFloat(input.value) || 1;
        if (amount > 0) {
            btnDonacion.innerHTML = `
                <img src="https://img.icons8.com/ios-filled/50/donate.png" 
                     style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                <div>
                  <div style="font-size: 16px; font-weight: bold;">PAGA DE UNA - $${amount} USD</div>
                  <div style="font-size: 11px; font-weight: normal;">Donación a ${juego.username}</div>
                </div>
            `;
            btnDonacion.style.background = "#009ee3";
        }
    }

    btnDonacion.onmouseover = () => {
        btnDonacion.style.transform = 'translateY(-2px)';
        btnDonacion.style.boxShadow = '0 6px 20px rgba(0, 158, 227, 0.4)';
        btnDonacion.style.background = '#00bfff';
    };
    
    btnDonacion.onmouseout = () => {
        btnDonacion.style.transform = 'translateY(0)';
        btnDonacion.style.boxShadow = '0 4px 15px rgba(0, 158, 227, 0.3)';
        btnDonacion.style.background = '#009ee3';
    };

    btnDonacion.onclick = () => {
        const amount = parseFloat(input.value) || 1;
        if (amount > 0) {
            crearModalPagoReal(amount, juegoId, true);
        }
    };

    actualizarBotonDonacion();
    container.appendChild(btnDonacion);

    const btnDescarga = document.createElement("button");
    btnDescarga.innerHTML = `
        <img src="https://img.icons8.com/material-rounded/24/download--v1.png" 
             style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
        Descargar Gratis
    `;
    btnDescarga.style.cssText = `
        width: 100%;
        max-width: 500px;
        padding: 15px;
        border: none;
        border-radius: 8px;
        background: #666;
        color: white;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        margin: 5px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;
    
    btnDescarga.onmouseover = () => {
        btnDescarga.style.background = '#777';
        btnDescarga.style.transform = 'translateY(-1px)';
    };
    
    btnDescarga.onmouseout = () => {
        btnDescarga.style.background = '#666';
        btnDescarga.style.transform = 'translateY(0)';
    };
    
    btnDescarga.onclick = () => descargarGratis(juegoId);

    container.appendChild(btnDescarga);

    return container;
}

function crearBotonDescargaGratis(juegoId) {
    const btn = document.createElement("button");
    btn.innerHTML = `
        <img src="https://img.icons8.com/material-rounded/24/download--v1.png" 
             style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
        Descargar Gratis
    `;
    btn.style.cssText = `
        width: 100%;
        max-width: 500px;
        padding: 20px;
        border: none;
        border-radius: 12px;
        background: #4CAF50;
        color: white;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        margin: 10px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    `;
    
    btn.onmouseover = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
    };
    
    btn.onmouseout = () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
    };
    
    btn.onclick = () => mostrarAviso(() => {
        window.location.href = `descarga.html?id=${juegoId}`;
    });
    
    return btn;
}

// ============================
// FUNCIONES DE VERIFICACIÓN
// ============================
async function usuarioTieneMercadoPago() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;

        const response = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.connected === true;
        }
        return false;
    } catch (error) {
        console.error("Error verificando MP usuario:", error);
        return false;
    }
}

async function verificarMercadoPagoDesarrollador(juegoId) {
    try {
        const response = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/juegos/${juegoId}/verificar-mp`);
        if (!response.ok) return false;
        
        const data = await response.json();
        return data.ok && data.tiene_mp;
    } catch (error) {
        console.error("Error verificando MP desarrollador:", error);
        return false;
    }
}

// ============================
// FUNCIONES DE PAGO Y DESCARGA
// ============================
function descargarGratis(juegoId) {
    mostrarAviso(() => {
        window.location.href = `descarga.html?id=${juegoId}`;
    });
}

function mostrarAviso(callback) {
    const modal = document.getElementById('modal-aviso');
    if (modal) {
        modal.style.display = 'flex';
        
        document.getElementById('btnAceptarAviso').onclick = () => {
            modal.style.display = 'none';
            callback();
        };
        
        document.getElementById('btnCancelarAviso').onclick = () => {
            modal.style.display = 'none';
        };
    } else {
        if (confirm("¿Estás seguro de que quieres descargar este juego?")) {
            callback();
        }
    }
}

// ============================
// FUNCIÓN PRINCIPAL DE PAGO - MEJORADA
// ============================
async function crearModalPagoReal(precio, juegoId, esDonacion = false) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      mostrarAlerta("❌ Debes iniciar sesión para realizar el pago", "error");
      return;
    }

    const amount = parseFloat(precio);
    if (isNaN(amount) || amount <= 0) {
      mostrarAlerta("❌ El monto debe ser un número válido mayor a 0", "error");
      return;
    }

    console.log("🔄 Creando pago:", { juegoId, amount, esDonacion });

    mostrarLoading("🔄 Creando tu pago seguro...");

    const response = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/mercadopago/create-marketplace-preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        juego_id: juegoId,
        amount: amount,
        is_donation: esDonacion
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error HTTP:", response.status, errorText);
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    ocultarLoading();

    console.log("📦 Respuesta completa del servidor:", data);

    if (data.ok && data.init_point) {
      console.log("✅ Pago creado exitosamente, redirigiendo...");
      
      mostrarAlerta(
        `✅ <strong>¡PAGA DE UNA!</strong><br>
        ⚡ Redirigiendo a Mercado Pago<br>
        💳 <em>Pago rápido y 100% seguro</em>`, 
        "success", 
        3000
      );
      
      setTimeout(() => {
        console.log("🌐 Redirigiendo a:", data.init_point);
        window.location.href = data.init_point;
      }, 2000);
      
    } else {
      console.error("❌ Error del servidor - Detalles:", data);
      
      let mensajeError = "Error al crear el pago. Intenta nuevamente.";
      
      if (data.error) {
        if (typeof data.error === 'object') {
          mensajeError = data.error.user_message || 
                        data.error.message || 
                        (data.error.cause && data.error.cause[0] && data.error.cause[0].description) ||
                        "Error de configuración en el pago";
        } else if (typeof data.error === 'string') {
          mensajeError = data.error;
        }
      } else if (data.message) {
        mensajeError = data.message;
      }
      
      console.error("❌ Mensaje de error procesado:", mensajeError);
      
      mostrarAlerta(
        `❌ <strong>Error en el pago</strong><br>
        ${mensajeError}<br>
        🔧 <em>Verifica los datos e intenta nuevamente</em>`, 
        "error", 
        6000
      );
    }

  } catch (error) {
    console.error("❌ Error en crearModalPagoReal:", error);
    ocultarLoading();
    
    let mensajeError = "Error de conexión al procesar el pago";
    
    if (error.message.includes("Failed to fetch")) {
      mensajeError = "❌ Error de conexión<br>🔧 Verifica tu internet e intenta nuevamente";
    } else if (error.message.includes("servidor")) {
      mensajeError = "❌ Error del servidor<br>🔧 Intenta nuevamente en unos minutos";
    }
    
    mostrarAlerta(mensajeError, "error", 5000);
  }
}

// ============================
// FUNCIÓN PRINCIPAL
// ============================
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const juegoId = params.get("id");
    
    if (!juegoId) {
        console.error("❌ No se encontró el ID del juego");
        mostrarAlerta("❌ No se encontró el juego solicitado", "error");
        return;
    }

    try {
        const res = await fetch(`${MERCADO_PAGO_CONFIG.API_BASE}/api/juegos/${juegoId}`);
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!data.ok) {
            console.error("❌ Error al cargar el juego:", data.error);
            mostrarAlerta("❌ Error al cargar el juego: " + (data.error || "Desconocido"), "error");
            return;
        }

        const juego = data.juego;
        const cont = document.getElementById("contenedor-boton-juego");
        
        if (!cont) {
            console.error("❌ No se encontró el contenedor");
            return;
        }

        cont.innerHTML = '';
        cont.style.cssText = 'width: 100%; max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; align-items: center;';

        const logueado = usuarioLogueado();
        const usuarioTieneMP = logueado ? await usuarioTieneMercadoPago() : false;
        const desarrolladorTieneMP = await verificarMercadoPagoDesarrollador(juegoId);

        console.log("🔍 Estados de pago:", { 
            logueado, 
            usuarioTieneMP, 
            desarrolladorTieneMP,
            pricing: juego.pricing,
            precio: juego.price
        });

        // JUEGO GRATIS
        if (juego.pricing === "free") {
            cont.appendChild(crearBotonDescargaGratis(juegoId));
            return;
        }

        // JUEGO DE PAGO
        if (juego.pricing === "paid") {
            const price = parseFloat(juego.price) || 1.0;
            
            if (desarrolladorTieneMP && logueado && usuarioTieneMP) {
                cont.appendChild(crearBotonPago(price, juegoId));
            } else if (!logueado) {
                const btnLogin = document.createElement("button");
                btnLogin.innerHTML = `
                    <img src="https://img.icons8.com/ios-filled/50/user-credentials.png" 
                         style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                    <div>
                      <div style="font-size: 16px; font-weight: bold;">INICIA SESIÓN PARA PAGAR DE UNA</div>
                      <div style="font-size: 11px; font-weight: normal;">Accede para comprar por $${price} USD</div>
                    </div>
                `;
                btnLogin.style.cssText = `
                    width: 100%;
                    max-width: 500px;
                    padding: 20px;
                    border: none;
                    border-radius: 12px;
                    background: #ff4444;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #ff6b6b;
                `;
                btnLogin.onclick = () => window.location.href = "login.html";
                cont.appendChild(btnLogin);
            } else if (!usuarioTieneMP) {
                const btnConectarMP = document.createElement("button");
                btnConectarMP.innerHTML = `
                    <img src="https://img.icons8.com/ios-glyphs/30/connected.png" 
                         style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                    <div>
                      <div style="font-size: 16px; font-weight: bold;">CONECTA MP PARA PAGAR DE UNA</div>
                      <div style="font-size: 11px; font-weight: normal;">Vincula Mercado Pago para comprar</div>
                    </div>
                `;
                btnConectarMP.style.cssText = `
                    width: 100%;
                    max-width: 500px;
                    padding: 20px;
                    border: none;
                    border-radius: 12px;
                    background: #ff4444;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid #ff6b6b;
                `;
                btnConectarMP.onclick = () => window.location.href = "pagos-desarrollador.html";
                cont.appendChild(btnConectarMP);
            } else {
                const btnNoDisponible = document.createElement("button");
                btnNoDisponible.innerHTML = "⏳ No disponible para compra";
                btnNoDisponible.style.cssText = `
                    width: 100%;
                    max-width: 500px;
                    padding: 20px;
                    border: none;
                    border-radius: 12px;
                    background: #666;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: not-allowed;
                    margin: 10px 0;
                    opacity: 0.6;
                `;
                btnNoDisponible.disabled = true;
                cont.appendChild(btnNoDisponible);
            }
            return;
        }

        // DONACIÓN
        if (juego.pricing === "donation") {
            if (desarrolladorTieneMP && logueado && usuarioTieneMP) {
                cont.appendChild(crearInputDonacion(juegoId, juego));
            } else if (!logueado) {
                const wrapper = document.createElement("div");
                wrapper.style.cssText = 'width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 10px;';
                
                const btnDescarga = crearBotonDescargaGratis(juegoId);
                const btnLogin = document.createElement("button");
                btnLogin.innerHTML = `
                    <img src="https://img.icons8.com/ios-filled/50/user-credentials.png" 
                         style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                    Inicia Sesión para Donar
                `;
                btnLogin.style.cssText = `
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    background: #ff4444;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                btnLogin.onclick = () => window.location.href = "login.html";
                
                wrapper.appendChild(btnDescarga);
                wrapper.appendChild(btnLogin);
                cont.appendChild(wrapper);
            } else if (!usuarioTieneMP) {
                const wrapper = document.createElement("div");
                wrapper.style.cssText = 'width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 10px;';
                
                const btnDescarga = crearBotonDescargaGratis(juegoId);
                const btnConectarMP = document.createElement("button");
                btnConectarMP.innerHTML = `
                    <img src="https://img.icons8.com/ios-glyphs/30/connected.png" 
                         style="width: 20px; height: 20px; vertical-align: middle; margin-right: 8px;">
                    Conectar MP para Donar
                `;
                btnConectarMP.style.cssText = `
                    width: 100%;
                    padding: 15px;
                    border: none;
                    border-radius: 8px;
                    background: #ff4444;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                btnConectarMP.onclick = () => window.location.href = "pagos-desarrollador.html";
                
                wrapper.appendChild(btnDescarga);
                wrapper.appendChild(btnConectarMP);
                cont.appendChild(wrapper);
            } else {
                cont.appendChild(crearBotonDescargaGratis(juegoId));
            }
            return;
        }

        // JUEGO NO DISPONIBLE
        const btnNoDisponible = document.createElement("button");
        btnNoDisponible.innerHTML = "⏳ No disponible";
        btnNoDisponible.style.cssText = `
            width: 100%;
            max-width: 500px;
            padding: 20px;
            border: none;
            border-radius: 12px;
            background: #666;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: not-allowed;
            margin: 10px 0;
            opacity: 0.6;
        `;
        btnNoDisponible.disabled = true;
        cont.appendChild(btnNoDisponible);

    } catch (err) {
        console.error("❌ Error cargando juego:", err);
        const cont = document.getElementById("contenedor-boton-juego");
        if (cont) {
            const errorBtn = document.createElement("button");
            errorBtn.innerHTML = "❌ Error al cargar el juego";
            errorBtn.style.cssText = `
                width: 100%;
                max-width: 500px;
                padding: 20px;
                border: none;
                border-radius: 12px;
                background: #dc3545;
                color: white;
                font-size: 18px;
                font-weight: bold;
                cursor: not-allowed;
                margin: 10px 0;
            `;
            errorBtn.disabled = true;
            cont.appendChild(errorBtn);
        }
        mostrarAlerta("❌ Error al cargar el juego. Intenta nuevamente.", "error");
    }
});