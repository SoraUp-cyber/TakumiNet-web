document.getElementById("discordBtn").addEventListener("click", () => {
  const clientId = "1397287228744532162"; // 🔹 Reemplaza con tu client_id de Discord
  const redirectUri = encodeURIComponent("http://localhost:3001/auth/discord/callback"); // 🔹 URL de tu callback (debes registrarla en Discord Developer Portal)
  const responseType = "code";
  const scope = "identify email"; // Permisos básicos del usuario

  // Construye la URL de autorización de Discord
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;

  // Redirige al usuario al login de Discord
  window.location.href = discordAuthUrl;
});
