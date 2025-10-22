document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("gamesContainer");
  const API_BASE = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app";
  const token = localStorage.getItem("token");

  if (!token) {
    showToast("Debes iniciar sesión para ver tus juegos", "error");
    return;
  }

  let juegoActualId = null;

  // Modal y elementos
  const modal = document.getElementById("editModal");
  const closeModal = modal.querySelector(".close");
  const modalTitle = document.getElementById("modalTitle");
  const editPriceInput = document.getElementById("editPrice");
  const descuentoInput = document.getElementById("descuentoPorcentaje");
  const precioOfertaSpan = document.getElementById("precioOferta");
  const editForm = document.getElementById("editForm");

  const porcentajeOfertaSpan = document.createElement("span");
  porcentajeOfertaSpan.id = "porcentajeOferta";
  porcentajeOfertaSpan.style.marginLeft = "10px";
  porcentajeOfertaSpan.style.fontWeight = "bold";
  porcentajeOfertaSpan.style.color = "red";
  precioOfertaSpan.parentNode.appendChild(porcentajeOfertaSpan);

  // Crear tarjeta de juego
  function crearJuegoDiv(juego) {
    const div = document.createElement("div");
    div.classList.add("juego-card");

    const precioOriginal = parseFloat(juego.price) || 0;
    const descuento = parseFloat(juego.discount) || 0;
    const finalPrice = parseFloat(juego.final_price ?? precioOriginal * (1 - descuento / 100)).toFixed(2);

    div.innerHTML = `
      <div class="juego-cover">
        <img src="${juego.cover || 'https://via.placeholder.com/300x200?text=Sin+Portada'}" alt="${juego.title || 'Juego sin nombre'}">
      </div>
      <div class="juego-info">
        <h3>${juego.title || 'Sin título'}</h3>
        <p>${juego.description ? juego.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
        <p class="precio-juego">
          ${juego.pricing === "free"
            ? `<strong>Gratis</strong>`
            : `<strong>Precio Final:</strong> $${finalPrice} (${descuento}%)`
          }
        </p>
        <div class="acciones">
          <button class="btn-eliminar" data-id="${juego.id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
          <button class="btn-oferta"
            data-id="${juego.id}"
            data-title="${juego.title}"
            data-price="${precioOriginal}"
            data-discount="${descuento}"
            data-final="${finalPrice}">
            <i class="fa-solid fa-tags"></i> Oferta
          </button>
        </div>
      </div>
    `;
    return div;
  }

  // Cargar todos los juegos del usuario y precios
  async function cargarJuegosUsuario() {
    try {
      const res = await fetch(`${API_BASE}/api/mis-juegos`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.juegos) || data.juegos.length === 0) {
        contenedor.innerHTML = `<p>No tienes juegos registrados.</p>`;
        return;
      }

      contenedor.innerHTML = "";

      for (const juego of data.juegos) {
        try {
          const precioRes = await fetch(`${API_BASE}/api/juegos/${juego.id}/precio`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const precioData = await precioRes.json();
          if (precioData.ok) {
            juego.price = precioData.price;
            juego.discount = precioData.discount;
            juego.final_price = precioData.final_price;
          }
        } catch (err) {
          console.error(`Error obteniendo precio de juego ${juego.id}:`, err);
        }

        contenedor.appendChild(crearJuegoDiv(juego));
      }

    } catch (error) {
      console.error("Error cargando juegos:", error);
      showToast("Error al cargar los juegos", "error");
    }
  }

  await cargarJuegosUsuario();

  // Delegación de eventos
  contenedor.addEventListener("click", async e => {
    const btnEliminar = e.target.closest(".btn-eliminar");
    const btnOferta = e.target.closest(".btn-oferta");

    if (btnEliminar) {
      const id = btnEliminar.dataset.id;
      if (!confirm("¿Seguro que quieres eliminar este juego?")) return;

      try {
        const resDel = await fetch(`${API_BASE}/api/juegos/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        });
        const result = await resDel.json();
        if (result.ok) {
          showToast("Juego eliminado correctamente", "success");
          cargarJuegosUsuario();
        } else {
          showToast("No se pudo eliminar el juego: " + (result.message || ""), "error");
        }
      } catch (err) {
        console.error("Error al eliminar juego:", err);
        showToast("Error de conexión con el servidor", "error");
      }
    }

    if (btnOferta) {
      juegoActualId = btnOferta.dataset.id;
      modalTitle.textContent = btnOferta.dataset.title;

      const precioOriginal = parseFloat(btnOferta.dataset.price) || 0;
      const descuento = parseFloat(btnOferta.dataset.discount) || 0;
      const finalPrice = parseFloat(btnOferta.dataset.final ?? precioOriginal * (1 - descuento / 100));

      editPriceInput.value = precioOriginal.toFixed(2);
      descuentoInput.value = descuento;
      precioOfertaSpan.textContent = finalPrice.toFixed(2);
      porcentajeOfertaSpan.textContent = descuento > 0 ? `-${descuento}%` : "0%";

      modal.style.display = "block";
    }
  });

  // Cerrar modal
  closeModal.onclick = () => modal.style.display = "none";
  window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
  document.addEventListener("keydown", e => { if (e.key === "Escape") modal.style.display = "none"; });

  // Actualizar precio en tiempo real en el modal
  const actualizarPrecioOferta = () => {
    const precio = parseFloat(editPriceInput.value) || 0;
    const descuento = parseFloat(descuentoInput.value) || 0;
    precioOfertaSpan.textContent = (precio * (1 - descuento / 100)).toFixed(2);
    porcentajeOfertaSpan.textContent = descuento > 0 ? `-${descuento}%` : "0%";
  };
  editPriceInput.addEventListener("input", actualizarPrecioOferta);
  descuentoInput.addEventListener("input", actualizarPrecioOferta);

  // Guardar cambios del modal
  editForm.addEventListener("submit", async e => {
    e.preventDefault();
    const precio = parseFloat(editPriceInput.value) || 0;
    const descuento = parseFloat(descuentoInput.value) || 0;

    if (!juegoActualId) return;

    try {
      const resp = await fetch(`${API_BASE}/api/juegos/${juegoActualId}/precio`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ final_price: precio, discount: descuento })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.message);

      showToast(`Precio actualizado: $${data.final_price} (${descuento}%)`, "success");
      modal.style.display = "none";

      // Actualizar tarjeta con el precio final
      const tarjeta = contenedor.querySelector(`.btn-oferta[data-id="${juegoActualId}"]`).closest('.juego-card');
      tarjeta.querySelector('.precio-juego').innerHTML = `<strong>Precio Final:</strong> $${parseFloat(data.final_price).toFixed(2)} (${descuento}%)`;

      // Actualizar dataset del botón
      const btn = tarjeta.querySelector(".btn-oferta");
      btn.dataset.price = precio.toFixed(2);
      btn.dataset.discount = descuento;
      btn.dataset.final = parseFloat(data.final_price).toFixed(2);

    } catch (err) {
      console.error(err);
      showToast(`Error: ${err.message}`, "error");
    }
  });

  // Función Toast
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => container.removeChild(toast));
    }, 3500);
  }
});
