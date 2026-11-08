# Discord Bot · Docker & Unraid

A small, self-hosted Discord bot with an authenticated browser panel. Check its connection, uptime and server count, or restart the container without opening a terminal.

The included command is **`!ping` → `pong 🏓`**. This is a starter bot for a homelab, not a moderation or music bot.

[![Checks](https://github.com/thalf/Discord-bot/actions/workflows/checks.yml/badge.svg)](https://github.com/thalf/Discord-bot/actions/workflows/checks.yml)
[Docker Hub](https://hub.docker.com/r/thalf/discord-bot) · [Unraid template](unraid/discord-bot.xml) · [MIT license](LICENSE)

## Before you start

- Docker Engine with Docker Compose v2, or **Node.js 24+** and npm for local use.
- A Discord application and bot token from the [Developer Portal](https://discord.com/developers/applications).
- Enable **Message Content Intent** on the application's **Bot** page. The bot requests Guilds, Guild Messages and Message Content so it can recognize `!ping`. See [Discord's intent documentation](https://docs.discord.com/developers/events/gateway#gateway-intents).
- Install the bot to your own server using the `bot` scope and only **View Channels**, **Send Messages** and **Read Message History**. Administrator permission is unnecessary.
- A separate, randomly generated **WEB_KEY of at least 24 characters** for the dashboard.

> [!WARNING]
> **Breaking security change:** WEB_KEY is now required. Older deployments that omit it or use a short key must set a new one before upgrading. Browser login uses username **admin** and WEB_KEY as the password.
>
> Keep the panel on localhost or behind a VPN/authenticated HTTPS reverse proxy. Basic authentication does not encrypt credentials over HTTP. Never forward the panel directly to the public internet.

## Quick start: build the reviewed source

The published `thalf/discord-bot:latest` image may not contain these source changes. The supplied Compose file builds locally, rather than assuming the published image has been updated.

```sh
git clone https://github.com/thalf/Discord-bot.git
cd Discord-bot
cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Without Node.js installed, generate the password with your password manager.

1. Edit `.env`: set `DISCORD_TOKEN` to your bot token and `WEB_KEY` to the generated password. Keep this file private.
2. Run `docker compose up -d --build`.
3. Open [http://localhost:3000](http://localhost:3000) on the Docker host. Sign in as **admin** with WEB_KEY.
4. Send `!ping` in a server text channel the bot can read and reply in.
5. Inspect logs with `docker compose logs -f bot`.

The port is published on **127.0.0.1** by default. For a remote Docker host, use an SSH tunnel or your existing VPN/reverse proxy. Change the host port in Compose if 3000 is already occupied. Avoid running two instances with the same token; they can send duplicate replies.

### What the panel does

- Shows current Discord readiness, process uptime, time since the last ready event and guild count.
- Provides a confirmed **Restart bot** action. It drains the response, disconnects from Discord and exits; Docker/Unraid's `unless-stopped` restart policy brings it back.
- Exposes authenticated `GET /api/status` for monitoring.
- Exposes unauthenticated `GET /healthz` with only `{"status":"ok"}`. This checks HTTP liveness, **not** Discord readiness. Docker does not automatically restart a container merely because its health check fails.

Restarting with `npm start` stops the process; start it again manually.

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DISCORD_TOKEN` | Yes | — | Discord bot token; never use a user account token |
| `WEB_KEY` | Yes | — | Dashboard/API password, at least 24 characters, no surrounding whitespace |
| `HOST` | No | `127.0.0.1` locally | Listen address; Docker/Compose use `0.0.0.0` inside the container |
| `PORT` | No | `3000` | Application port, integer 1–65535; Compose fixes the container port to 3000 |

Browser authentication uses HTTP Basic. API clients can instead send `x-api-key: <WEB_KEY>`. A restart additionally requires `X-Requested-With: discord-bot`; cross-site HTML forms cannot set that header. Never put either secret in a URL, screenshot, Git commit or support request.

## Unraid

The [template](unraid/discord-bot.xml) targets the published image. Set both masked fields, **Discord Bot Token** and **Web Panel Password**; the latter must have at least 24 characters. The username is **admin**.

The template exposes the host port on Unraid's network interfaces; keep it restricted to your trusted network/VPN. Its inclusion here does **not** imply approval or listing in Community Applications. Wait for an updated image to use these fixes through the template; building this source does not update Docker Hub.

## Local development

```sh
npm ci --ignore-scripts
npm run check
npm test
npm audit --omit=dev
npm start
```

Copy and configure `.env` first. Tests use mocked Discord messages and an ephemeral local HTTP server; they do not log into Discord or restart a real container. Windows, macOS and Linux can run the Node.js source. The Dockerfile uses the official Linux Alpine Node image; published image architectures depend on how the maintainer builds it.

The container runs as the unprivileged `node` user. No token is needed at image build time, and only application files are copied into the image. SIGTERM/SIGINT disconnect the bot and close the panel.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Startup exits immediately | DISCORD_TOKEN, WEB_KEY length and valid PORT; inspect container logs |
| Login fails or bot stays offline | Regenerate an invalid token; enable Message Content Intent; verify outbound Discord connectivity |
| Bot is online but `!ping` does nothing | Channel permissions, Message Content Intent and exact command spelling; other bots and DMs are ignored |
| Browser shows a login prompt / 401 | Username `admin`, password WEB_KEY; stale saved credentials may require a private browser window |
| Panel is unreachable remotely | Compose deliberately binds localhost; use a tunnel/VPN/proxy |
| Restart stops local development | Automatic restart requires a container restart policy |
| Docker is healthy but Discord is offline | Health is HTTP liveness only; inspect the authenticated status endpoint and logs |

If a token leaks, reset it in the Developer Portal and restart the bot with the replacement. If WEB_KEY leaks, change it and restart. Never paste either value into an issue.

## Contributing and project visibility

Open an issue with reproducible steps and redacted logs, or send a pull request. CI checks syntax, HTTP security behavior, configuration, ping handling, dependencies and the container build. Dependabot proposes dependency updates.

Suggested GitHub topics: `discord-bot`, `discord-js`, `docker`, `unraid`, `self-hosted`, `nodejs`, `homelab`.

[Support the project](https://buymeacoffee.com/THALF) · Created by **thalf** · [MIT](LICENSE)
