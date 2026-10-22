/**
 * The cloud-save server: Bun with Hono over one SQLite file, behind Caddy. Started
 * by Docker Compose (`server/compose.yaml`); `bun run server:dev` runs it locally.
 */
import { createApp } from './app.ts';
import { bunSql, openSqlite } from './bun-sql.ts';
import { sqliteCodes } from './codes.ts';
import { readConfig } from './config.ts';
import { smtpMailer } from './mail.ts';
import { createLimiter } from './rate-limit.ts';
import { sqliteSaves } from './saves.ts';
import { migrate } from './schema.ts';
import { sqliteStore } from './sqlite-store.ts';

const config = readConfig();
const db = openSqlite(config.DB_PATH);
const sql = bunSql(db);
await migrate(sql);
const codes = sqliteCodes(sql, Date.now);
const app = createApp({
  store: sqliteStore(sql),
  codes,
  saves: sqliteSaves(sql),
  saveKey: config.SAVE_KEY,
  origin: config.APP_ORIGIN,
  rpId: config.RP_ID,
  mail: smtpMailer(config),
  limit: createLimiter(config.SIGNED_OUT_PER_MINUTE),
  limitAll: createLimiter(config.RATE_PER_MINUTE),
  caps: {
    savesPerHour: config.SAVES_PER_HOUR,
    maxBodyBytes: config.MAX_BODY_KB * 1024,
    maxSaveBytes: config.MAX_SAVE_MB * 1024 * 1024,
    maxDevices: config.MAX_DEVICES,
  },
  now: Date.now,
  version: config.SYNC_VERSION,
});
setInterval(() => void codes.purge(), 10 * 60 * 1000);
const server = Bun.serve({ port: config.PORT, fetch: app.fetch });
process.stdout.write(
  `sync server ${config.SYNC_VERSION} on :${config.PORT}, for ${config.APP_ORIGIN}\n`,
);

// `docker compose stop` sends SIGTERM: finish, then close SQLite, which folds its write-ahead log
// back into the file, so a copied or restored database is always whole.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void server.stop().then(() => {
      db.close();
      process.exit(0);
    });
  });
}
