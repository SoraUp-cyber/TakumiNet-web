alert("✅ Perfil actualizado correctamente"); 

// Función para mostrar notificación con animación
function mostrarNotificacion(mensaje, tipo = 'exito') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion-perfil notificacion-${tipo}`;
  notificacion.innerHTML = `
    <div class="notificacion-contenido">
      <span class="notificacion-icono">${tipo === 'exito' ? '✅' : '❌'}</span>
      <span class="notificacion-texto">${mensaje}</span>
    </div>
  `;

  // Estilos para la notificación
  const estilos = `
    .notificacion-perfil {
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${tipo === 'exito' ? '#d4edda' : '#f8d7da'};
      color: ${tipo === 'exito' ? '#155724' : '#721c24'};
      padding: 16px 20px;
      border-radius: 12px;
      border: 2px solid ${tipo === 'exito' ? '#c3e6cb' : '#f5c6cb'};
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 350px;
      transform: translateX(400px) scale(0.8);
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .notificacion-perfil.mostrar {
      transform: translateX(0) scale(1);
      opacity: 1;
    }

    .notificacion-perfil.ocultar {
      transform: translateX(400px) scale(0.8);
      opacity: 0;
    }

    .notificacion-contenido {
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
      font-size: 14px;
    }

    .notificacion-icono {
      font-size: 18px;
      animation: bounce 0.6s ease-in-out;
    }

    @keyframes bounce {
      0%, 20%, 60%, 100% {
        transform: scale(1);
      }
      40% {
        transform: scale(1.3);
      }
      80% {
        transform: scale(1.1);
      }
    }

    .notificacion-progreso {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: ${tipo === 'exito' ? '#28a745' : '#dc3545'};
      width: 100%;
      transform-origin: left;
      animation: progreso 3s linear forwards;
    }

    @keyframes progreso {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }
  `;

  // Agregar estilos si no existen
  if (!document.querySelector('#estilos-notificacion')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'estilos-notificacion';
    styleSheet.textContent = estilos;
    document.head.appendChild(styleSheet);
  }

  // Agregar barra de progreso
  const barraProgreso = document.createElement('div');
  barraProgreso.className = 'notificacion-progreso';
  notificacion.appendChild(barraProgreso);

  // Agregar al DOM
  document.body.appendChild(notificacion);

  // Animación de entrada
  setTimeout(() => {
    notificacion.classList.add('mostrar');
  }, 100);

  // Auto-eliminar después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove('mostrar');
    notificacion.classList.add('ocultar');
    
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.parentNode.removeChild(notificacion);
      }
    }, 500);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    mostrarNotificacion("No estás logueado.", "error");
    return;
  }

  // =========================
  // ELEMENTOS DEL DOM
  // =========================
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const avatarInput = document.getElementById("upload-photo");
  const usernameInput = document.getElementById("nombre-real");
  const bioInput = document.getElementById("biografia");
  const correoInput = document.getElementById("correo");
  const url1Input = document.getElementById("url1");
  const url2Input = document.getElementById("url2");
  const url3Input = document.getElementById("url3");
  const url4Input = document.getElementById("url4");
  const currentPassInput = document.getElementById("contrasena-actual");
  const newPassInput = document.getElementById("nueva-contrasena");
  const confirmPassInput = document.getElementById("confirmar-contrasena");
  const guardarBtn = document.getElementById("guardar-perfil-btn");
  const cancelarBtn = document.getElementById("cancelar-edicion-btn");
  const menuUsername = document.getElementById("current-username");

  // =========================
  // FUNCIONES AUXILIARES
  // =========================

  // Cargar datos del usuario
  async function cargarUsuario() {
    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.ok) {
        mostrarNotificacion("Error cargando usuario: " + data.error, "error");
        return;
      }

      const u = data.user;

      // Llenar formulario con datos del usuario
      usernameInput.value = u.username || "";
      bioInput.value = u.descripcion || "";
      correoInput.value = u.contacto_email || u.email || "";
      url1Input.value = u.twitter || "";
      url2Input.value = u.instagram || "";
      url3Input.value = u.youtube || "";
      url4Input.value = u.discord || "";

      // Configurar avatar
      if (u.avatar) {
        avatarCircle.style.backgroundImage = `url(${u.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarCircle.style.backgroundPosition = "center";
        avatarIcon.style.display = "none";
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }

      menuUsername.textContent = u.username || "Invitado";
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
      mostrarNotificacion("No se pudo cargar el usuario", "error");
    }
  }

  // Subir avatar a backend (FUNCIONA POR SEPARADO)
  async function subirAvatar(file) {
    if (!file || !file.type.startsWith("image/")) {
      mostrarNotificacion("Por favor selecciona una imagen válida", "error");
      return;
    }

    // Validar formato de imagen
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      mostrarNotificacion("Formato de imagen no soportado. Usa JPEG, PNG, GIF o WebP.", "error");
      return;
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      mostrarNotificacion("La imagen es muy grande. Máximo 5MB permitido.", "error");
      return;
    }

    // Mostrar loading en el avatar
    const originalBackground = avatarCircle.style.backgroundImage;
    avatarCircle.style.backgroundImage = "linear-gradient(45deg, #f0f0f0, #e0e0e0)";
    avatarCircle.style.animation = "pulse 1.5s infinite";

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarBase64 = reader.result;
      
      try {
        const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user/avatar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ avatarBase64 })
        });
        
        const data = await res.json();
        if (!data.ok) {
          mostrarNotificacion("No se pudo actualizar el avatar: " + data.error, "error");
          // Restaurar fondo original
          avatarCircle.style.backgroundImage = originalBackground;
          avatarCircle.style.animation = "none";
          return;
        }

        // Actualizar visualización del avatar con animación
        avatarCircle.style.animation = "none";
        avatarCircle.style.backgroundImage = `url(${data.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarCircle.style.backgroundPosition = "center";
        avatarIcon.style.display = "none";
        
        // Efecto de confirmación
        avatarCircle.style.transform = "scale(1.1)";
        setTimeout(() => {
          avatarCircle.style.transform = "scale(1)";
        }, 300);
        
        mostrarNotificacion("Avatar actualizado correctamente 🎉");
      } catch (err) {
        console.error("❌ Error subiendo avatar:", err);
        mostrarNotificacion("Error subiendo avatar", "error");
        // Restaurar fondo original
        avatarCircle.style.backgroundImage = originalBackground;
        avatarCircle.style.animation = "none";
      }
    };
    
    reader.onerror = () => {
      mostrarNotificacion("Error leyendo el archivo de imagen", "error");
      avatarCircle.style.backgroundImage = originalBackground;
      avatarCircle.style.animation = "none";
    };
    
    reader.readAsDataURL(file);
  }

  // Guardar cambios de perfil (SOLO DATOS, SIN AVATAR)
  async function guardarPerfil() {
    // Validar contraseñas
    if (newPassInput.value && newPassInput.value !== confirmPassInput.value) {
      mostrarNotificacion("Las contraseñas no coinciden", "error");
      // Animación de shake en los campos de contraseña
      [newPassInput, confirmPassInput].forEach(input => {
        input.style.animation = "shake 0.5s ease-in-out";
        setTimeout(() => {
          input.style.animation = "none";
        }, 500);
      });
      return;
    }

    // Validar que se ingrese contraseña actual si se quiere cambiar
    if (newPassInput.value && !currentPassInput.value) {
      mostrarNotificacion("Debes ingresar tu contraseña actual para cambiarla", "error");
      currentPassInput.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        currentPassInput.style.animation = "none";
      }, 500);
      return;
    }

    const body = {
      username: usernameInput.value.trim() || null,
      descripcion: bioInput.value.trim() || null,
      contacto_email: correoInput.value.trim() || null,
      twitter: url1Input.value.trim() || null,
      instagram: url2Input.value.trim() || null,
      youtube: url3Input.value.trim() || null,
      discord: url4Input.value.trim() || null,
      currentPassword: currentPassInput.value || null,
      newPassword: newPassInput.value || null
    };

    // Mostrar loading en el botón con animación
    guardarBtn.disabled = true;
    const originalText = guardarBtn.textContent;
    guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
      const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user/editar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.ok) {
        mostrarNotificacion("No se pudo actualizar el perfil: " + data.error, "error");
        return;
      }

      // Mostrar notificación de éxito con animación
      mostrarNotificacion("Perfil actualizado correctamente 🎉");
      
      // Animación de éxito en el botón
      guardarBtn.innerHTML = '<i class="fas fa-check"></i> ¡Guardado!';
      guardarBtn.style.background = "#28a745";
      
      setTimeout(() => {
        guardarBtn.innerHTML = originalText;
        guardarBtn.style.background = "";
      }, 2000);
      
      // Actualizar nombre de usuario en la interfaz
      menuUsername.textContent = usernameInput.value;
      
      // Limpiar campos de contraseña con animación
      [currentPassInput, newPassInput, confirmPassInput].forEach(input => {
        input.style.opacity = "0.5";
        setTimeout(() => {
          input.value = "";
          input.style.opacity = "1";
        }, 300);
      });

    } catch (err) {
      console.error("❌ Error actualizando perfil:", err);
      mostrarNotificacion("No se pudo actualizar el perfil: " + err.message, "error");
    } finally {
      // Restaurar botón después de 2 segundos si hubo error
      setTimeout(() => {
        guardarBtn.disabled = false;
        guardarBtn.textContent = originalText;
      }, 2000);
    }
  }

  // Función para cancelar edición
  function cancelarEdicion() {
    // Animación de salida en el formulario
    const form = document.querySelector('.perfil-form');
    form.style.transform = "translateX(-20px)";
    form.style.opacity = "0.7";
    
    setTimeout(() => {
      if (confirm("¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.")) {
        // Recargar datos originales
        cargarUsuario();
        
        // Limpiar campos de contraseña
        currentPassInput.value = "";
        newPassInput.value = "";
        confirmPassInput.value = "";
        
        // Restaurar animación
        form.style.transform = "translateX(0)";
        form.style.opacity = "1";
      } else {
        // Restaurar sin cambios
        form.style.transform = "translateX(0)";
        form.style.opacity = "1";
      }
    }, 300);
  }

  // Función para toggle de visibilidad de contraseña
  function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
      button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = this;
        
        // Animación del icono
        icon.style.transform = "scale(1.3)";
        setTimeout(() => {
          icon.style.transform = "scale(1)";
        }, 200);
        
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          passwordInput.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });
  }

  // =========================
  // EVENTOS
  // =========================
  avatarCircle.addEventListener("click", () => {
    // Animación de click en el avatar
    avatarCircle.style.transform = "scale(0.95)";
    setTimeout(() => {
      avatarCircle.style.transform = "scale(1)";
      avatarInput.click();
    }, 150);
  });
  
  avatarInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      subirAvatar(e.target.files[0]);
    }
  });
  
  guardarBtn.addEventListener("click", guardarPerfil);
  
  if (cancelarBtn) {
    cancelarBtn.addEventListener("click", cancelarEdicion);
  }

  // =========================
  // INICIALIZACIÓN
  // =========================
  cargarUsuario();
  setupPasswordToggles();

  // Agregar estilos para mejor visualización
  const style = document.createElement('style');
  style.textContent = `
    .avatar-circle {
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .avatar-circle:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }
    .input-icon-wrapper {
      position: relative;
    }
    .toggle-password {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: #666;
      transition: all 0.2s ease;
    }
    .toggle-password:hover {
      color: #333;
    }
    
    /* Animaciones adicionales */
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .perfil-form {
      transition: all 0.3s ease;
    }
    
    #guardar-perfil-btn {
      transition: all 0.3s ease;
    }
    
    #guardar-perfil-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
});