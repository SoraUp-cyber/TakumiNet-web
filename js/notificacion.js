document.addEventListener('DOMContentLoaded', function() {
  const notificationBtn = document.querySelector('.notification-btn');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationsList = document.getElementById('notificationsList');
  const notificationBadge = document.getElementById('notificationBadge');
  const markReadBtn = document.getElementById('markReadBtn');

  let isNotificationOpen = false;
  let notifications = [];
  let isLoading = false;

  // ===========================
  // Cargar notificaciones + promoción (simulado)
  // ===========================
  async function loadNotifications() {
    if (isLoading) return;
    isLoading = true;
    showLoadingState();

    try {
      // Simulación de datos de notificaciones
      await new Promise(r => setTimeout(r, 500)); // simula delay
      notifications = [
        { id: '1', text: 'Notificación de prueba 1', read: false, time: 'Ahora', icon: 'fa-info-circle' },
        { id: '2', text: 'Notificación de prueba 2', read: true, time: 'Hace 1 hora', icon: 'fa-check' }
      ];

      renderNotifications();
      renderPromocion(); // agregamos la promoción al inicio
    } catch (error) {
      console.error('Error:', error);
      showErrorMessage('No se pudieron cargar las notificaciones');
    } finally {
      isLoading = false;
    }
  }

  // ===========================
  // Renderizar promoción
  // ===========================
  function renderPromocion() {
    const promo = {
      id: 'promo_001',
      text: '🎉 ¡Oferta especial! 50% de descuento esta semana',
      image: 'https://blog.payproglobal.com/hubfs/header_Selling-Your-Indie-Game-Online-1.png',
      link: '/promociones',
      time: 'Hoy'
    };

    const promoItem = document.createElement('div');
    promoItem.className = 'notification-item promo';
    promoItem.setAttribute('role', 'menuitem');
    promoItem.setAttribute('data-id', promo.id);

    promoItem.innerHTML = `
      <div class="notification-image">
        <img src="${promo.image}" alt="Promoción" style="width:100%; border-radius:5px;" />
      </div>
      <div class="notification-body">
        <p class="notification-text">${promo.text}</p>
        <time class="notification-time">${promo.time}</time>
      </div>
    `;

    promoItem.addEventListener('click', () => {
      if (promo.link) window.location.href = promo.link;
    });

    notificationsList.prepend(promoItem); // siempre al inicio
  }

  function showLoadingState() {
    notificationsList.innerHTML = '<div class="loading">Cargando notificaciones...</div>';
  }

  function showErrorMessage(message) {
    notificationsList.innerHTML = `<div class="error">${message}</div>`;
  }

  function renderNotifications() {
    notificationsList.innerHTML = '';
    if (!notifications || notifications.length === 0) {
      notificationsList.innerHTML = '<div class="empty">No tienes notificaciones</div>';
      notificationBadge.style.display = 'none';
      return;
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    updateBadge(unreadCount);

    notifications.forEach(notification => {
      const item = document.createElement('div');
      item.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
      item.setAttribute('role', 'menuitem');
      item.setAttribute('data-id', notification.id);
      item.innerHTML = `
        <i class="notification-icon fas ${notification.icon || 'fa-bell'}"></i>
        <div class="notification-body">
          <p class="notification-text">${notification.text}</p>
          <time class="notification-time">${notification.time || 'Reciente'}</time>
        </div>
      `;
      notificationsList.appendChild(item);
    });
  }

  function updateBadge(count) {
    notificationBadge.textContent = count;
    notificationBadge.style.display = count > 0 ? 'block' : 'none';
  }

  function toggleNotifications() {
    isNotificationOpen = !isNotificationOpen;
    if (isNotificationOpen) {
      notificationDropdown.style.display = 'block';
      notificationDropdown.setAttribute('aria-hidden', 'false');
      notificationBtn.setAttribute('aria-expanded', 'true');
      loadNotifications();
    } else {
      notificationDropdown.style.display = 'none';
      notificationDropdown.setAttribute('aria-hidden', 'true');
      notificationBtn.setAttribute('aria-expanded', 'false');
    }
  }

  async function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    renderNotifications();
  }

  async function markAsRead(notificationId) {
    const n = notifications.find(x => x.id === notificationId);
    if (n) { n.read = true; renderNotifications(); }
  }

  notificationBtn.addEventListener('click', e => { e.stopPropagation(); toggleNotifications(); });
  markReadBtn.addEventListener('click', e => { e.stopPropagation(); markAllAsRead(); });
  notificationsList.addEventListener('click', e => {
    const item = e.target.closest('.notification-item');
    if (item) markAsRead(item.getAttribute('data-id'));
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.notification-wrapper') && !e.target.closest('.notification-dropdown')) {
      if (isNotificationOpen) toggleNotifications();
    }
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isNotificationOpen) toggleNotifications(); });

  notificationBadge.style.display = 'none';
});
