# ── Etapa 1: Build del frontend React ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY front/package*.json ./front/
RUN cd front && npm install

COPY front/ ./front/

# El outDir en vite.config.js es '../public', o sea /app/public
RUN cd front && npm run build

# ── Etapa 2: Server Node.js listo para producción ─────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/

# El build quedó en /app/public en la etapa anterior
COPY --from=frontend-builder /app/public ./public

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server/index.js"]