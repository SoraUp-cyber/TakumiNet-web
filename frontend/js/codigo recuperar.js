document.addEventListener("DOMContentLoaded", () => {
    const verificarForm = document.getElementById("verificar-form");
    const codigoInput = document.getElementById("codigo-input");
    const timerElement = document.getElementById("timer");
    const reenviarBtn = document.getElementById("reenviar-btn");

    let tiempoRestante = 10;
    let timerInterval;
    let codigoGenerado = "";

    // Generar código de 6 dígitos
    function generarCodigo() {
        codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("🔐 Código generado:", codigoGenerado);
        
        // Mostrar código al usuario
        mostrarCodigoAlUsuario(codigoGenerado);
    }

    // Mostrar código al usuario con overlay
    function mostrarCodigoAlUsuario(codigo) {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'codigo-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; background: rgba(56, 56, 56, 0.95); padding: 40px; border-radius: 15px; border: 2px solid #00ff2a; max-width: 500px; margin: 20px;">
                <h2 style="color: #00ff2a; margin-bottom: 20px;">
                    <i class="fas fa-shield-alt"></i> Tu Código de Verificación
                </h2>
                <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #000000ff; margin: 20px 0; background: rgba(0, 255, 42, 0.1); padding: 20px; border-radius: 10px;">
                    ${codigo}
                </div>
                <p style="color: #00ff2a; font-size: 18px; margin-bottom: 10px;">
                    ⏰ Tienes <strong id="overlay-timer">10</strong> segundos para memorizarlo
                </p>
                <p style="color: #000000ff; font-size: 14px;">El código desaparecerá automáticamente</p>
            </div>
        `;

        document.body.appendChild(overlay);

        // Temporizador del overlay
        let overlayTiempo = 10;
        const overlayTimer = overlay.querySelector('#overlay-timer');
        
        const overlayInterval = setInterval(() => {
            overlayTiempo--;
            overlayTimer.textContent = overlayTiempo;
            
            if (overlayTiempo <= 0) {
                clearInterval(overlayInterval);
                overlay.remove();
                iniciarTemporizadorPrincipal();
            }
        }, 1000);
    }

    // Iniciar temporizador principal después de que desaparece el overlay
    function iniciarTemporizadorPrincipal() {
        tiempoRestante = 10;
        timerElement.textContent = tiempoRestante;
        
        reenviarBtn.disabled = true;
        reenviarBtn.innerHTML = '<i class="fas fa-redo"></i> Reenviar código';
        
        timerInterval = setInterval(() => {
            tiempoRestante--;
            timerElement.textContent = tiempoRestante;
            
            if (tiempoRestante <= 0) {
                clearInterval(timerInterval);
                reenviarBtn.disabled = false;
                mostrarMensaje("⏰ Tiempo agotado. Puedes solicitar un nuevo código.", "warning");
            }
        }, 1000);
    }

    // Verificar código ingresado
    if (verificarForm) {
        verificarForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const codigoIngresado = codigoInput.value.trim();
            
            if (!codigoIngresado || codigoIngresado.length !== 6) {
                mostrarMensaje("❌ Por favor ingresa un código de 6 dígitos", "error");
                return;
            }

            // Verificar si el código es correcto
            if (codigoIngresado === codigoGenerado) {
                mostrarMensaje("✅ Código correcto! Redirigiendo...", "success");
                
                // Redirigir a nueva contraseña después de 2 segundos
                setTimeout(() => {
                    window.location.href = "https://takuminet-app.netlify.app/nueva-contraseña.html";
                }, 2000);
                
            } else {
                mostrarMensaje("❌ Código incorrecto. Intenta nuevamente.", "error");
                codigoInput.value = "";
                codigoInput.focus();
            }
        });
    }

    // Reenviar código (generar nuevo código)
    if (reenviarBtn) {
        reenviarBtn.addEventListener("click", () => {
            clearInterval(timerInterval);
            generarCodigo();
        });
    }

    // Mostrar mensajes
    function mostrarMensaje(message, type) {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 255, 42, 0.9)' : 
                         type === 'error' ? 'rgba(255, 68, 68, 0.9)' : 
                         'rgba(255, 152, 0, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1001;
            backdrop-filter: blur(5px);
            border: 1px solid ${type === 'success' ? '#00ff2a' : 
                             type === 'error' ? '#ff4444' : 
                             '#ff9800'};
            max-width: 300px;
        `;
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          'fa-exclamation-triangle'}"></i> ${message}
        `;

        document.body.appendChild(messageDiv);

        // Auto-eliminar después de 4 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }

    // Validación en tiempo real del input (solo números)
    if (codigoInput) {
        codigoInput.addEventListener('input', function(e) {
            // Solo permitir números
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // Limitar a 6 dígitos
            if (this.value.length > 6) {
                this.value = this.value.slice(0, 6);
            }
        });
    }

    // Inicializar - Generar código automáticamente al cargar la página
    generarCodigo();
});