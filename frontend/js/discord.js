document.addEventListener("DOMContentLoaded", () => {
  const discordBtn = document.getElementById("discordBtn");

  discordBtn.addEventListener("click", () => {
    const CLIENT_ID = "1397287228744532162"; // tu client ID real
    const REDIRECT_URI = "https://takuminet-app.netlify.app/discord-callback.html"; // la página de callback
    const SCOPES = "identify email";

    const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(SCOPES)}`;

    window.location.href = DISCORD_AUTH_URL;
  });
});
