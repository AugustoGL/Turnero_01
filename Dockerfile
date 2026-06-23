# ── Etapa 1: Build del frontend React ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/front

COPY front/package*.json ./
RUN npm install

COPY front/ ./
RUN npm run build

# ── Etapa 2: Server Node.js listo para producción ─────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/

COPY --from=frontend-builder /app/front/dist ./public

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server/index.js"]