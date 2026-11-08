import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import { readConfig } from "./src/config.js";
import { createDashboard } from "./src/dashboard.js";
import { handleMessage } from "./src/messages.js";

async function main() {
  const config = readConfig();
  const startedAt = Date.now();
  let lastReadyAt = null;
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });
  let stopping = false;
  let server;
  function shutdown(code) {
    if (stopping) return;
    stopping = true;
    process.exitCode = code;
    const deadline = setTimeout(() => process.exit(process.exitCode ?? code), 10_000);
    deadline.unref();
    // Wait for both Discord disconnection and the final HTTP response to drain.
    const disconnected = Promise.resolve().then(() => client.destroy());
    const closed = new Promise((resolve) => {
      if (server) server.close(resolve);
      else resolve();
    });
    void Promise.all([disconnected, closed]).then(() => clearTimeout(deadline)).catch(() => {
      console.error("Shutdown failed; forcing exit after the timeout.");
      process.exitCode = 1;
    });
  }
  client.on(Events.ClientReady, () => {
    lastReadyAt = Date.now();
    console.log("Discord bot connected.");
  });
  client.on(Events.Error, () => console.error("Discord connection error; check connectivity and bot configuration."));
  client.on(Events.MessageCreate, (message) => { void handleMessage(message); });
  const app = createDashboard({
    webKey: config.webKey,
    port: config.port,
    getStatus: () => ({
      connected: client.isReady(),
      guilds: client.guilds.cache.size,
      uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
      readySec: lastReadyAt === null ? null : Math.floor((Date.now() - lastReadyAt) / 1000),
    }),
    onRestart: () => shutdown(0),
  });
  server = app.listen(config.port, config.host, () =>
    console.log("Web panel listening on configured HOST and PORT."));
  server.on("error", () => {
    console.error("Web panel could not listen; check HOST, PORT and port availability.");
    shutdown(1);
  });
  process.once("SIGTERM", () => shutdown(0));
  process.once("SIGINT", () => shutdown(0));
  try {
    await client.login(config.token);
  } catch {
    console.error("Discord login failed; check DISCORD_TOKEN and Message Content Intent.");
    shutdown(1);
  }
}

main().catch(() => {
  console.error("Startup failed. Check DISCORD_TOKEN, WEB_KEY (at least 24 characters), HOST and PORT.");
  process.exitCode = 1;
});
