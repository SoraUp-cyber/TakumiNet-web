 document.addEventListener("DOMContentLoaded", async () => {
  const ctx = document.getElementById('jamsChart').getContext('2d');

  // ======================
  // Función para traer datos de la API
  // ======================
  async function obtenerGameJams() {
    try {
      const res = await fetch("http://localhost:3001/api/game_jams");
      const result = await res.json();
      if (!result.ok) return [];
      return result.jams; // Suponemos que la API devuelve { jams: [...] }
    } catch (err) {
      console.error("Error al obtener Game Jams:", err);
      return [];
    }
  }

  // ======================
  // Configuración inicial del gráfico
  // ======================
  const data = {
    labels: [], // Nombres de las Game Jams
    datasets: [{
      label: 'Número de participantes',
      data: [], // Número de participantes (simulado si tu DB no tiene)
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.2)',
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#ffffff', font: { size: 14 } }
      },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true }
    }
  };

  const chart = new Chart(ctx, {
    type: 'line',
    data,
    options
  });

  // ======================
  // Actualizar gráfico con datos de la API
  // ======================
  async function actualizarGrafico() {
    const jams = await obtenerGameJams();
    data.labels = jams.map(j => j.titulo); // nombres de las jams

    // Aquí simulamos número de participantes si no tienes campo real
    data.datasets[0].data = jams.map(j => Math.floor(Math.random() * 50) + 10);

    chart.update();
  }

  // Cargar inicialmente
  await actualizarGrafico();

  // Refrescar cada 10 segundos
  setInterval(actualizarGrafico, 10000);
});