# Kanji Tutor sync server

Cloud saves for [Kanji Tutor](../../README.md): your progress, saved online and kept in step on
every device you log in on. You log in with a passkey, by linking from a device that is already
logged in, or with a code sent to your email. There are no passwords, and accounts are by
invitation.

The app works fully without it. The server only adds saves shared between your devices.

## Use it

With an invite for [app.kanjitutor.ch](https://app.kanjitutor.ch/), open the invite link, or go to
**Settings → Cloud saves → Turn on** and type the code. The app asks for a passkey, then saves by
itself. On another device, choose **Log in** to bring your progress there.

## Host your own

You need a small Linux server with Docker, a domain for it, and your own build of the app (the
app talks only to the server it was built for, and the server only to that app).

1. Point a domain at the server, such as `api.example.com`, with ports 80 and 443 open.
2. Copy `deploy/` to the server, then create `.env` there from `deploy/.env.example`: the
   domain, your app's address, and a save key from `openssl rand -base64 32`. Keep a copy of the
   key: without it the saves cannot be read.
3. Choose the image in `.env`: `SYNC_TAG=1.2.0` uses a published version of
   `ghcr.io/jboix/kanji-sync`, or build your own (`SYNC_IMAGE`, see the guide).
4. Start it with `docker compose up -d`. Caddy gets the HTTPS certificate by itself, and
   `https://api.example.com/health` answers `{"ok":true,…}`.
5. Build the app with `VITE_SYNC_URL=https://api.example.com`, and make yourself an invite.

The [sync server guide](../../docs/SYNC-SERVER.md) covers updates from GitHub Actions, backups,
the limits you can change and how the server is protected.

## Invites and backups

On the server, in the folder with `compose.yaml`:

```sh
docker compose exec sync bun cli.js invite "for Marta"   # prints a code and a link, once
docker compose exec sync bun cli.js invites              # open, used and revoked
docker compose exec sync bun cli.js revoke KD7M-3XQP     # an unused code stops working
docker compose exec sync bun cli.js backup               # a copy of the database
```

## Run it locally

```sh
bun run sync:dev   # with APP_ORIGIN, SAVE_KEY and DB_PATH set in the environment
```

Its tests run with the rest (`bun run test`).
