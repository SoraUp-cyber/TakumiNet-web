// ==============================
// JS COMPLETO: MENÚ USUARIO + LOGOUT + NOTIFICACIONES
// Adaptable a PC y móvil
// ==============================

document.addEventListener("DOMContentLoaded", async () => {
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");
  const dropdown = document.getElementById("userDropdown");
  const profileBtn = document.querySelector(".user-profile");

  // =========================
  // 1️⃣ CARGAR DATOS LOCALES
  // =========================
  let username = localStorage.getItem("username");
  let avatar = localStorage.getItem("avatar");

  if (username) currentUsername.textContent = username;
  if (avatar) {
    avatarCircle.style.backgroundImage = `url(${avatar})`;
    avatarCircle.style.backgroundSize = "cover";
    avatarCircle.style.backgroundPosition = "center";
    avatarIcon.style.display = "none";
  }

  // =========================
  // 2️⃣ TOGGLE DROPDOWN
  // =========================
  profileBtn.addEventListener("click", (e) => {
    const isHidden = dropdown.getAttribute("aria-hidden") === "true";
    closeAllDropdowns();
    dropdown.setAttribute("aria-hidden", !isHidden);
    profileBtn.setAttribute("aria-expanded", isHidden);
    positionDropdown();
  });

  // =========================
  // 3️⃣ CERRAR DROPDOWN CLICK FUERA
  // =========================
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
      closeAllDropdowns();
    }
  });

  window.addEventListener("resize", positionDropdown);

  // =========================
  // FUNCIONES AUXILIARES
  // =========================
  function closeAllDropdowns() {
    dropdown.setAttribute("aria-hidden", "true");
    profileBtn.setAttribute("aria-expanded", "false");
  }

  function positionDropdown() {
    if (dropdown.getAttribute("aria-hidden") === "false") {
      const rect = profileBtn.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + 8}px`;
      dropdown.style.right = `${window.innerWidth - rect.right}px`;
      // Full width móvil
      if (window.innerWidth <= 480) {
        dropdown.style.left = "8px";
        dropdown.style.right = "8px";
      } else {
        dropdown.style.left = "auto";
      }
    }
  }

  // =========================
  // 4️⃣ LOGOUT FUNCIONAL
  // =========================
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    localStorage.removeItem("avatar");

    currentUsername.textContent = "Iniciar Sesión";
    avatarCircle.style.backgroundImage = "none";
    avatarIcon.style.display = "block";

    closeAllDropdowns();
    showNotification("Has cerrado sesión correctamente");

    setTimeout(() => { window.location.href = "login.html"; }, 1000);
  }

  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

  // =========================
  // 5️⃣ NOTIFICACIONES
  // =========================
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.remove(), 500);
    }, 2500);
  }
});

// ==============================
// 6️⃣ ESTILOS INTEGRADOS PROFESIONAL
// ==============================
const style = document.createElement("style");
style.textContent = `
.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #2e2e2e;
  border: 1px solid #3d3d3d;
  border-radius: 50px;
  padding: 6px 14px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
}
.user-profile:hover {
  background: #3b3b3b;
  transform: translateY(-1px);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00c853, #00e676);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
  transition: transform 0.3s;
}
.avatar:hover { transform: scale(1.05); }

.username {
  font-size: 0.95rem;
  white-space: nowrap;
}

.user-dropdown {
  position: fixed;
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
  padding: 8px 0;
  min-width: 220px;
  z-index: 2000;
  display: none;
  animation: fadeIn 0.25s ease;
}
.user-dropdown[aria-hidden="false"] { display: block; }

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  color: #fff;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
  font-size: 0.95rem;
}
.menu-item:hover { background: #00c85333; color: #00e676; }

.logout {
  background: none;
  border: none;
  color: #ff6b6b;
  font-weight: 600;
  width: 100%;
  text-align: left;
  cursor: pointer;
}
.logout:hover { color: #ff8787; }

.notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: linear-gradient(135deg, #00c853, #00e676);
  color: white;
  padding: 14px 28px;
  border-radius: 10px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  z-index: 3000;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}
.notification.fade-out { animation: fadeOut 0.4s ease-out forwards; }

@keyframes slideIn {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fadeOut {
  to { opacity: 0; transform: translateY(20px); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Adaptable a móvil */
@media (max-width: 480px){
  .user-dropdown { min-width: auto; width: calc(100% - 16px); right:8px; left:8px; }
}
`;
document.head.appendChild(style);
