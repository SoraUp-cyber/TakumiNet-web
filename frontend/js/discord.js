document.addEventListener("DOMContentLoaded", () => {
    const discordBtn = document.getElementById("discordBtn");
    
    if (discordBtn) {
        discordBtn.addEventListener("click", () => {
            // Crear mensaje flotante
            const message = document.createElement('div');
            message.textContent = '🚧 Todavía no disponible - Próximamente';
            message.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff9800;
                color: white;
                padding: 15px;
                border-radius: 5px;
                z-index: 1000;
                font-weight: bold;
            `;
            document.body.appendChild(message);
            
            // Quitar mensaje después de 3 segundos
            setTimeout(() => {
                message.remove();
            }, 3000);
        });
    }
});