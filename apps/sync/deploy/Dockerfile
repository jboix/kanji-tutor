# The sync server (D140): the bundle from `bun run sync:build`, nothing to install. The Sync
# workflow builds it at a release tag and publishes it to GHCR as that version (D142, D145).
FROM oven/bun:1.4.2-alpine
ARG VERSION=dev
WORKDIR /app
COPY app/ ./
RUN mkdir -p /data && chown bun:bun /data
USER bun
ENV DB_PATH=/data/sync.db PORT=3000 SYNC_VERSION=$VERSION
EXPOSE 3000
CMD ["bun", "main.js"]
