(async function () {
  const API_BASE = "https://grim-britte-takuminet-backend-c7daca2c.koyeb.app";
  const juegoId = new URLSearchParams(window.location.search).get("juego_id") || 
                  new URLSearchParams(window.location.search).get("id");
  const userId = sessionStorage.getItem("userId");
  const username = sessionStorage.getItem("username");

  let valorSeleccionado = 0;

  const ratingStars = document.querySelectorAll("#rating span");
  const ratingInfo = document.getElementById("rating-info");

  // Función para actualizar estrellas según valor
  function actualizarEstrellas(valor) {
    ratingStars.forEach(s => s.classList.remove("active"));
    for (let i = 0; i < valor; i++) ratingStars[i].classList.add("active");
  }

  // Manejo de clic en estrellas
  ratingStars.forEach(star => {
    star.addEventListener("click", () => {
      valorSeleccionado = parseInt(star.dataset.value);
      actualizarEstrellas(valorSeleccionado);
    });
  });

  // Función para cargar promedio y número de votos - CORREGIDA
  async function cargarCalificaciones() {
    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}/calificaciones`);
      
      // Verificar si la respuesta es OK
      if (!res.ok) {
        console.warn("Error HTTP:", res.status, res.statusText);
        ratingInfo.textContent = "No hay calificaciones aún";
        return;
      }

      // Verificar que el contenido sea JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn("La respuesta no es JSON:", contentType);
        ratingInfo.textContent = "No hay calificaciones aún";
        return;
      }

      const data = await res.json();
      
      if (!data.ok) {
        ratingInfo.textContent = "No hay calificaciones aún";
        return;
      }

      const { promedio, total } = data;
      ratingInfo.textContent = `Promedio: ${promedio.toFixed(1)} (${total} voto${total !== 1 ? 's' : ''})`;

      // Marcar estrellas según promedio
      actualizarEstrellas(Math.round(promedio));
    } catch (err) {
      console.error("Error cargando calificaciones:", err);
      ratingInfo.textContent = "Error cargando calificaciones";
    }
  }

  // Enviar calificación - CORREGIDA
  document.getElementById("btnEnviarRating").addEventListener("click", async () => {
    if (!userId || !username) {
      alert("Debes iniciar sesión para calificar");
      return;
    }
    
    if (valorSeleccionado === 0) {
      alert("Selecciona una calificación");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/juegos/${juegoId}/calificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: userId, 
          username: username, 
          valor: valorSeleccionado 
        })
      });

      // Verificar si la respuesta es OK
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      // Verificar que el contenido sea JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta del servidor no es JSON');
      }

      const data = await res.json();
      
      if (data.ok) {
        alert("✅ Calificación enviada con éxito");
        cargarCalificaciones(); // actualizar promedio y votos
        valorSeleccionado = 0; // resetear selección
        actualizarEstrellas(0); // resetear estrellas
      } else {
        alert("❌ " + (data.error || "Error al enviar calificación"));
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error de conexión con el servidor");
    }
  });

  // Inicializar - CORREGIDO
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarCalificaciones);
  } else {
    cargarCalificaciones();
  }
})();