document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("No estás logueado.");

  // =========================
  // ELEMENTOS DEL DOM
  // =========================
  const avatarCircle = document.getElementById("avatar-circle");
  const avatarIcon = document.getElementById("avatar-icon");
  const avatarInput = document.getElementById("upload-photo");
  const usernameInput = document.getElementById("nombre-real");
  const bioInput = document.getElementById("biografia");
  const correoInput = document.getElementById("correo");
  const url1Input = document.getElementById("url1");
  const url2Input = document.getElementById("url2");
  const url3Input = document.getElementById("url3");
  const url4Input = document.getElementById("url4");
  const currentPassInput = document.getElementById("contrasena-actual");
  const newPassInput = document.getElementById("nueva-contrasena");
  const confirmPassInput = document.getElementById("confirmar-contrasena");
  const guardarBtn = document.getElementById("guardar-perfil-btn");
  const menuUsername = document.getElementById("current-username");

  let avatarUrl = null; // URL actual del avatar

  // =========================
  // FUNCIONES AUXILIARES
  // =========================

  // Cargar datos del usuario
  async function cargarUsuario() {
    try {
      const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.ok) return alert("Error cargando usuario: " + data.error);

      const u = data.user;

      usernameInput.value = u.username || "";
      bioInput.value = u.descripcion || "";
      correoInput.value = u.email || "";
      url1Input.value = u.twitter || "";
      url2Input.value = u.instagram || "";
      url3Input.value = u.youtube || "";
      url4Input.value = u.discord || "";

      if (u.avatar) {
        avatarCircle.style.backgroundImage = `url(${u.avatar})`;
        avatarCircle.style.backgroundSize = "cover";
        avatarIcon.style.display = "none";
        avatarUrl = u.avatar;
      } else {
        avatarCircle.style.backgroundImage = "none";
        avatarIcon.style.display = "block";
      }

      menuUsername.textContent = u.username || "Invitado";
    } catch (err) {
      console.error("❌ Error cargando usuario:", err);
      alert("No se pudo cargar el usuario");
    }
  }

  // Subir avatar a backend
  async function subirAvatar(file) {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const avatarBase64 = reader.result;
      try {
        const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/user/avatar", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ avatarBase64 })
        });
        const data = await res.json();
        if (!data.ok) return alert("❌ No se pudo actualizar el avatar: " + data.error);

        avatarCircle.style.backgroundImage = `url(${data.avatar})`;
        avatarIcon.style.display = "none";
        avatarUrl = data.avatar;
        alert("✅ Avatar actualizado correctamente 🎉");
      } catch (err) {
        console.error("❌ Error subiendo avatar:", err);
        alert("❌ Error subiendo avatar");
      }
    };
    reader.readAsDataURL(file);
  }

  // Guardar cambios de perfil
  async function guardarPerfil() {
    if (newPassInput.value && newPassInput.value !== confirmPassInput.value) {
      return alert("Las contraseñas no coinciden");
    }

    const body = {
      username: usernameInput.value || null,
      descripcion: bioInput.value || null,
      contacto_email: correoInput.value || null,
      twitter: url1Input.value || null,
      instagram: url2Input.value || null,
      youtube: url3Input.value || null,
      discord: url4Input.value || null,
      currentPassword: currentPassInput.value || null,
      newPassword: newPassInput.value || null,
      avatarBase64: avatarUrl || null
    };

    try {
      const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/user/editar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.ok) return alert("❌ No se pudo actualizar el perfil: " + data.error);

      alert("✅ Perfil actualizado correctamente");
      menuUsername.textContent = usernameInput.value;
      currentPassInput.value = newPassInput.value = confirmPassInput.value = "";
    } catch (err) {
      console.error("❌ Error actualizando perfil:", err);
      alert("❌ No se pudo actualizar el perfil");
    }
  }

  // =========================
  // EVENTOS
  // =========================
  avatarCircle.addEventListener("click", () => avatarInput.click());
  avatarInput.addEventListener("change", (e) => subirAvatar(e.target.files[0]));
  guardarBtn.addEventListener("click", guardarPerfil);

  // =========================
  // INICIALIZACIÓN
  // =========================
  cargarUsuario();
});
