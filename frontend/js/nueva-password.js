document.addEventListener("DOMContentLoaded", () => {
    const nuevaPasswordForm = document.getElementById("nueva-password-form");
    const viejaPasswordInput = document.getElementById("vieja-password");
    const nuevaPasswordInput = document.getElementById("nueva-password");
    const confirmarPasswordInput = document.getElementById("confirmar-password");
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    // Obtener token del usuario logueado
    const token = localStorage.getItem('token');

    if (!token) {
        alert("❌ No estás autenticado. Redirigiendo al login...");
        setTimeout(() => {
            window.location.href = "https://distinct-oralla-takumi-net-0d317399.koyeb.app/login.html";
        }, 2000);
        return;
    }

    // Función para mostrar/ocultar contraseña
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Cambiar contraseña
    if (nuevaPasswordForm) {
        nuevaPasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const contraseñaActual = viejaPasswordInput.value.trim();
            const nuevaContraseña = nuevaPasswordInput.value.trim();
            const confirmarContraseña = confirmarPasswordInput.value.trim();

            // Validaciones
            if (!contraseñaActual || !nuevaContraseña || !confirmarContraseña) {
                mostrarMensaje("❌ Todos los campos son obligatorios", "error");
                return;
            }

            if (nuevaContraseña.length < 6) {
                mostrarMensaje("❌ La nueva contraseña debe tener al menos 6 caracteres", "error");
                return;
            }

            if (nuevaContraseña !== confirmarContraseña) {
                mostrarMensaje("❌ Las contraseñas nuevas no coinciden", "error");
                return;
            }

            try {
                // Mostrar loading
                const submitBtn = nuevaPasswordForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando contraseña...';
                submitBtn.disabled = true;

                // ✅ USAR TU ENDPOINT EXISTENTE
                const response = await fetch('https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user/editar', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        currentPassword: contraseñaActual,
                        newPassword: nuevaContraseña
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    mostrarMensaje("✅ Contraseña cambiada correctamente", "success");
                    
                    // Limpiar formulario
                    nuevaPasswordForm.reset();
                    
                    // Redirigir a index.html después de 2 segundos
                    setTimeout(() => {
                        window.location.href = "https://takuminet-app.netlify.app/index.html";
                    }, 2000);
                    
                } else {
                    mostrarMensaje("❌ " + (data.error || "Error al cambiar contraseña"), "error");
                }

            } catch (error) {
                console.error('Error:', error);
                mostrarMensaje("❌ Error de conexión. Intenta nuevamente.", "error");
            } finally {
                // Restaurar botón
                const submitBtn = nuevaPasswordForm.querySelector('button[type="submit"]');
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Nueva Contraseña';
                submitBtn.disabled = false;
            }
        });
    }

    // Función para mostrar mensajes
    function mostrarMensaje(message, type) {
        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(0, 255, 42, 0.9)' : 'rgba(255, 68, 68, 0.9)'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1001;
            backdrop-filter: blur(5px);
            border: 1px solid ${type === 'success' ? '#00ff2a' : '#ff4444'};
            max-width: 300px;
        `;
        messageDiv.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}
        `;

        document.body.appendChild(messageDiv);

        // Auto-eliminar después de 4 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }
});