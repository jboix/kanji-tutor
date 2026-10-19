/**
 * Bundle budget (N4): the app shell — everything `dist/index.html` loads before any route chunk —
 * must stay under 300 KB gzipped. Run after `bun run build`.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 300;
const dist = resolve(import.meta.dir, '..', 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+\.(?:js|css))"/g)].map(
  (match) => match[1] as string,
);
const unique = [...new Set(assets)];
let total = 0;
for (const asset of unique) {
  const size = gzipSync(readFileSync(join(dist, asset))).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(8)} KB  ${asset}`);
}
const kb = total / 1024;
console.log(`${kb.toFixed(1).padStart(8)} KB  app shell, gzipped (budget ${BUDGET_KB} KB)`);
if (kb > BUDGET_KB) process.exit(1);
