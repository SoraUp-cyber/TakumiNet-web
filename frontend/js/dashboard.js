document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "https://distinct-oralla-takumi-net-0d317399.koyeb.app";
  const token = localStorage.getItem("token");

  // =========================
  // REFERENCIAS DEL DOM
  // =========================
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const currentUsername = document.getElementById("current-username");
  const juegosPublicadoH4 = document.querySelector(".juegos-publicados");
  const calificacionesCanvas = document.getElementById("calificacionesChart")?.getContext("2d");

  // =========================
  // Si no hay token -> detener
  // =========================
  if (!token) {
    if (juegosPublicadoH4) juegosPublicadoH4.textContent = "0";
    if (currentUsername) currentUsername.textContent = "Invitado";
    return;
  }

  // =========================
  // 1️⃣ Cargar datos del usuario
  // =========================
  async function loadUser() {
    try {
      const res = await fetch(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok || !data.user) {
        console.error("Error al cargar usuario:", data.error);
        return;
      }

      const user = data.user;
      currentUsername.textContent = user.username || "Usuario";

      if (user.avatar) {
        avatarCircle.style.backgroundImage = `url(${user.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarCircle.style.backgroundPosition = "center";
        avatarIcon.style.display = "none";
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }

    } catch (err) {
      console.error("Error cargando usuario:", err);
    }
  }

  // =========================
  // 2️⃣ Cargar juegos y generar gráfica
  // =========================
  async function loadDashboard() {
    try {
      const res = await fetch(`${API_BASE}/api/mis-juegos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.ok || !Array.isArray(data.juegos)) {
        if (juegosPublicadoH4) juegosPublicadoH4.textContent = "0";
        return;
      }

      const juegos = data.juegos;
      if (juegosPublicadoH4) juegosPublicadoH4.textContent = juegos.length;

      // Si no hay canvas, detener aquí (por ejemplo, si es otra página)
      if (!calificacionesCanvas) return;

      const nombresJuegos = [];
      const promedioCalificaciones = [];

      // 🔹 Consultar el promedio de calificaciones de cada juego
      for (const juego of juegos) {
        nombresJuegos.push(juego.titulo || `Juego ${juego.id}`);
        try {
          const votosRes = await fetch(`${API_BASE}/api/juegos/${juego.id}/votos`);
          const votosData = await votosRes.json();
          if (votosData.ok && votosData.promedio != null) {
            promedioCalificaciones.push(votosData.promedio);
          } else {
            promedioCalificaciones.push(0);
          }
        } catch {
          promedioCalificaciones.push(0);
        }
      }

      // =========================
      // Crear gráfica con Chart.js (verde moderno)
      // =========================
      new Chart(calificacionesCanvas, {
        type: "bar",
        data: {
          labels: nombresJuegos,
          datasets: [{
            label: "⭐ Calificación Promedio",
            data: promedioCalificaciones,
            backgroundColor: "rgba(34, 197, 94, 0.7)", // verde moderno
            borderColor: "rgba(22, 163, 74, 1)",
            borderWidth: 2,
            borderRadius: 8,
            hoverBackgroundColor: "rgba(34, 197, 94, 1)",
            hoverBorderColor: "rgba(21, 128, 61, 1)"
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              ticks: {
                color: "#ffffff",
                font: { family: "Segoe UI, sans-serif", size: 13 }
              },
              grid: { color: "rgba(255,255,255,0.1)" }
            },
            x: {
              ticks: {
                color: "#ffffff",
                font: { family: "Segoe UI, sans-serif", size: 13 }
              },
              grid: { display: false }
            }
          },
          plugins: {
            legend: {
              display: true,
              labels: {
                color: "#a3e635",
                font: { size: 14, weight: "bold" }
              }
            },
            title: {
              display: true,
              text: "Calificaciones Promedio de tus Juegos",
              color: "#ffffff",
              font: { size: 18, weight: "bold" },
              padding: { top: 10, bottom: 20 }
            },
            tooltip: {
              backgroundColor: "rgba(34,197,94,0.9)",
              titleColor: "#fff",
              bodyColor: "#fff",
              borderColor: "#16a34a",
              borderWidth: 1
            }
          },
          layout: { padding: 10 },
          animation: {
            duration: 1200,
            easing: "easeOutQuart"
          }
        }
      });

    } catch (error) {
      console.error("Error al cargar juegos o calificaciones:", error);
      if (juegosPublicadoH4) juegosPublicadoH4.textContent = "0";
    }
  }

  // =========================
  // Ejecutar funciones
  // =========================
  await loadUser();
  await loadDashboard();
});