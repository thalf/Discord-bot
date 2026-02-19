# 🤖 Discord Bot

### Docker + Unraid Ready

A lightweight **Discord.js bot container** with a built-in Web UI for monitoring status and restarting the bot.

Designed for homelabs, self-hosters and automation setups.

---

## 🚀 Features

* 🔌 Runs anywhere Docker runs
* 📊 Web dashboard status page
* 🔁 Restart button in browser
* 🔐 Token via environment variable
* 🐳 Lightweight container image
* 🧱 Unraid template included

---

## 📦 Docker Image

👉 https://hub.docker.com/r/thalf/discord-bot

Pull manually:

```bash
docker pull thalf/discord-bot:latest
```

---

## ⚡ Quick Start (Docker)

```bash
docker run -d \
  --name discord-bot \
  --restart unless-stopped \
  -e DISCORD_TOKEN=YOUR_TOKEN \
  -p 3000:3000 \
  thalf/discord-bot:latest
```

Open Web UI:

```
http://localhost:3000
```

---

## 🧩 Docker Compose

```yaml
version: "3.9"

services:
  discord-bot:
    image: thalf/discord-bot:latest
    container_name: discord-bot
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DISCORD_TOKEN: YOUR_TOKEN
```

Start:

```bash
docker compose up -d
```

---

## 📊 Web Panel

The built-in panel shows:

* Connection status
* Uptime
* Guild count
* Ready time
* Restart button

---

## 🔧 Environment Variables

| Variable      | Required | Description                  |
| ------------- | -------- | ---------------------------- |
| DISCORD_TOKEN | ✅        | Your Discord bot token       |
| PORT          | ❌        | Web UI port (default: 3000)  |
| WEB_KEY       | ❌        | Optional password for Web UI |

---

## 🧱 Unraid Support

This repository includes an **Unraid XML template** for easy installation.

Once approved, it will (hopefully 🤞) be available directly inside:

**Unraid → Apps → Search → discord-bot**

Until then, you can install it manually using the template file inside:

```
/unraid/discord-bot.xml
```

---

## ☕ Support the Project

If you like this project and want to support development:

👉 https://buymeacoffee.com/THALF

---

## 🔐 Security Notice

Never share your Discord bot token publicly.

If your token leaks:
→ Regenerate it immediately in Discord Developer Portal.

---

## 📜 License

MIT License

---

## ❤️ Credits

Created and maintained by **thalf**

Built for the self-hosting community.
