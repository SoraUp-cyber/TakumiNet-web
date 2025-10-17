// =========================
// CARGAR USUARIO AL INICIAR
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
        alert("Debes iniciar sesión para subir un juego");
        window.location.href = "login.html";
        return;
    }

    loadUser();
    setupEventListeners();
});

// =========================
// CARGAR DATOS DEL USUARIO
// =========================
async function loadUser() {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3001/api/user", {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const data = await res.json();

        if (!data.ok) {
            console.error("Error cargando usuario:", data.error);
            alert("Error al cargar usuario. Por favor, vuelve a iniciar sesión.");
            return;
        }

        const user = data.user;
        const userId = user.user_id;

        if (!userId) {
            console.error("No se encontró user_id en el objeto user:", user);
            alert("⚠️ Error: No se pudo obtener el ID del usuario.");
            return;
        }

        // Mostrar información en el formulario
        document.getElementById("username").textContent = user.username || "Usuario";
        document.getElementById("user-id-display").textContent = userId;
        document.getElementById("user-id").value = userId;

        // Actualizar dominio del usuario
        const userDomain = document.getElementById("user-domain");
        if (userDomain) {
            userDomain.textContent = user.username || "Usuario";
        }

        console.log("✅ Usuario cargado correctamente - user_id:", userId, "Username:", user.username);

    } catch (err) {
        console.error("Error cargando usuario:", err);
        alert("Error de conexión al cargar usuario: " + err.message);
    }
}

// =========================
// CONFIGURAR EVENT LISTENERS
// =========================
function setupEventListeners() {
    // Preview de portada
    const coverInput = document.getElementById("cover");
    if (coverInput) {
        coverInput.addEventListener("change", handleCoverPreview);
    }

    // Preview de capturas
    const screenshotsInput = document.getElementById("screenshots");
    if (screenshotsInput) {
        screenshotsInput.addEventListener("change", handleScreenshotsPreview);
    }

    // Mostrar/ocultar precio
    const pricingSelect = document.getElementById("pricing");
    const priceInput = document.getElementById("price");
    
    if (pricingSelect && priceInput) {
        pricingSelect.addEventListener("change", function() {
            if (this.value === "pago") {
                priceInput.style.display = "block";
                priceInput.required = true;
            } else {
                priceInput.style.display = "none";
                priceInput.required = false;
                priceInput.value = "";
            }
        });
    }

    // Botón eliminar portada
    const removeCoverBtn = document.getElementById("remove-cover");
    if (removeCoverBtn) {
        removeCoverBtn.addEventListener("click", removeCover);
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeMediaFireModal();
        }
    });
}

// =========================
// PREVIEW DE PORTADA
// =========================
function handleCoverPreview(event) {
    const file = event.target.files[0];
    if (!file) return;

    const imgPreview = document.getElementById("cover-preview");
    const videoPreview = document.getElementById("video-preview");
    const removeBtn = document.getElementById("remove-cover");

    // Ocultar ambos previews inicialmente
    imgPreview.style.display = "none";
    videoPreview.style.display = "none";
    removeBtn.style.display = "none";

    // Validar tamaño máximo (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("El archivo es demasiado grande. Máximo 100MB permitidos.");
        event.target.value = "";
        return;
    }

    // Validar tipo de archivo
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm'];
    
    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
        alert("Formato de archivo no válido. Use JPG, PNG, GIF, MP4 o WebM.");
        event.target.value = "";
        return;
    }

    // Verificar si es imagen o video
    if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imgPreview.src = e.target.result;
            imgPreview.style.display = "block";
            removeBtn.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        videoPreview.src = url;
        videoPreview.style.display = "block";
        removeBtn.style.display = "block";
    }
}

// =========================
// ELIMINAR PORTADA
// =========================
function removeCover() {
    const coverInput = document.getElementById("cover");
    const imgPreview = document.getElementById("cover-preview");
    const videoPreview = document.getElementById("video-preview");
    const removeBtn = document.getElementById("remove-cover");

    coverInput.value = "";
    imgPreview.style.display = "none";
    videoPreview.style.display = "none";
    removeBtn.style.display = "none";
    videoPreview.src = "";
}

