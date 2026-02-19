FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

LABEL net.unraid.docker.icon="https://cdn-icons-png.flaticon.com/512/2111/2111370.png"
LABEL net.unraid.docker.webui="http://[IP]:[PORT:3000]/"

CMD ["node","index.js"]
