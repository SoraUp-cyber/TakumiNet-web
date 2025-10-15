// Obtener elementos
const chatbot = document.getElementById('chatbot');
const toggleBtn = document.getElementById('chatbot-toggle');
const input = document.getElementById('chatbot-input');
const messages = document.getElementById('chatbot-messages');

// Abrir/cerrar chatbot
toggleBtn.addEventListener('click', () => {
  chatbot.classList.toggle('active');
  // Saludo inicial al abrir por primera vez
  if (chatbot.classList.contains('active') && messages.children.length === 0) {
    const botMsg = document.createElement('div');
    botMsg.classList.add('message');
    botMsg.textContent = "¡Hola! Soy TakiNeko 🤖, ¿en qué te puedo ayudar?";
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }
});

// Diccionario de palabras clave y respuestas
const respuestas = {
 "pago": "Para realizar un pago, haz clic en el ícono de tu perfil de usuario. Se desplegará el ícono de pagos. Al hacer clic en él, serás llevado a la página de pagos, donde podrás conectar tu cuenta bancaria, completar los datos y confirmar la transacción.",
  "hola": "¡Hola! ¿Cómo estás hoy?",
  "ayuda": "Claro, dime en qué necesitas ayuda y te responderé lo antes posible.",
  "subir_juegos": "Para subir un juego, haz clic en el ícono de tu perfil y selecciona 'Subir juegos'. Se abrirá la página de carga, donde podrás agregar los archivos del juego, completar la información requerida y publicar tu juego.",
  "correo": "Para contactarnos, haz clic aquí: takuminetapp@gmail.com Enviar correo",
  "subir_juego_pago": "Si quieres subir tu juego y recibir pagos, primero agrega tu cuenta bancaria. Luego, haz clic en el ícono de tu perfil, selecciona 'Subir juegos', completa los datos del juego y publica. Así podrás recibir los pagos directamente en tu cuenta."
  
};

// Función para manejar mensaje del usuario
function enviarMensaje() {
  const texto = input.value.trim();
  if (texto === "") return;

  // Mensaje del usuario
  const userMsg = document.createElement('div');
  userMsg.classList.add('message', 'user');
  userMsg.textContent = texto;
  messages.appendChild(userMsg);
  messages.scrollTop = messages.scrollHeight;

  // Respuesta del bot
  const botMsg = document.createElement('div');
  botMsg.classList.add('message');

  // Verificar palabras clave
  let encontrada = false;
  for (let palabra in respuestas) {
    if (texto.toLowerCase().includes(palabra)) {
      botMsg.textContent = respuestas[palabra];
      encontrada = true;
      break;
    }
  }

  if (!encontrada) {
    botMsg.textContent = "Lo siento, no entendí tu solicitud. Prueba con palabras clave como 'pago'.";
  }

  // Simular pequeño retraso en la respuesta
  setTimeout(() => {
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  }, 500);

  input.value = "";
}

// Escuchar Enter
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    enviarMensaje();
  }
});

