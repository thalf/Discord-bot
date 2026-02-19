import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import express from "express";

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN is missing (set it as an environment variable).");
  process.exit(1);
}

const startedAt = Date.now();
let lastReadyAt = null;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  lastReadyAt = Date.now();
  console.log(`✅ Logged in as ${c.user.tag}`);
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (msg.content === "!ping") msg.reply("pong 🏓");
});

client.login(process.env.DISCORD_TOKEN);

// ---- WEB UI ----
const app = express();
const port = Number(process.env.PORT || 3000);

// Simple “auth” med en key (valgfri men stærkt anbefalet)
const apiKey = process.env.WEB_KEY; // sæt i Unraid env var
app.use((req, res, next) => {
  if (!apiKey) return next(); // hvis du ikke sætter WEB_KEY, er den åben
  if (req.headers["x-api-key"] !== apiKey) return res.status(401).send("Unauthorized");
  next();
});

app.get("/", (req, res) => {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  const readySec = lastReadyAt ? Math.floor((Date.now() - lastReadyAt) / 1000) : null;

  res.type("html").send(`
  <html>
    <head><meta charset="utf-8"><title>Discord Bot</title></head>
    <body style="font-family: sans-serif; padding: 16px;">
      <h2>Discord Bot Status</h2>
      <ul>
        <li><b>Connected:</b> ${client.isReady()}</li>
        <li><b>Uptime:</b> ${uptimeSec}s</li>
        <li><b>Since Ready:</b> ${readySec === null ? "not ready yet" : readySec + "s"}</li>
        <li><b>Guilds:</b> ${client.guilds?.cache?.size ?? 0}</li>
        <li><b>Web Port:</b> ${port}</li>
      </ul>

      <h3>Actions</h3>
      <button onclick="restart()">Restart bot</button>
      <p style="color:#666;">(Restart = processen lukker, Docker starter den igen)</p>

      <script>
        async function restart(){
          const r = await fetch("/restart", { method: "POST" });
          alert(await r.text());
        }
      </script>
    </body>
  </html>
  `);
});

app.post("/restart", (req, res) => {
  res.send("Restarting...");
  // giver respons først, og lukker så processen
  setTimeout(() => process.exit(0), 300);
});

app.listen(port, () => console.log(`🌐 Web UI listening on :${port}`));
