/**
 * Server commands, run inside the container (D140):
 *
 *   docker compose exec sync bun cli.js invite "for Marta"   a new invite code, shown once
 *   docker compose exec sync bun cli.js invites              the invites, used or not
 *   docker compose exec sync bun cli.js revoke KD7M-3XQP     an unused invite stops working
 *   docker compose exec sync bun cli.js backup               a copy of the database in /data/backups
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { bunSql, openSqlite } from './bun-sql.ts';
import { readConfig } from './config.ts';
import { migrate } from './schema.ts';
import { sqliteStore } from './sqlite-store.ts';
import { inviteCode, normalInvite, sha256 } from './tokens.ts';

const say = (line: string) => process.stdout.write(`${line}\n`);

const config = readConfig();
const db = openSqlite(config.DB_PATH);
const sql = bunSql(db);
await migrate(sql);
const store = sqliteStore(sql);
const [command = '', argument = ''] = process.argv.slice(2);

async function invite(note: string) {
  const code = inviteCode();
  await store.addInvite({
    codeHash: await sha256(normalInvite(code)),
    note,
    createdAt: Date.now(),
  });
  say(`Invite ${code}${note ? ` (${note})` : ''}`);
  say(`Link: ${config.APP_URL}?invite=${code}`);
}

async function list() {
  for (const i of await store.invites()) {
    const state = i.revoked
      ? 'revoked'
      : i.usedBy
        ? `used ${new Date(i.usedAt ?? 0).toISOString()}`
        : 'open';
    say(`${new Date(i.createdAt).toISOString().slice(0, 10)}  ${state.padEnd(30)}  ${i.note}`);
  }
}

async function revoke(code: string) {
  const done = await store.revokeInvite(await sha256(normalInvite(code)));
  say(done ? 'Revoked.' : 'No open invite with that code.');
}

function backup() {
  const dir = join(config.DB_PATH, '..', 'backups');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `sync-${new Date().toISOString().replace(/[:.]/g, '-')}.db`);
  db.exec(`VACUUM INTO '${file.replaceAll("'", "''")}'`);
  say(file);
}

const COMMANDS: Record<string, () => unknown> = {
  invite: () => invite(argument),
  invites: list,
  revoke: () => revoke(argument),
  backup,
};

const run = COMMANDS[command];
if (!run) {
  say('Commands: invite "note" · invites · revoke CODE · backup');
  process.exit(1);
}
await run();
