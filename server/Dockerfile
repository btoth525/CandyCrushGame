# Wizarding Nuts -- single-container build (Node + SQLite + static).
# Multi-stage: build deps in stage 1, slim runtime in stage 2.

# ============ Stage 1: install deps ============
FROM node:22-alpine AS deps

# Build toolchain for better-sqlite3's native bindings (used only when
# no prebuilt is available for the target platform). Lives only in this
# layer and is discarded.
RUN apk add --no-cache python3 make g++

WORKDIR /app/server

COPY server/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund \
 && npm cache clean --force

# ============ Stage 2: runtime ============
FROM node:22-alpine AS runtime

# Tiny runtime: no build tools, just node + the compiled deps + the app.
WORKDIR /app

COPY --from=deps /app/server/node_modules ./server/node_modules
COPY server/   ./server/
COPY game/     ./game/

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/data \
    STATIC_DIR=/app/game

EXPOSE 3000
VOLUME ["/data"]

WORKDIR /app/server

# Run as root inside the container so the bind-mounted /data volume
# (owned by nobody:users on Unraid, root on most other hosts) is
# always writable. The container is isolated; running as root inside
# does not grant root on the host.
RUN mkdir -p /data

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/ping || exit 1

CMD ["node", "server.js"]
