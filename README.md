# 🤖 Discord Bot (Docker + Unraid Ready)

A simple **Discord.js bot** packaged as a Docker container with a built-in Web UI for monitoring and restart control.

Designed for:

- 🐳 Docker users  
- 📦 Unraid users  
- 🖥️ Self-hosters  
- 🧪 Homelabs  

---

## 📦 Docker Image

👉 https://hub.docker.com/r/thalf/discord-bot

Pull manually:

```bash
docker pull thalf/discord-bot:latest
🚀 Quick Start (Docker)
Run container:

docker run -d \
  --name discord-bot \
  --restart unless-stopped \
  -e DISCORD_TOKEN=YOUR_TOKEN \
  -p 3000:3000 \
  thalf/discord-bot:latest
Open Web UI:

http://localhost:3000
🧩 Docker Compose
Create file:

docker-compose.yml

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
Start:

docker compose up -d
🖥️ Web UI Features
The built-in panel shows:

Connection status

Uptime

Guild count

Ready time

Restart button

🧠 Environment Variables
Variable	Required	Description
DISCORD_TOKEN	✅	Your Discord bot token
PORT	❌	Web UI port (default: 3000)
WEB_KEY	❌	Optional password for Web UI
📦 Unraid Install
If you added the XML template:

Go to Apps

Search discord-bot

Click install

Paste token

Start container

Done 🎉

🔐 Security Tips
Never share your token publicly.

If leaked → regenerate immediately in Discord Developer Portal.
