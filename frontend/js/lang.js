document.addEventListener("DOMContentLoaded", () => {
  const languageBtn = document.querySelector(".language-btn");
  const dropdown = document.getElementById("languageDropdown");
  const langOptions = document.querySelectorAll(".lang-option");
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  let currentLang = "es"; // Idioma por defecto
  let i18nData = {};

  // ================================
  // 🧩 1. Cargar idioma desde JSON
  // ================================
  async function loadLanguage(lang) {
    try {
      const prefix = window.location.pathname.includes("/pages/") ? "../" : "./";
      const res = await fetch(`${prefix}lang/${lang}.json`);
      if (!res.ok) throw new Error(`Archivo ${lang}.json no encontrado`);

      i18nData = await res.json();
      translatePage();

      // Guardar idioma
      const langKey = userId ? `lang_${userId}` : "lang_guest";
      localStorage.setItem(langKey, lang);
      localStorage.setItem("langChangeEvent", Date.now());
      currentLang = lang;

      // Actualizar idioma en backend (solo si hay token)
      if (token) await updateUserLanguage(lang);
    } catch (error) {
      console.error(`❌ Error al cargar idioma (${lang}):`, error.message);
    }
  }

  // ================================
  // 🔧 2. Traducir página
  // ================================
  function translatePage() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (i18nData[key]) {
        if (el.dataset.i18nType === "placeholder") el.placeholder = i18nData[key];
        else el.innerText = i18nData[key];
      }
    });
  }

  // ================================
  // 🗂️ 3. Actualizar idioma en backend
  // ================================
  async function updateUserLanguage(lang) {
    try {
      const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/user/language", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ language: lang })
      });

      const text = await res.text();

      // Solo intentar parsear si parece JSON
      if (text.trim().startsWith("{")) {
        const json = JSON.parse(text);
        if (!json.ok) console.warn("⚠️ Error del backend al actualizar idioma:", json);
      }
      // Si no es JSON → silencio total (sin consola)

    } catch {
      // Silencio total (no mostrar errores en consola)
    }
  }

  // ================================
  // 👤 4. Cargar idioma del usuario
  // ================================
  async function loadUserLanguage() {
    const langKey = userId ? `lang_${userId}` : "lang_guest";

    if (token && userId) {
      try {
        const res = await fetch("https://grim-britte-takuminet-backend-c7daca2c.koyeb.app/api/user", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok && data.user.language) {
          currentLang = data.user.language;
          localStorage.setItem(langKey, currentLang);
        } else {
          const localLang = localStorage.getItem(langKey);
          if (localLang) currentLang = localLang;
        }
      } catch {
        const localLang = localStorage.getItem(langKey);
        if (localLang) currentLang = localLang;
      }
    } else {
      const guestLang = localStorage.getItem("lang_guest");
      if (guestLang) currentLang = guestLang;
    }

    await loadLanguage(currentLang);
  }

  // ================================
  // 🎛️ 5. Mostrar / ocultar menú idiomas
  // ================================
  languageBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = dropdown.getAttribute("aria-hidden") === "true";
    dropdown.setAttribute("aria-hidden", isHidden ? "false" : "true");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !languageBtn.contains(e.target)) {
      dropdown.setAttribute("aria-hidden", "true");
    }
  });

  // ================================
  // 🔄 6. Cambiar idioma manualmente
  // ================================
  langOptions.forEach((option) => {
    option.addEventListener("click", async () => {
      const selectedLang = option.getAttribute("data-lang");
      await loadLanguage(selectedLang);
      dropdown.setAttribute("aria-hidden", "true");
    });
  });

  // ================================
  // 🌍 7. Sincronizar entre pestañas
  // ================================
  window.addEventListener("storage", (event) => {
    if (event.key === "langChangeEvent") {
      const langKey = userId ? `lang_${userId}` : "lang_guest";
      const localLang = localStorage.getItem(langKey);
      if (localLang && localLang !== currentLang) loadLanguage(localLang);
    }
  });

  // ================================
  // 🚀 8. Inicializar
  // ================================
  loadUserLanguage();
});
