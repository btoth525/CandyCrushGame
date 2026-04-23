# Wizarding Nuts -- server mode (Node + SQLite + static).
# Single container that serves the game AND the API.

FROM node:22-alpine

# better-sqlite3 needs a tiny build toolchain on alpine.
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install deps first for layer caching.
COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev --no-audit --no-fund

# Copy server + game.
COPY server/   ./server/
COPY game/     ./game/

# Strip build tools to keep image slim (deps are now compiled).
RUN apk del python3 make g++

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
ENV STATIC_DIR=/app/game

EXPOSE 3000
VOLUME ["/data"]

WORKDIR /app/server
CMD ["node", "server.js"]
