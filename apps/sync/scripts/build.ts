/**
 * `bun run sync:build`: bundles the sync server (`apps/sync/src`) into `apps/sync/deploy/app/`,
 * one file for the server and one for its commands, so the VPS installs nothing: `rsync` the
 * `apps/sync/deploy` folder and `docker compose up -d --build` there (see the guide, D140).
 */
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '..');
const SRC = join(ROOT, 'src');

const result = await Bun.build({
  entrypoints: [join(SRC, 'main.ts'), join(SRC, 'cli.ts')],
  outdir: join(ROOT, 'deploy', 'app'),
  target: 'bun',
  format: 'esm',
  minify: true,
});
if (!result.success) {
  for (const log of result.logs) process.stderr.write(`${String(log)}\n`);
  process.exit(1);
}
for (const output of result.outputs) process.stdout.write(`wrote ${output.path}\n`);
