// JavaScript para el formulario de recuperar contraseña
document.addEventListener("DOMContentLoaded", () => {
    const recuperarForm = document.getElementById("recuperar-form");
    const recuperarEmail = document.getElementById("recuperar-email");
    const recuperarMessage = document.getElementById("recuperar-message");
    const recuperarBtn = recuperarForm.querySelector("button");

    recuperarForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = recuperarEmail.value.trim();
        
        if (!email) {
            mostrarMensaje("Por favor ingresa tu correo electrónico", "error");
            return;
        }

        if (!validarEmail(email)) {
            mostrarMensaje("Por favor ingresa un correo electrónico válido", "error");
            return;
        }

        // Deshabilitar botón para evitar múltiples envíos
        recuperarBtn.disabled = true;
        recuperarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const response = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/user/enviar-codigo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.ok) {
                mostrarMensaje("✅ Código enviado correctamente a tu correo", "success");
                // Opcional: Redirigir a página de verificación de código
                setTimeout(() => {
                    window.location.href = `verificar-codigo.html?email=${encodeURIComponent(email)}`;
                }, 2000);
            } else {
                mostrarMensaje("❌ " + (data.error || "Error al enviar el código"), "error");
            }
        } catch (error) {
            console.error("Error:", error);
            mostrarMensaje("❌ Error de conexión. Intenta nuevamente.", "error");
        } finally {
            // Rehabilitar botón
            recuperarBtn.disabled = false;
            recuperarBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
        }
    });

    function mostrarMensaje(mensaje, tipo) {
        recuperarMessage.textContent = mensaje;
        recuperarMessage.className = "recuperar-message";
        
        if (tipo === "success") {
            recuperarMessage.classList.add("success");
        } else if (tipo === "error") {
            recuperarMessage.classList.add("error");
        }
        
        recuperarMessage.style.display = "block";
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            recuperarMessage.style.display = "none";
        }, 5000);
    }

    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
});