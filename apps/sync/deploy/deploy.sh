#!/bin/sh
# Deploys one released version of the sync server. It is the deploy key's forced
# command (`command="…/deploy.sh",restrict` in authorized_keys), so that key can run nothing
# else: the Sync workflow connects with the version as its only argument and that release's
# compose.yaml and Caddyfile as a tar on stdin. The script backs up the database, installs the two
# files, runs ghcr.io/…/kanji-sync:<version>, checks /health, and puts the previous version and
# files back when anything fails. Run by hand, the version is the first argument.
set -eu
cd "$(dirname "$0")"

version="${SSH_ORIGINAL_COMMAND:-${1:-}}"
case "$version" in
  *[!0-9.]*) version_ok=no ;;
  *) version_ok="$(printf '%s\n' "$version" | grep -Ecx '[0-9]+\.[0-9]+\.[0-9]+' || true)" ;;
esac
if [ "$version_ok" != 1 ]; then
  echo "expected a version like 1.2.0, got '$version'" >&2
  exit 2
fi
if [ ! -f .env ]; then
  echo "no .env here: create it from .env.example first" >&2
  exit 2
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir "$work/incoming" "$work/previous"
tar -x -C "$work/incoming" -f - compose.yaml Caddyfile
for file in compose.yaml Caddyfile; do
  if [ -L "$work/incoming/$file" ] || [ ! -f "$work/incoming/$file" ]; then
    echo "$file must be a plain file" >&2
    exit 2
  fi
done

previous="$(sed -n 's/^SYNC_TAG=//p' .env)"

# Writes SYNC_TAG into .env, which compose reads for the image tag (the version); the other lines
# stay.
set_tag() {
  grep -v '^SYNC_TAG=' .env > .env.next || true
  echo "SYNC_TAG=$1" >> .env.next
  chmod 600 .env.next
  mv .env.next .env
}

healthy() {
  for _ in $(seq 30); do
    if docker compose exec -T sync wget -qO- http://127.0.0.1:3000/health > /dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  return 1
}

start() {
  docker compose pull --quiet && docker compose up -d --remove-orphans && healthy
}

if [ -f compose.yaml ] && docker compose ps --status running --services | grep -qx sync; then
  echo "backing up the database"
  docker compose exec -T sync bun cli.js backup
fi
for file in compose.yaml Caddyfile; do
  if [ -f "$file" ]; then cp -p "$file" "$work/previous/"; fi
done

echo "deploying $version"
cp "$work/incoming/compose.yaml" "$work/incoming/Caddyfile" .
set_tag "$version"
if start; then
  docker image prune -f > /dev/null
  echo "deployed $version"
  exit 0
fi

echo "$version did not start; putting the previous one back" >&2
if [ -z "$previous" ]; then
  docker compose down
  exit 1
fi
cp -p "$work/previous/compose.yaml" "$work/previous/Caddyfile" .
set_tag "$previous"
start || echo "the previous one ($previous) did not start either" >&2
exit 1
