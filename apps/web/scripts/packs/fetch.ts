/**
 * Downloads pinned sources into `data/raw/`, verifies their sha256 and decompresses them.
 * Decompression shells out to `tar` (for jmdict-simplified `.tgz`) and `bzip2` (Tatoeba), both
 * standard on Linux and macOS.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Source } from './sources.ts';

export interface FetchOptions {
  rawDir: string;
  /** Accept a changed hash for moving (Tatoeba) sources instead of failing. */
  refreshMoving: boolean;
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function download(source: Source, path: string): Promise<void> {
  console.log(`  downloading ${source.url}`);
  const response = await fetch(source.url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${source.id}: HTTP ${response.status} for ${source.url}`);
  writeFileSync(path, new Uint8Array(await response.arrayBuffer()));
}

/** Ensures the source is in `rawDir` with the pinned hash; returns its local path. */
export async function ensureSource(source: Source, options: FetchOptions): Promise<string> {
  mkdirSync(options.rawDir, { recursive: true });
  const path = join(options.rawDir, source.file);
  if (!existsSync(path)) await download(source, path);
  const actual = sha256(readFileSync(path));
  if (actual === source.sha256) return path;
  if (source.moving && options.refreshMoving) {
    console.log(`  ${source.id}: new dump, sha256 ${actual} (update scripts/packs/sources.ts)`);
    return path;
  }
  throw new Error(
    `${source.id}: sha256 mismatch for ${path}\n  expected ${source.sha256}\n  actual   ${actual}\n` +
      (source.moving
        ? '  Tatoeba publishes a new dump weekly; rerun with --refresh-tatoeba to accept it.'
        : '  Delete the file and rerun to download it again.'),
  );
}

function run(cmd: string[], what: string): Uint8Array {
  const result = Bun.spawnSync(cmd, { stdout: 'pipe', stderr: 'pipe' });
  if (result.exitCode !== 0) {
    throw new Error(`${what} failed (${cmd.join(' ')}): ${result.stderr.toString()}`);
  }
  return result.stdout;
}

/** Reads the single JSON file inside a jmdict-simplified `.tgz`. */
export function readTgzJson<T>(path: string): T {
  const text = new TextDecoder().decode(run(['tar', '-xzOf', path], `tar ${path}`));
  return JSON.parse(text) as T;
}

/** Reads a `.bz2` file as UTF-8 text. */
export function readBz2Text(path: string): string {
  return new TextDecoder().decode(run(['bzip2', '-dc', path], `bzip2 ${path}`));
}

/** Reads a plain text file. */
export function readText(path: string): string {
  return readFileSync(path, 'utf8');
}
