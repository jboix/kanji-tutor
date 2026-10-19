/** Writes gzip-compressed JSON-array chunks and a `PackManifest`. Output is deterministic. */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { LanguageFile, PackFile, PackLanguage, PackManifest } from '../../src/domain/repos.ts';

/** No pack file may be larger than this, compressed. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

type AnyStore = PackFile['store'] | LanguageFile['store'];

export interface Chunk {
  store: AnyStore;
  /** Set for the files of a language pack (N9). */
  language?: PackLanguage;
  name: string;
  json: string;
  count: number;
}

/** One record per line, so diffs of the uncompressed text stay readable. */
export function toJsonArray(records: readonly unknown[]): string {
  return `[\n${records.map((r) => JSON.stringify(r)).join(',\n')}\n]\n`;
}

export function chunk<T>(
  store: AnyStore,
  records: readonly T[],
  size: number,
  language?: PackLanguage,
): Chunk[] {
  const chunks: Chunk[] = [];
  const prefix = language ? `${language}-${store}` : store;
  for (let i = 0; i < records.length; i += size) {
    const part = records.slice(i, i + size);
    const index = String(chunks.length).padStart(2, '0');
    chunks.push({
      store,
      ...(language ? { language } : {}),
      name: `${prefix}-${index}.json.gz`,
      json: toJsonArray(part),
      count: part.length,
    });
  }
  return chunks;
}

/** Content hash of all chunks, used in the pack version. */
export function contentHash(chunks: readonly Chunk[]): string {
  const hash = createHash('sha256');
  for (const c of chunks) hash.update(c.name).update('\0').update(c.json);
  return hash.digest('hex').slice(0, 8);
}

export interface Emitted {
  manifest: PackManifest;
  rawBytes: number;
}

/**
 * Writes `chunks` to `dir` and returns their manifest. File urls are `urlPrefix` + file name,
 * relative to the directory the manifest is served from.
 */
export function emit(dir: string, urlPrefix: string, version: string, chunks: Chunk[]): Emitted {
  mkdirSync(dir, { recursive: true });
  const manifest: PackManifest = { version, files: [] };
  let rawBytes = 0;
  for (const c of chunks) {
    const gz = gzipSync(Buffer.from(c.json), { level: 9 });
    if (gz.length > MAX_FILE_BYTES) throw new Error(`${c.name} is ${gz.length} bytes compressed`);
    writeFileSync(join(dir, c.name), gz);
    rawBytes += Buffer.byteLength(c.json);
    const file = { url: `${urlPrefix}${c.name}`, bytes: gz.length, count: c.count };
    addFile(manifest, c, file);
  }
  return { manifest, rawBytes };
}

function addFile(manifest: PackManifest, c: Chunk, file: Omit<PackFile, 'store'>): void {
  if (!c.language) {
    manifest.files.push({ store: c.store as PackFile['store'], ...file });
    return;
  }
  manifest.languages ??= {};
  const list = manifest.languages[c.language] ?? [];
  list.push({ store: c.store as LanguageFile['store'], ...file });
  manifest.languages[c.language] = list;
}

export function writeManifest(path: string, manifest: PackManifest): void {
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
