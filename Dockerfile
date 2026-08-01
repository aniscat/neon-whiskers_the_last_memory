# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Neon Whiskers: The Last Memory
# Imagen multi-etapa: se compila el cliente con Vite y el resultado lo sirve el
# mismo Express que expone el agente, de forma que todo cabe en un contenedor.
# ---------------------------------------------------------------------------

ARG NODE_VERSION=24-alpine

# --- Etapa 1: dependencias completas (incluye las de desarrollo) -----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Etapa 2: build del cliente -------------------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json vite.config.ts index.html ./
COPY scripts ./scripts
COPY shared ./shared
COPY src ./src
COPY server ./server
# Los sprites se copian desde los packs originales a public/assets.
COPY AllCatsDemo ./AllCatsDemo
COPY CatMaterialsDEMO ./CatMaterialsDEMO
RUN npm run assets && npm run build

# --- Etapa 3: dependencias de producción ----------------------------------
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Etapa 4: imagen final ------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8787

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json tsconfig.json ./
COPY shared ./shared
COPY server ./server

# Carpeta donde el agente guarda la memoria de conversación por NPC.
RUN mkdir -p /app/server/.data && chown -R node:node /app/server/.data
USER node

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8787)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
