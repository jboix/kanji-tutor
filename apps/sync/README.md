# Sync server

Cloud saves for Kanji Tutor, by invitation: a Bun server with Hono over one SQLite file, behind
Caddy for HTTPS, run with Docker Compose on a small VPS.

| Part         | What it does                                                            |
| ------------ | ----------------------------------------------------------------------- |
| `src/`       | The API: passkeys, device linking, email codes, devices, saves, invites |
| `src/cli.ts` | Commands on the server: `invite`, `invites`, `revoke`, `backup`         |
| `deploy/`    | `Dockerfile`, `compose.yaml`, `Caddyfile`, `.env.example`               |
| `test/`      | The routes over memory, and the SQL over Node's SQLite                  |

The app works without it: the server only adds saves shared between a learner's devices.

## What it keeps

One SQLite file, `/data/sync.db` in the container:

- **accounts**, with a recovery email once confirmed;
- **passkeys**, public keys only;
- **devices**, with a hash of each session token;
- **invites**, with a hash of each code, used once;
- **saves**, one per account, encrypted with AES-GCM under `SAVE_KEY` and versioned, so an older
  device never overwrites a newer save;
- **codes** that expire: passkey challenges, pairing and email codes.

## Build and deploy

The **Sync server** workflow (`.github/workflows/sync.yml`) does it, started by hand from `main`.
The server takes the app's version: run **Release** first, then this.

1. it checks out the latest release tag, runs `bun run check`, builds the image from `deploy/`
   and publishes it to GHCR as `ghcr.io/jboix/kanji-sync:<version>` (public, so the server pulls
   it without a token);
2. after approval in the `sync` environment, it connects with a deploy key that can only run
   `deploy/deploy.sh`. The script backs up the database, installs that release's `compose.yaml`
   and `Caddyfile`, runs the image, checks `/health`, and puts the previous version back when
   that fails. `/health` answers with the version running.

To roll back, start the workflow with an earlier version, such as `1.2.0`: its image is deployed
again, unbuilt.

The server keeps a `.env` next to `compose.yaml` (from `.env.example`) with the domain, the
app's origin and `SAVE_KEY` (`openssl rand -base64 32`). It never leaves the server. Keep a copy
of `SAVE_KEY`: without it the saves cannot be decrypted.

## Invites and backups

```sh
docker compose exec sync bun cli.js invite "for Marta"   # prints the code and a link, once
docker compose exec sync bun cli.js invites
docker compose exec sync bun cli.js revoke KD7M-3XQP
docker compose exec sync bun cli.js backup               # /data/backups/sync-<time>.db
```

## Locally

`bun run sync:dev` runs it with `APP_ORIGIN`, `SAVE_KEY` and `DB_PATH` from the environment.
Its tests run with the rest (`bun run test`), or alone with `bun run test` in `apps/sync`.
