document.addEventListener("DOMContentLoaded", () => {
    const recuperarForm = document.getElementById("recuperar-form");
    const emailInput = document.getElementById("recuperar-email");
    const messageDiv = document.getElementById("recuperar-message");

    if (recuperarForm) {
        recuperarForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            
            if (!email) {
                showMessage("Por favor ingresa tu correo electrónico", "error");
                return;
            }

            try {
                // Mostrar loading
                const submitBtn = recuperarForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
                submitBtn.disabled = true;

                // ✅ SOLO VERIFICAR CON GET SI EL EMAIL EXISTE
                const verifyResponse = await fetch(`https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/verificar-email?email=${encodeURIComponent(email)}`, {
                    method: 'GET' // ✅ SOLO VERIFICAR, NO ENVIAR CÓDIGO
                });

                const verifyData = await verifyResponse.json();
                console.log("Respuesta verificación:", verifyData);

                if (verifyData.ok && verifyData.existe) {
                    showMessage("✅ Correo verificado. Redirigiendo...", "success");
                    
                    // ✅ GUARDAR EMAIL Y REDIRIGIR DIRECTAMENTE
                    localStorage.setItem('emailRecuperacion', email);
                    
                    // Redirigir a la página de código
                    setTimeout(() => {
                        window.location.href = "https://takuminet-app.netlify.app/codigo_recuperar.html";
                    }, 1500);
                    
                } else {
                    showMessage("❌ Este correo no está registrado en nuestra base de datos", "error");
                }

            } catch (error) {
                console.error('Error:', error);
                showMessage("❌ Error de conexión. Intenta nuevamente.", "error");
            } finally {
                // Restaurar botón
                const submitBtn = recuperarForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Código';
                submitBtn.disabled = false;
            }
        });
    }

    function showMessage(message, type) {
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = 'recuperar-message';
            
            if (type === 'success') {
                messageDiv.style.color = '#00ff2a';
            } else if (type === 'error') {
                messageDiv.style.color = '#ff4444';
            }
            
            setTimeout(() => {
                messageDiv.textContent = '';
            }, 5000);
        } else {
            alert(message);
        }
    }
});