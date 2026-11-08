FROM node:25-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --chown=node:node index.js ./
COPY --chown=node:node src ./src
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
LABEL net.unraid.docker.icon="https://cdn-icons-png.flaticon.com/512/2111/2111370.png"
LABEL net.unraid.docker.webui="http://[IP]:[PORT:3000]/"
CMD ["node","index.js"]
