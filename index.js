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

  const fmt = (s) => {
    if (s == null) return "—";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const connected = client.isReady();
  const guilds = client.guilds?.cache?.size ?? 0;

  res.type("html").send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Discord Bot</title>
      <style>
        :root{
          --bg1:#0b1220;
          --bg2:#111a2e;
          --card:#0f172a;
          --card2:#0b1220;
          --text:#e5e7eb;
          --muted:#9ca3af;
          --border:rgba(255,255,255,.08);
          --ok:#22c55e;
          --bad:#ef4444;
          --accent:#7c3aed;
          --accent2:#06b6d4;
        }

        *{ box-sizing:border-box; }
        body{
          margin:0;
          min-height:100vh;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
          color:var(--text);
          background:
            radial-gradient(1000px 500px at 20% 10%, rgba(124,58,237,.35), transparent 60%),
            radial-gradient(900px 500px at 80% 20%, rgba(6,182,212,.25), transparent 60%),
            linear-gradient(180deg, var(--bg1), var(--bg2));
          display:flex;
          align-items:center;
          justify-content:center;
          padding:24px;
        }

        .wrap{ width:min(920px, 100%); }

        .header{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          margin-bottom:16px;
        }

        .title{
          display:flex;
          align-items:center;
          gap:12px;
        }

        .logo{
          width:44px;
          height:44px;
          border-radius:14px;
          background: linear-gradient(135deg, rgba(124,58,237,.9), rgba(6,182,212,.9));
          box-shadow: 0 10px 30px rgba(0,0,0,.35);
        }

        h1{
          font-size:18px;
          line-height:1.2;
          margin:0;
        }
        .subtitle{
          margin:2px 0 0;
          color:var(--muted);
          font-size:13px;
        }

        .badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:8px 12px;
          border-radius:999px;
          background: rgba(255,255,255,.06);
          border:1px solid var(--border);
          font-size:13px;
          color: var(--text);
          white-space:nowrap;
        }
        .dot{
          width:10px;height:10px;border-radius:999px;
          background:${connected ? "var(--ok)" : "var(--bad)"};
          box-shadow: 0 0 0 4px ${connected ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)"};
        }

        .card{
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          border:1px solid var(--border);
          border-radius:18px;
          box-shadow: 0 20px 60px rgba(0,0,0,.35);
          overflow:hidden;
        }

        .grid{
          display:grid;
          grid-template-columns: repeat(12, 1fr);
          gap:14px;
          padding:18px;
        }

        .stat{
          grid-column: span 6;
          background: rgba(15,23,42,.55);
          border:1px solid var(--border);
          border-radius:14px;
          padding:14px;
        }
        @media (min-width: 760px){
          .stat{ grid-column: span 3; }
        }
        .label{
          color:var(--muted);
          font-size:12px;
          margin-bottom:6px;
        }
        .value{
          font-size:16px;
          font-weight:700;
          letter-spacing:.2px;
        }

        .actions{
          padding:16px 18px 18px;
          border-top:1px solid var(--border);
          display:flex;
          flex-wrap:wrap;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          background: rgba(15,23,42,.35);
        }

        .btn{
          appearance:none;
          border:1px solid var(--border);
          background: linear-gradient(135deg, rgba(124,58,237,.85), rgba(6,182,212,.7));
          color:white;
          padding:10px 14px;
          border-radius:12px;
          font-weight:700;
          cursor:pointer;
          box-shadow: 0 12px 30px rgba(0,0,0,.3);
          transition: transform .08s ease, filter .15s ease;
        }
        .btn:hover{ filter:brightness(1.05); }
        .btn:active{ transform: translateY(1px); }

        .hint{
          color:var(--muted);
          font-size:12px;
          line-height:1.35;
          max-width:560px;
        }

        .toast{
          display:none;
          margin-top:14px;
          padding:12px 14px;
          border-radius:14px;
          border:1px solid var(--border);
          background: rgba(0,0,0,.25);
          color: var(--text);
          font-size:13px;
        }
        .toast.show{ display:block; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="header">
          <div class="title">
            <div class="logo" aria-hidden="true"></div>
            <div>
              <h1>Discord Bot Status</h1>
              <div class="subtitle">Simple health page for your container</div>
            </div>
          </div>

          <div class="badge" title="Discord connection status">
            <span class="dot" aria-hidden="true"></span>
            <span><b>${connected ? "Connected" : "Not connected"}</b></span>
          </div>
        </div>

        <div class="card">
          <div class="grid">
            <div class="stat">
              <div class="label">Uptime</div>
              <div class="value">${fmt(uptimeSec)}</div>
            </div>

            <div class="stat">
              <div class="label">Since Ready</div>
              <div class="value">${readySec === null ? "Not ready yet" : fmt(readySec)}</div>
            </div>

            <div class="stat">
              <div class="label">Guilds</div>
              <div class="value">${guilds}</div>
            </div>

            <div class="stat">
              <div class="label">Web Port</div>
              <div class="value">${port}</div>
            </div>
          </div>

          <div class="actions">
            <button class="btn" onclick="restart()">Restart bot</button>
            <div class="hint">
              Restart will exit the process so Docker/Unraid restarts the container.
              <br/>If <code>WEB_KEY</code> is set, include header <code>x-api-key</code> to access this page.
            </div>
          </div>
        </div>

        <div id="toast" class="toast"></div>
      </div>

      <script>
        const toast = document.getElementById("toast");
        function showToast(msg){
          toast.textContent = msg;
          toast.classList.add("show");
          setTimeout(()=>toast.classList.remove("show"), 3500);
        }

        async function restart(){
          const ok = confirm("Restart bot? Docker will bring it back up automatically.");
          if(!ok) return;

          try {
            const r = await fetch("/restart", { method: "POST" });
            const t = await r.text();
            showToast(t || "Restarting…");
          } catch (e){
            showToast("Request failed: " + (e?.message || e));
          }
        }
      </script>
    </body>
  </html>`);
});


app.post("/restart", (req, res) => {
  res.send("Restarting...");
  // giver respons først, og lukker så processen
  setTimeout(() => process.exit(0), 300);
});

app.listen(port, () => console.log(`🌐 Web UI listening on :${port}`));
