# ── Etapa 1: Build del frontend React ──────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build
# El build queda en /app/client/dist → lo copiamos al public del server

# ── Etapa 2: Server Node.js listo para producción ─────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Dependencias del backend
COPY package*.json ./
RUN npm install --omit=dev

# Código del servidor
COPY server/ ./server/

# Frontend buildeado desde la etapa anterior
COPY --from=frontend-builder /app/client/dist ./public

# Carpeta de datos persistente (se monta como volumen)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server/index.js"]