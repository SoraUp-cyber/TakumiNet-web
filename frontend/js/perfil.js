document.addEventListener("DOMContentLoaded", async () => {
  const $ = id => document.getElementById(id);

  const token = localStorage.getItem("token");
  if (!token) return;

  const avatarCircle = $("avatar-circle");
  const avatarIcon = $("avatar-icon");

  try {
    // =========================
    // 1️⃣ Cargar datos del usuario
    // =========================
    const userRes = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const userData = await userRes.json();
    if (!userData.ok) return console.error("❌ Error usuario:", userData.error);

    const user = userData.user;

    // --- Nombre ---
    $("current-username").textContent = user.username || "Invitado";

    // --- Avatar ---
    if (user.avatar) {
      avatarCircle.style.backgroundImage = `url(${user.avatar})`;
      avatarCircle.style.backgroundSize = "cover";
      avatarCircle.style.backgroundPosition = "center";
      avatarCircle.style.backgroundRepeat = "no-repeat";
      avatarIcon.style.display = "none";
    } else {
      avatarCircle.style.backgroundImage = "none";
      avatarIcon.style.display = "block";
    }

    // --- Biografía ---
    $("usuario-bio").textContent =
      user.descripcion || "Este usuario no escribió su biografía.";

// --- Contacto ---
const contactoDiv = $("usuario-contacto");
contactoDiv.innerHTML = "";

// Email
if (user.contacto_email) {
  contactoDiv.innerHTML += `
    <p>
      <img src="https://img.icons8.com/fluency/96/mail--v1.png" 
           width="32" height="32" alt="mail" 
           style="vertical-align:middle; margin-right:10px;" />
      <a href="mailto:${user.contacto_email}">${user.contacto_email}</a>
    </p>
  `;
}

// Web
if (user.web) {
  contactoDiv.innerHTML += `
    <p>
      <img src="https://img.icons8.com/fluency/96/domain.png" 
           width="32" height="32" alt="web" 
           style="vertical-align:middle; margin-right:10px;" />
      <a href="${user.web}" target="_blank">${user.web}</a>
    </p>
  `;
}

// Fallback
if (!user.contacto_email && !user.web) {
  contactoDiv.innerHTML = "<p>No agregó datos de contacto.</p>";
}


    // --- Redes sociales ---
    const socialDiv = $("usuario-social");
    socialDiv.innerHTML = "";

    const redes = {
      twitter:   { url: user.twitter,   icon: '<i class="bi bi-twitter"></i>',   name: "Twitter" },
      instagram: { url: user.instagram, icon: '<i class="bi bi-instagram"></i>', name: "Instagram" },
      youtube:   { url: user.youtube,   icon: '<i class="bi bi-youtube"></i>',   name: "YouTube" },
      discord:   { url: user.discord,   icon: '<i class="bi bi-discord"></i>',   name: "Discord" }
    };

    let tieneRedes = false;
    for (const [key, data] of Object.entries(redes)) {
      if (data.url) {
        tieneRedes = true;
        socialDiv.innerHTML += `
          <p>${data.icon} <a href="${data.url}" target="_blank">${data.name}</a></p>
        `;
      }
    }
    if (!tieneRedes) {
      socialDiv.innerHTML = "<p>No agregó redes sociales.</p>";
    }

    // =========================
    // 2️⃣ Cargar juegos del usuario
    // =========================
    const juegosRes = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/mis-juegos", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const juegosData = await juegosRes.json();

    const juegosDiv = $("usuario-juegos");
    juegosDiv.innerHTML = "";

    if (!juegosData.ok || juegosData.juegos.length === 0) {
      juegosDiv.innerHTML = "<p>Este usuario no tiene juegos publicados.</p>";
    } else {
      juegosData.juegos.forEach(juego => {
        const cover =
          juego.cover ||
          "https://via.placeholder.com/300x150.png?text=Sin+Portada";

        juegosDiv.innerHTML += `
          <div class="juego-card">
            <img src="${cover}" alt="${juego.title}" class="juego-cover">
            <h4>${juego.title}</h4>
            <p>${juego.description.substring(0, 80)}...</p>
          </div>
        `;
      });
    }

  } catch (err) {
    console.error("❌ Error cargando perfil:", err);
  }
});
