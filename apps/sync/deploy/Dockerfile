# The sync server: the bundle from `bun run sync:build`, nothing to install. The Sync
# workflow builds it at a release tag and publishes it to GHCR as that version.
FROM oven/bun:1.4.2-alpine
ARG VERSION=dev
# Alpine's own security fixes, newer than the Bun image's.
RUN apk upgrade --no-cache
WORKDIR /app
COPY app/ ./
RUN mkdir -p /data && chown bun:bun /data
USER bun
ENV DB_PATH=/data/sync.db PORT=3000 SYNC_VERSION=$VERSION
EXPOSE 3000
# Docker marks the container healthy or not, as `docker compose ps` shows.
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["bun", "main.js"]
