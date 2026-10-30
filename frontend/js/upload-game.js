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
        const res = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/user", {
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

        document.getElementById("username").textContent = user.username || "Usuario";
        document.getElementById("user-id-display").textContent = userId;
        document.getElementById("user-id").value = userId;

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
    const coverInput = document.getElementById("cover");
    if (coverInput) {
        coverInput.addEventListener("change", handleCoverPreview);
    }

    const screenshotsInput = document.getElementById("screenshots");
    if (screenshotsInput) {
        screenshotsInput.addEventListener("change", handleScreenshotsPreview);
    }

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

    const removeCoverBtn = document.getElementById("remove-cover");
    if (removeCoverBtn) {
        removeCoverBtn.addEventListener("click", removeCover);
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeMediaFireModal();
            closeExternalLinkModal();
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

    imgPreview.style.display = "none";
    videoPreview.style.display = "none";
    removeBtn.style.display = "none";

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
        alert("El archivo es demasiado grande. Máximo 25MB permitidos.");
        event.target.value = "";
        return;
    }

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm'];
    
    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
        alert("Formato de archivo no válido. Use JPG, PNG, GIF, MP4 o WebM.");
        event.target.value = "";
        return;
    }

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

        if (file.size > 25 * 1024 * 1024) {
            alert(`La imagen "${file.name}" es demasiado grande. Máximo 25MB por imagen.`);
            continue;
        }

        if (validFiles >= 8) {
            alert("Máximo 8 capturas permitidas. Las imágenes adicionales serán ignoradas.");
            break;
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
            
            const sizeInfo = document.createElement("div");
            sizeInfo.classList.add("screenshot-size");
            sizeInfo.textContent = formatFileSize(file.size);
            container.appendChild(sizeInfo);
            
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

    const counter = document.createElement("div");
    counter.textContent = `Capturas seleccionadas: ${validFiles}/1 mínimo, 8 máximo`;
    counter.classList.add("screenshot-counter");
    previewContainer.appendChild(counter);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

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

function updateScreenshotCounter() {
    const previewContainer = document.getElementById("screenshots-preview");
    const counters = previewContainer.getElementsByClassName("screenshot-counter");
    const screenshotItems = previewContainer.getElementsByClassName("screenshot-item");
    
    if (counters.length > 0) {
        counters[0].textContent = `Capturas seleccionadas: ${screenshotItems.length}/1 mínimo, 8 máximo`;
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
// SISTEMA DE ALMACENAMIENTO: MediaFire + Enlace externo
// =========================
let mediaFireLink = "";
let externalLink = "";

// ---------- MEDIAFIRE ----------
function openMediaFireModal() {
    document.getElementById("mediafire-modal").style.display = "flex";
    document.getElementById("mediafire-url").value = mediaFireLink || "";
}

function closeMediaFireModal() {
    document.getElementById("mediafire-modal").style.display = "none";
}

function saveMediaFireLink() {
    const url = document.getElementById("mediafire-url").value.trim();

    if (!url) {
        alert("⚠️ Debes pegar un enlace de MediaFire válido.");
        return;
    }
    if (!/^https?:\/\//i.test(url)) {
        alert("⚠️ El enlace debe comenzar con http:// o https://");
        return;
    }
    if (!/mediafire\.com/i.test(url)) {
        if (!confirm("El enlace no parece ser de MediaFire. ¿Deseas continuar igualmente?")) return;
    }

    mediaFireLink = url;
    document.getElementById("mediafire-url-hidden").value = url;
    document.getElementById("storage-service").value = "mediafire";
    externalLink = "";
    document.getElementById("external-download-url").value = "";

    const mediafireBtn = document.querySelector('.storage-btn-green');
    if (mediafireBtn) {
        mediafireBtn.innerHTML = '<i class="fa fa-check"></i> MediaFire (URL agregada)';
        mediafireBtn.style.background = "#28a745";
    }

    const externalBtn = document.querySelector('.storage-btn-blue');
    if (externalBtn) {
        externalBtn.innerHTML = '<i class="fa fa-link"></i> Enlace externo';
        externalBtn.style.background = "";
    }

    showStorageStatus(`✅ Enlace de MediaFire guardado: <a href="${url}" target="_blank" rel="noopener">${url}</a>`);
    closeMediaFireModal();
}

// ---------- ENLACE EXTERNO ----------
function openExternalLinkModal() {
    document.getElementById("external-link-modal").style.display = "flex";
    document.getElementById("external-url").value = externalLink || "";
}

function closeExternalLinkModal() {
    document.getElementById("external-link-modal").style.display = "none";
}

function saveExternalLink() {
    const url = document.getElementById("external-url").value.trim();

    if (!url) {
        alert("⚠️ Debes pegar un enlace de descarga válido.");
        return;
    }
    try {
        new URL(url);
    } catch {
        alert("⚠️ El enlace no es válido. Asegúrate de incluir https://");
        return;
    }

    externalLink = url;
    document.getElementById("external-download-url").value = url;
    document.getElementById("storage-service").value = "external";
    mediaFireLink = "";
    document.getElementById("mediafire-url-hidden").value = "";

    const externalBtn = document.querySelector('.storage-btn-blue');
    if (externalBtn) {
        externalBtn.innerHTML = '<i class="fa fa-check"></i> Enlace externo (URL agregada)';
        externalBtn.style.background = "#28a745";
    }

    const mediafireBtn = document.querySelector('.storage-btn-green');
    if (mediafireBtn) {
        mediafireBtn.innerHTML = '<i class="fa fa-cloud-download"></i> MediaFire';
        mediafireBtn.style.background = "";
    }

    showStorageStatus(`✅ Enlace externo guardado: <a href="${url}" target="_blank" rel="noopener">${url}</a>`);
    closeExternalLinkModal();
}

// ---------- ESTADO VISUAL ----------
function showStorageStatus(html) {
    const el = document.getElementById("storage-status");
    el.innerHTML = html;
    el.style.display = "block";
}

// ---------- CERRAR MODALES AL HACER CLIC FUERA ----------
window.addEventListener('click', function(event) {
    const mf = document.getElementById("mediafire-modal");
    const ext = document.getElementById("external-link-modal");
    if (event.target === mf) closeMediaFireModal();
    if (event.target === ext) closeExternalLinkModal();
});

// ---------- VALIDAR ALMACENAMIENTO ----------
function validarAlmacenamiento() {
    const storage = document.getElementById("storage-service").value;
    const mediafire = document.getElementById("mediafire-url-hidden").value.trim();
    const external = document.getElementById("external-download-url").value.trim();

    if (!storage) {
        alert("⚠️ Debes seleccionar dónde se alojará tu juego: MediaFire o Enlace externo.");
        return false;
    }
    if (storage === "mediafire" && !mediafire) {
        alert("⚠️ Debes agregar un enlace de MediaFire.");
        return false;
    }
    if (storage === "external" && !external) {
        alert("⚠️ Debes agregar un enlace externo de descarga.");
        return false;
    }
    return true;
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
    const termsCheckbox = document.getElementById("terms");
    const pricing = document.getElementById("pricing").value;
    const price = document.getElementById("price").value;

    if (!title || title.length < 3) {
        throw new Error("El título debe tener al menos 3 caracteres");
    }

    if (!description || description.length < 10) {
        throw new Error("La descripción debe tener al menos 10 caracteres");
    }

    if (!screenshotsInput.files || screenshotsInput.files.length < 1) {
        throw new Error("Debes subir al menos 1 captura del juego");
    }

    if (screenshotsInput.files.length > 8) {
        throw new Error("Máximo 8 capturas permitidas");
    }

    if (screenshotsInput.files) {
        for (let i = 0; i < screenshotsInput.files.length; i++) {
            const file = screenshotsInput.files[i];
            if (file.size > 25 * 1024 * 1024) {
                throw new Error(`La captura "${file.name}" es demasiado grande. Máximo 25MB por imagen.`);
            }
        }
    }

    if (!coverInput.files || coverInput.files.length === 0) {
        throw new Error("Debes subir una portada para el juego");
    }

    if (coverInput.files[0].size > 25 * 1024 * 1024) {
        throw new Error("La portada es demasiado grande. Máximo 25MB permitidos.");
    }

    if (!validarAlmacenamiento()) {
        throw new Error("Debes agregar un enlace de descarga (MediaFire o externo).");
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
        'aventura': 'adventure',
        'rpg': 'rpg',
        'acción': 'action',
        'puzzle': 'puzzle',
        'terror': 'horror',
        'otro': 'other',
        'no-genero': 'no-genre',
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
            window.location.href = "login.html";
            return;
        }

        const userId = document.getElementById("user-id").value;
        if (!userId || userId === "0") {
            alert("Error: No se pudo obtener el ID del usuario. Recarga la página.");
            return;
        }

        console.log("Subiendo juego para usuario ID:", userId);

        validarFormulario();

        const formData = {
            title: document.getElementById("title").value.trim(),
            description: document.getElementById("description").value.trim(),
            category: mapearValoresAlIngles(document.getElementById("category").value),
            main_genre: mapearValoresAlIngles(document.getElementById("main_genre").value),
            genres: document.getElementById("genres").value,
            
            min_os: document.getElementById("min_os").value || null,
            min_cpu: document.getElementById("min_cpu").value || null,
            min_ram: document.getElementById("min_ram").value || null,
            min_gpu: document.getElementById("min_gpu").value || null,
            min_storage: document.getElementById("min_storage").value || null,
            
            rec_os: document.getElementById("rec_os").value || null,
            rec_cpu: document.getElementById("rec_cpu").value || null,
            rec_ram: document.getElementById("rec_ram").value || null,
            rec_gpu: document.getElementById("rec_gpu").value || null,
            rec_storage: document.getElementById("rec_storage").value || null,
            
            youtube_url: document.getElementById("youtube_url").value || null,
            storage_service: document.getElementById("storage-service").value || null,
            mediafire_url: document.getElementById("mediafire-url-hidden").value || null,
            external_download_url: document.getElementById("external-download-url").value || null,
            
            pricing: mapearValoresAlIngles(document.getElementById("pricing").value),
            price: document.getElementById("pricing").value === "pago" ? 
                   parseFloat(document.getElementById("price").value) : 0.0,
            
            terms_accepted: document.getElementById("terms").checked
        };

        console.log("Datos del formulario mapeados:", formData);

        const submitBtn = document.querySelector('button[onclick="subirJuego()"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        submitBtn.disabled = true;

        const coverInput = document.getElementById("cover");
        if (coverInput.files[0]) {
            console.log("Convirtiendo portada a base64...");
            console.log("Tamaño portada:", formatFileSize(coverInput.files[0].size));
            try {
                formData.cover_base64 = await fileToBase64(coverInput.files[0]);
                console.log("Portada convertida correctamente");
            } catch (error) {
                throw new Error("Error al procesar la portada: " + error.message);
            }
        }

        const screenshotsInput = document.getElementById("screenshots");
        if (screenshotsInput.files && screenshotsInput.files.length > 0) {
            console.log("Convirtiendo", screenshotsInput.files.length, "capturas a base64...");
            formData.screenshots_base64 = [];
            
            for (let i = 0; i < screenshotsInput.files.length; i++) {
                const file = screenshotsInput.files[i];
                console.log(`Procesando captura ${i + 1}:`, formatFileSize(file.size));
                
                try {
                    const base64 = await fileToBase64(file);
                    formData.screenshots_base64.push(base64);
                    console.log(`✅ Captura ${i + 1} convertida`);
                } catch (error) {
                    throw new Error(`Error al procesar la captura ${i + 1}: ${error.message}`);
                }
            }
            console.log("Todas las capturas convertidas correctamente");
        }

        console.log("Enviando datos al servidor...");
        const response = await fetch("https://distinct-oralla-takumi-net-0d317399.koyeb.app/api/juegos", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log("Respuesta del servidor:", result);

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (result.ok) {
            alert("¡Juego publicado con éxito! 🎮\nID del juego: " + result.id);
            document.getElementById("upload-form").reset();
            removeCover();
            document.getElementById("screenshots-preview").innerHTML = "";
            window.location.href = "marketplace.html";
        } else {
            throw new Error(result.error || "Error al subir el juego");
        }

    } catch (error) {
        console.error("Error subiendo juego:", error);
        alert(`Error: ${error.message}`);
        
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

// =========================
// ESTILOS CSS DINÁMICOS
// =========================
const dynamicStyles = `
.screenshot-size {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    z-index: 2;
}

.screenshot-item {
    position: relative;
}

.screenshot-preview {
    max-width: 150px;
    max-height: 100px;
    object-fit: cover;
    border-radius: 5px;
}

.upload-progress {
    margin: 10px 0;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
    display: none;
}

.progress-bar {
    height: 20px;
    background: #007bff;
    border-radius: 10px;
    transition: width 0.3s ease;
}
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);
