// ============================
// DESCARGA.JS
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "http://localhost:3001";
  const params = new URLSearchParams(window.location.search);
  const juegoId = params.get("id");

  if (!juegoId) return;

  try {
    const res = await fetch(`${API_BASE}/api/juegos/${juegoId}`);
    const data = await res.json();
    if (!data.ok) return;

    const juego = data.juego;
    const cont = document.querySelector(".download-container");
    cont.innerHTML = "";

    const h1 = document.createElement("h1");
    h1.textContent = `Descargar: ${juego.title}`;
    cont.appendChild(h1);

    const p = document.createElement("p");
    p.textContent = juego.description || "Sin descripción";
    cont.appendChild(p);

    const btn = document.createElement("a");
    btn.innerHTML = '<i class="fa fa-download"></i> Descargar Ahora';
    btn.classList.add("boton-descargar");

    if (juego.mediafire_url) {
      btn.href = juego.mediafire_url;
      btn.target = "_blank";
    } else {
      btn.href = "#";
      btn.onclick = e => {
        e.preventDefault();
        alert("⚠ Este juego no tiene enlace de descarga disponible.");
      };
    }

    cont.appendChild(btn);
  } catch (err) {
    console.error("❌ Error en descarga.js:", err);
  }
});