// =========================
// PREVIEW DE CAPTURAS
// =========================
function handleScreenshotsPreview(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById("screenshots-preview");
    
    if (!files.length) return;

    previewContainer.innerHTML = "";
    let validFiles = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith("image/")) {
            alert(`El archivo "${file.name}" no es una imagen válida. Se omitirá.`);
            continue;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert(`La imagen "${file.name}" es demasiado grande. Máximo 10MB.`);
            continue;
        }

        validFiles++;
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement("img");
            img.src = e.target.result;
            img.alt = `Captura ${validFiles}`;
            img.classList.add("screenshot-preview");
            
            const container = document.createElement("div");
            container.classList.add("screenshot-item");
            
            const indexSpan = document.createElement("span");
            indexSpan.textContent = validFiles;
            indexSpan.classList.add("screenshot-index");
            container.appendChild(indexSpan);
            
            container.appendChild(img);
            
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "×";
            removeBtn.classList.add("remove-screenshot");
            removeBtn.onclick = function() {
                removeScreenshot(container, file);
            };
            container.appendChild(removeBtn);
            
            previewContainer.appendChild(container);
        };
        reader.readAsDataURL(file);
    }

    // Mostrar contador
    const counter = document.createElement("div");
    counter.textContent = `Capturas seleccionadas: ${validFiles}/5 mínimo`;
    counter.classList.add("screenshot-counter");
    previewContainer.appendChild(counter);
}

// =========================
// ELIMINAR CAPTURA INDIVIDUAL
// =========================
function removeScreenshot(container, file) {
    container.remove();
    
    const screenshotsInput = document.getElementById("screenshots");
    const dt = new DataTransfer();
    const currentFiles = screenshotsInput.files;
    
    for (let i = 0; i < currentFiles.length; i++) {
        if (currentFiles[i] !== file) {
            dt.items.add(currentFiles[i]);
        }
    }
    
    screenshotsInput.files = dt.files;
    updateScreenshotCounter();
}

// =========================
// ACTUALIZAR CONTADOR CAPTURAS
// =========================
function updateScreenshotCounter() {
    const previewContainer = document.getElementById("screenshots-preview");
    const counters = previewContainer.getElementsByClassName("screenshot-counter");
    const screenshotItems = previewContainer.getElementsByClassName("screenshot-item");
    
    if (counters.length > 0) {
        counters[0].textContent = `Capturas seleccionadas: ${screenshotItems.length}/5 mínimo`;
    }
}

// =========================
// MOSTRAR FORMULARIO REQUISITOS
// =========================
function mostrarFormulario() {
    const tipo = document.getElementById("tipo-requisitos").value;
    const formMinimos = document.getElementById("form-minimos");
    const formRecomendados = document.getElementById("form-recomendados");

    formMinimos.style.display = tipo === "minimos" ? "block" : "none";
    formRecomendados.style.display = tipo === "recomendados" ? "block" : "none";
}

// =========================
// MODAL MEDIAFIRE
// =========================
function openMediaFireModal() {
    document.getElementById("mediafire-modal").style.display = "block";
    document.getElementById("mediafire-url").value = "";
}

function closeMediaFireModal() {
    document.getElementById("mediafire-modal").style.display = "none";
}

function saveMediaFireLink() {
    const urlInput = document.getElementById("mediafire-url");
    const url = urlInput.value.trim();
    const storageServiceInput = document.getElementById("storage-service");
    
    if (!url) {
        alert("Por favor ingresa una URL válida de MediaFire");
        return;
    }

    if (!url.includes("mediafire.com")) {
        alert("Por favor ingresa una URL válida de MediaFire (debe contener 'mediafire.com')");
        return;
    }

    try {
        new URL(url);
    } catch (e) {
        alert("Por favor ingresa una URL válida");
        return;
    }

    storageServiceInput.value = "mediafire";
    
    const mediafireBtn = document.querySelector('.storage-btn-green');
    if (mediafireBtn) {
        mediafireBtn.innerHTML = '<i class="fa fa-check"></i> MediaFire (URL agregada)';
        mediafireBtn.style.background = "#28a745";
    }
    
    alert(`Enlace de MediaFire guardado correctamente:\n${url}`);
    closeMediaFireModal();
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById("mediafire-modal");
    if (event.target === modal) {
        closeMediaFireModal();
    }
}

// =========================
// CONVERTIR ARCHIVOS A BASE64
// =========================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// =========================
// VALIDAR FORMULARIO
// =========================
function validarFormulario() {
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const screenshotsInput = document.getElementById("screenshots");
    const coverInput = document.getElementById("cover");
    const storageService = document.getElementById("storage-service").value;
    const mediafireUrl = document.getElementById("mediafire-url").value;
    const termsCheckbox = document.getElementById("terms");
    const pricing = document.getElementById("pricing").value;
    const price = document.getElementById("price").value;

    if (!title || title.length < 3) {
        throw new Error("El título debe tener al menos 3 caracteres");
    }

    if (!description || description.length < 10) {
        throw new Error("La descripción debe tener al menos 10 caracteres");
    }

    if (!screenshotsInput.files || screenshotsInput.files.length < 5) {
        throw new Error("Debes subir al menos 5 capturas del juego");
    }

    if (!coverInput.files || coverInput.files.length === 0) {
        throw new Error("Debes subir una portada para el juego");
    }

    if (!storageService && !mediafireUrl) {
        throw new Error("Debes seleccionar un servicio de almacenamiento y agregar la URL");
    }

    if (!termsCheckbox.checked) {
        throw new Error("Debes aceptar los términos y condiciones");
    }

    if (pricing === "pago" && (!price || price <= 0)) {
        throw new Error("Debes establecer un precio válido para juegos de pago");
    }

    return true;
}

