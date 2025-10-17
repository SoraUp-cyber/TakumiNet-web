// Simulación de una API de juegos
const juegosAPI = [
    { id: 1, nombre: "Juego A", precio: 20 },
    { id: 2, nombre: "Juego B", precio: 35 },
    { id: 3, nombre: "Juego C", precio: 50 }
];

// Carrito de compras (inicialmente vacío)
let carrito = [];

// Referencias a elementos del DOM
const cartBadge = document.querySelector('.cart-badge');
const cartBtn = document.querySelector('.cart-btn');

// Crear y mostrar el modal del carrito
function mostrarCarrito() {
    let modal = document.getElementById('cart-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cart-modal';
        modal.setAttribute('data-i18', 'cart-modal'); // 👈 Marca simbólica sin traducción
        modal.style.position = 'fixed';
        modal.style.top = '60px';
        modal.style.right = '20px';
        modal.style.background = '#1d1d1dff';
        modal.style.border = '1px solid #1eff00ff';
        modal.style.padding = '20px';
        modal.style.zIndex = 1000;
        modal.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <h3 data-i18="titulo-carrito">Carrito de Compras</h3>
        <ul data-i18="lista-carrito">
            ${carrito.length === 0 
                ? '<li data-i18="vacio">El carrito está vacío.</li>' 
                : carrito.map(j => `<li data-i18="item">${j.nombre} - $${j.precio}</li>`).join('')}
        </ul>
        <button id="cerrar-carrito" data-i18="btn-cerrar">Cerrar</button>
    `;
    document.getElementById('cerrar-carrito').onclick = () => modal.remove();
}

// Actualizar el badge del carrito
function actualizarBadge() {
    if (cartBadge) {
        cartBadge.textContent = carrito.length;
    }
}

// Función para alternar el modal del carrito
function toggleCart() {
    let modal = document.getElementById('cart-modal');
    if (modal) {
        modal.remove();
    } else {
        mostrarCarrito();
    }
}

// Simulación: función para agregar un juego al carrito
function agregarAlCarrito(idJuego) {
    const juego = juegosAPI.find(j => j.id === idJuego);
    if (juego) {
        carrito.push(juego);
        actualizarBadge();
    }
}

// Inicializar badge en 0
actualizarBadge();

// Ejemplo: agregar juegos al carrito (puedes llamar esto desde botones de "Agregar al carrito")
window.agregarAlCarrito = agregarAlCarrito;

// Asignar función al botón del carrito si existe
if (cartBtn) {
    cartBtn.onclick = toggleCart;
    cartBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleCart();
        }
    });
}
