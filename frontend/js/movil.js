document.addEventListener('DOMContentLoaded', () => {

    // ELEMENTOS
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    // Crear overlay una sola vez
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    // FUNCIONES
    function openMenu() {
        navLinks.classList.add('active');
        hamburger.classList.add('active');
        overlay.classList.add('active');
        closeAllDropdowns();
    }

    function closeMenu() {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        overlay.classList.remove('active');
    }

    function toggleMenu() {
        if(navLinks.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // DROPDOWNS
    function closeAllDropdowns() {
        document.querySelectorAll('.notification-dropdown, .user-dropdown, .language-dropdown')
            .forEach(d => d.classList.remove('show'));
    }

    // EVENTOS
    hamburger.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            closeMenu();
        }

        // Cerrar dropdowns
        if (!e.target.closest('.user-menu-btn') && !e.target.closest('#userDropdown')) {
            document.getElementById('userDropdown')?.classList.remove('show');
        }
        if (!e.target.closest('.notification-btn') && !e.target.closest('#notificationDropdown')) {
            document.getElementById('notificationDropdown')?.classList.remove('show');
        }
        if (!e.target.closest('.language-btn') && !e.target.closest('#languageDropdown')) {
            document.getElementById('languageDropdown')?.classList.remove('show');
        }
    });

});
