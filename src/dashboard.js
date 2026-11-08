import express from "express";
import { createHash, timingSafeEqual } from "node:crypto";

function matches(candidate, expected) {
  if (typeof candidate !== "string") return false;
  const digest = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}

export function createDashboard({ webKey, port, getStatus, onRestart }) {
  if (typeof webKey !== "string" || webKey.length < 24)
    throw new Error("WEB_KEY must contain at least 24 characters.");
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    });
    next();
  });
  // Liveness only: no Discord metadata and no restart capability.
  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  app.use((req, res, next) => {
    let password;
    const authorization = req.get("authorization") || "";
    if (authorization.startsWith("Basic ")) {
      const decoded = Buffer.from(authorization.slice(6), "base64").toString("utf8");
      const separator = decoded.indexOf(":");
      if (decoded.slice(0, separator) === "admin") password = decoded.slice(separator + 1);
    }
    if (matches(req.get("x-api-key"), webKey) || matches(password, webKey)) return next();
    res.set("WWW-Authenticate", 'Basic realm="Discord Bot", charset="UTF-8"');
    return res.status(401).send("Authentication required.");
  });
  app.get("/api/status", (_req, res) => res.json(getStatus()));
app.get("/", (req, res) => {
  const { uptimeSec, readySec, connected, guilds } = getStatus();


  const fmt = (s) => {
    if (s == null) return "—";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };




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
              <br/>Sign in as <code>admin</code> using your <code>WEB_KEY</code>. Keep this panel private.
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
            const r = await fetch("/restart", { method: "POST", headers: { "X-Requested-With": "discord-bot" } });
            const t = await r.text();
            if (!r.ok) throw new Error(t || "Restart rejected");
            showToast(t || "Restarting…");
          } catch (e){
            showToast("Request failed: " + (e?.message || e));
          }
        }
      </script>
    </body>
  </html>`);
});


  let restarting = false;
  app.post("/restart", (req, res) => {
    // Cross-site HTML forms cannot set this header; no CORS permission is granted.
    if (req.get("x-requested-with") !== "discord-bot")
      return res.status(403).send("Restart requires X-Requested-With: discord-bot.");
    if (restarting) return res.status(409).send("Restart already requested.");
    restarting = true;
    res.once("finish", () => { onRestart(); });
    return res.status(202).send("Restarting...");
  });
  return app;
}
