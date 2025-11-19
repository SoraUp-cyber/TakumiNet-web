document.addEventListener("DOMContentLoaded", () => {
  // Crear banner de bienvenida
  const banner = document.createElement("div");
  banner.id = "welcome-banner";
  banner.innerHTML = `
    <div class="welcome-content">
      <h1>🎮 Bienvenido a <span>TakumiNet</span></h1>
      <p>Explora, comparte y disfruta de juegos indie únicos.</p>
    </div>
  `;

  // Estilos (gris suave, leve blur, texto blanco y verde)
  const style = document.createElement("style");
  style.textContent = `
    #welcome-banner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(43, 43, 43, 0.4); /* gris más claro y transparente */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.4s ease;
      backdrop-filter: blur(2px); /* desenfoque ligero */
    }

    .welcome-content {
      background: rgba(43, 43, 43, 0.9);
      color: #ffffff;
      text-align: center;
      padding: 35px 50px;
      border-radius: 16px;
      border: 1px solid #00c853;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: 'Inter', sans-serif;
      max-width: 480px;
      animation: scaleIn 0.3s ease;
    }

    .welcome-content h1 {
      font-size: 1.8rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .welcome-content h1 span {
      color: #00c853; /* verde TakumiNet */
    }

    .welcome-content p {
      font-size: 1rem;
      margin-bottom: 0;
      color: #f1f1f1;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Cierre automático con salida suave
  setTimeout(() => {
    banner.style.animation = "fadeOut 0.6s ease";
    setTimeout(() => banner.remove(), 600);
  }, 5000);
});
