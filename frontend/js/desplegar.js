// ==============================
// FUNCIONES DEL MENÚ DE USUARIO
// ==============================

// Toggle del menú desplegable
function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  const isHidden = dropdown.getAttribute('aria-hidden') === 'true';

  // Cerrar otros menús abiertos
  closeAllDropdowns();

  // Abrir o cerrar este menú
  dropdown.setAttribute('aria-hidden', !isHidden);
  document.querySelector('.user-profile').setAttribute('aria-expanded', isHidden);

  // Posicionar menú
  positionDropdown();
}

// Cerrar todos los menús
function closeAllDropdowns() {
  document.querySelectorAll('[aria-hidden="false"]').forEach(menu => {
    menu.setAttribute('aria-hidden', 'true');
  });
  document.querySelectorAll('[aria-expanded="true"]').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
  });
}

// Posicionar el dropdown
function positionDropdown() {
  const dropdown = document.getElementById('userDropdown');
  const profileBtn = document.querySelector('.user-profile');

  if (dropdown.getAttribute('aria-hidden') === 'false') {
    const rect = profileBtn.getBoundingClientRect();
    dropdown.style.right = `${window.innerWidth - rect.right}px`;
    dropdown.style.top = `${rect.bottom}px`;
  }
}

// ==============================
// CERRAR SESIÓN
// ==============================
function logoutUser() {
  // Limpiar datos de sesión
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('username');

  // Actualizar nombre a "Invitado"
  const nameEl = document.getElementById('mostrarNombre');
  if (nameEl) nameEl.textContent = 'Invitado';

  // Cerrar menú
  closeAllDropdowns();

  // Mostrar notificación
  showNotification('Has cerrado sesión correctamente');

  // Redirigir a login.html después de 1 segundo
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1000);
}

// ==============================
// NOTIFICACIONES
// ==============================
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// ==============================
// CERRAR MENÚ AL HACER CLICK FUERA
// ==============================
document.addEventListener('click', function(event) {
  const dropdown = document.getElementById('userDropdown');
  const profileBtn = document.querySelector('.user-profile');

  if (!dropdown.contains(event.target) && !profileBtn.contains(event.target)) {
    closeAllDropdowns();
  }
});

// ==============================
// INICIALIZACIÓN AL CARGAR
// ==============================
document.addEventListener('DOMContentLoaded', function() {
  // Actualizar nombre de usuario si hay en localStorage
  const username = localStorage.getItem('username');
  const nameEl = document.getElementById('mostrarNombre');
  if (username && nameEl) nameEl.textContent = username;

  // Evento de logout
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logoutUser();
    });
  }

  // Ajustar posición del dropdown al redimensionar
  window.addEventListener('resize', positionDropdown);
});

// ==============================
// ESTILOS DINÁMICOS
// ==============================
const style = document.createElement('style');
style.textContent = `
.user-dropdown {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  min-width: 200px;
  z-index: 1000;
  display: none;
}

.user-dropdown[aria-hidden="false"] {
  display: block;
}

.dropdown-group {
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  color: #333;
  text-decoration: none;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.logout {
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 4px 0;
}

.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #4CAF50;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.notification.fade-out {
  animation: fadeOut 0.5s ease-out forwards;
}

@keyframes slideIn {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes fadeOut {
  to { opacity: 0; transform: translateY(20px); }
}
`;
document.head.appendChild(style);