// =========================
// MAPEAR VALORES AL INGLÉS
// =========================
function mapearValoresAlIngles(valor) {
    const mapeo = {
        // Categorías
        'aventura': 'adventure',
        'rpg': 'rpg',
        'acción': 'action',
        'puzzle': 'puzzle',
        'terror': 'horror',
        'otro': 'other',
        
        // Géneros principales
        'no-genero': 'no-genre',
        'aventura': 'adventure',
        'rpg': 'rpg',
        'acción': 'action',
        'puzzle': 'puzzle',
        'terror': 'horror',
        'otro': 'other',
        
        // Precios
        'gratis': 'free',
        'pago': 'paid',
        'donacion': 'donation'
    };
    
    return mapeo[valor] || valor;
}

// =========================
// SUBIR JUEGO - FUNCIÓN PRINCIPAL
// =========================
async function subirJuego() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Debes iniciar sesión para subir un juego");
            window.location.href = "index.html";
            return;
        }

        const userId = document.getElementById("user-id").value;
        if (!userId || userId === "0") {
            alert("Error: No se pudo obtener el ID del usuario. Recarga la página.");
            return;
        }

        console.log("Subiendo juego para usuario ID:", userId);

        // Validar formulario primero
        validarFormulario();

        // Obtener datos del formulario y mapear al inglés
        const formData = {
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("description").value.trim(),
            category: mapearValoresAlIngles(document.getElementById("category").value),
            main_genre: mapearValoresAlIngles(document.getElementById("main_genre").value),
            genres: document.getElementById("genres").value,
            
            // Requisitos mínimos
            min_os: document.getElementById("min_os").value || null,
            min_cpu: document.getElementById("min_cpu").value || null,
            min_ram: document.getElementById("min_ram").value || null,
            min_gpu: document.getElementById("min_gpu").value || null,
            min_storage: document.getElementById("min_storage").value || null,
            
            // Requisitos recomendados
            rec_os: document.getElementById("rec_os").value || null,
            rec_cpu: document.getElementById("rec_cpu").value || null,
            rec_ram: document.getElementById("rec_ram").value || null,
            rec_gpu: document.getElementById("rec_gpu").value || null,
            rec_storage: document.getElementById("rec_storage").value || null,
            
            // Multimedia
            youtube_url: document.getElementById("youtube_url").value || null,
            storage_service: document.getElementById("storage-service").value || null,
            mediafire_url: document.getElementById("mediafire-url").value || null,
            
            // Precio
            pricing: mapearValoresAlIngles(document.getElementById("pricing").value),
            price: document.getElementById("pricing").value === "pago" ? 
                   parseFloat(document.getElementById("price").value) : 0.0,
            
            // Términos
            terms_accepted: document.getElementById("terms").checked
        };

        console.log("Datos del formulario mapeados:", formData);

        // Convertir archivos a base64
        const coverInput = document.getElementById("cover");
        if (coverInput.files[0]) {
            console.log("Convirtiendo portada a base64...");
            formData.cover_base64 = await fileToBase64(coverInput.files[0]);
        }

        const screenshotsInput = document.getElementById("screenshots");
        if (screenshotsInput.files && screenshotsInput.files.length > 0) {
            console.log("Convirtiendo capturas a base64...");
            formData.screenshots_base64 = [];
            for (let i = 0; i < screenshotsInput.files.length; i++) {
                const base64 = await fileToBase64(screenshotsInput.files[i]);
                formData.screenshots_base64.push(base64);
            }
        }

        // Mostrar loading
        const submitBtn = document.querySelector('button[onclick="subirJuego()"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        submitBtn.disabled = true;

        // Enviar datos al servidor
        console.log("Enviando datos al servidor...", formData);
        const response = await fetch("http://localhost:3001/api/juegos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log("Respuesta del servidor:", result);

        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (result.ok) {
            alert("¡Juego publicado con éxito! 🎮\nID del juego: " + result.id);
            // Limpiar formulario
            document.getElementById("upload-form").reset();
            // Redirigir a la página de mis juegos
            window.location.href = "marketplace.html";
        } else {
            throw new Error(result.error || "Error al subir el juego");
        }

    } catch (error) {
        console.error("Error subiendo juego:", error);
        alert(`Error: ${error.message}`);
        
        // Restaurar botón en caso de error
        const submitBtn = document.querySelector('button[onclick="subirJuego()"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Publicar Juego';
            submitBtn.disabled = false;
        }
    }
}

// =========================
// MANEJO DE ERRORES GLOBAL
// =========================
window.addEventListener("error", function(e) {
    console.error("Error global:", e.error);
});