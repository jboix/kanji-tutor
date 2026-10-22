# Sync server guide

How the cloud-save server in `apps/sync` works, how it is deployed and kept up to date, and what
protects it. To start, see its [README](../apps/sync/README.md).

## How it works

A Bun server with Hono over one SQLite file, behind Caddy, run with Docker Compose. Caddy is the
only part reachable from the internet: it gets and renews the HTTPS certificate, and passes the
requests on to the server inside Docker's network.

| Part               | What it does                                                           |
| ------------------ | ---------------------------------------------------------------------- |
| `src/`             | The API: passkeys, linking a device, email codes, devices, the save    |
| `src/cli.ts`       | Commands on the server: `invite`, `invites`, `revoke`, `backup`        |
| `deploy/`          | `Dockerfile`, `compose.yaml`, `Caddyfile`, `.env.example`, `deploy.sh` |
| `test/`            | The routes over memory, and the SQL over Node's SQLite                 |
| `scripts/build.ts` | The bundle the image copies (`bun run sync:build`)                     |

The database, `/data/sync.db` in the container, keeps:

- **accounts**, with a recovery email once confirmed;
- **passkeys**, public keys only;
- **devices**, with a hash of each session token;
- **invites**, with a hash of each code, used once;
- **saves**, one per account: the app's backup file, gzipped by the app, encrypted with AES-GCM
  under `SAVE_KEY`, and versioned, so an older device never overwrites a newer save;
- **codes** that expire: passkey challenges, linking and email codes.

The app sends its save about 30 seconds after the last change, at most two minutes after the
first one not sent, and at once when it goes to the background. Nothing is sent when nothing
changed. When two devices saved at the same moment, the app merges the two.

## Settings

`.env`, next to `compose.yaml` on the server, never leaves it:

| Setting                                                         | What it is                                                                                     |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `SYNC_DOMAIN`                                                   | The server's domain, for HTTPS                                                                 |
| `APP_ORIGIN`                                                    | The app's origin: the only one allowed to call                                                 |
| `APP_URL`                                                       | Where invite links point; by default the origin's root                                         |
| `RP_ID`                                                         | The passkeys' domain: the app's host or a domain above it. Never change it once accounts exist |
| `SAVE_KEY`                                                      | 32 random bytes, base64: decrypts every save                                                   |
| `SYNC_IMAGE`, `SYNC_TAG`                                        | The image and version to run; `deploy.sh` writes the tag                                       |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Email codes, over any SMTP server; without a host, email is off                                |

The limits have defaults that suit invite-only use:

| Setting                 | Default | Limits                                                     |
| ----------------------- | ------- | ---------------------------------------------------------- |
| `RATE_PER_MINUTE`       | 120     | Requests per client address, to any endpoint but `/health` |
| `SIGNED_OUT_PER_MINUTE` | 20      | Signed-out requests that start a sign-in or an account     |
| `SAVES_PER_HOUR`        | 120     | Saves per account                                          |
| `MAX_BODY_KB`           | 64      | Any request body but a save                                |
| `MAX_SAVE_MB`           | 50      | One save                                                   |
| `MAX_DEVICES`           | 20      | Devices per account: a new one signs out the oldest        |

## Deploying from GitHub Actions

The **Sync server** workflow, started by hand from `main`, deploys the app's latest release:
run **Release** first, then this.

1. It checks out the latest release tag, runs `bun run check`, builds the image and publishes it
   to GHCR as `ghcr.io/<owner>/kanji-sync:<version>`. Make the package public once, so the
   server pulls it without a token.
2. After approval in the `sync` environment, it connects with a deploy key that can only run
   `deploy/deploy.sh`: the script backs up the database, installs that release's `compose.yaml`
   and `Caddyfile`, runs the image, checks `/health`, and puts the previous version back when
   that fails.

To go back to an earlier version, start the workflow with it, such as `1.2.0`: its image is
deployed again, without building.

The `sync` environment holds the secret `SYNC_SSH_KEY` and the variables `SYNC_HOST`,
`SYNC_USER`, `SYNC_DOMAIN` and `SYNC_KNOWN_HOSTS`. On the server, the deploy key's line in
`~/.ssh/authorized_keys` is `command="…/deploy.sh",restrict` followed by the public key.

To build your own image instead: `bun run sync:build`, then `docker build -t kanji-sync:local
apps/sync/deploy`, and `SYNC_IMAGE=kanji-sync`, `SYNC_TAG=local` in `.env`.

## Backups

`bun cli.js backup` writes a copy of the database to `/data/backups`, safely while the server
runs. Each deploy makes one first. For a copy every night at 3:00, kept two weeks, in the
server's crontab:

```sh
0 3 * * * cd ~/kanji-sync && docker compose exec -T sync bun cli.js backup > /dev/null
30 3 * * * cd ~/kanji-sync && docker compose exec -T sync find /data/backups -name '*.db' -mtime +14 -delete
```

Keep a copy off the server too. A backup holds the saves encrypted, but email addresses and
device names in clear.

## Protection

- **Who may call:** only the app's origin; CORS allows nothing else. Signed-in endpoints need a
  session token, which the server keeps only as a SHA-256 hash.
- **Accounts:** by invitation; an invite works once. Passkeys are checked with
  `@simplewebauthn/server`. Linking a device needs the code shown on it and a secret only it
  holds. Email codes last 10 minutes and allow 5 tries.
- **Saves:** encrypted at rest. A copy of the database or a backup is unreadable without
  `SAVE_KEY`, but someone in control of the server can read them, since the key is there too.
- **Headers:** every answer is `no-store` and `nosniff`; Caddy adds `Strict-Transport-Security`.
  Crawlers are asked to stay out (`/robots.txt`).
- **The server itself:** worth hardening apart from the repository: SSH by key only, no root
  login, a firewall with only 22, 80 and 443 open, and something like sshguard.

## Scans

The **Scan** workflow runs like CodeQL, on every push and pull request to `main` and weekly:
zizmor audits the workflows, and Trivy checks `deploy/` for misconfigurations and the running
images, this one and Caddy's, for known vulnerabilities. Its findings go to the repository's
Security tab. No scanner runs in the build or the deploy.

Before a release, scan the image you are about to publish:

```sh
bun run sync:build
docker build -t kanji-sync:check apps/sync/deploy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:0.75.0 \
  image --severity HIGH,CRITICAL --ignore-unfixed kanji-sync:check
```
