document.addEventListener('DOMContentLoaded', () => {
  // ==========================
  // PAYPAL LOGIN
  // ==========================
  const paypalButton = document.getElementById('connectPayPal');
  if (paypalButton) {
    paypalButton.addEventListener('click', function(e) {
      e.preventDefault();

      const clientId = 'AaVT5Wtj5NoNpg6BVlcDSyE0vPXJ7Cs5A1ZQkOPY7pQYXvTLbp6Uf5HTsn4J0_Ulz0CbBEwvGRk5eMea';
      const redirectUri = encodeURIComponent('https://soraup-cyber.github.io/TakumiNet-web/paypal/callback');
      const state = encodeURIComponent(JSON.stringify({
        user_id: 12345,
        return_to: '/dashboard/payouts',
        time: Date.now()
      }));

      const scope = encodeURIComponent('openid profile email');
      const responseType = 'code';

      const paypalUrl = `https://www.sandbox.paypal.com/signin/authorize?scope=${scope}&response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;

      window.open(paypalUrl, '_blank', 'width=600,height=700');
      console.log('Redirigiendo a PayPal Sandbox para pruebas...');
    });
  }

  // ==========================
  // PAYONEER CONNECT
  // ==========================
  const payoneerForm = document.querySelector('form.form');
  if (payoneerForm) {
    const button = payoneerForm.querySelector('button');

    // Crear contenedor para mensajes
    const message = document.createElement('span');
    message.style.marginLeft = '10px';
    message.style.fontWeight = 'bold';
    button.after(message);

    payoneerForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Evita envío real para prueba

      button.disabled = true;
      button.textContent = 'Conectando... 🔄';

      // Simular proceso de conexión (2 segundos)
      setTimeout(() => {
        button.textContent = 'Conectado ✅💸✨';
        message.textContent = '¡Tu cuenta Payoneer está lista!';
        message.style.color = 'green';
      }, 2000);
    });
  }
});