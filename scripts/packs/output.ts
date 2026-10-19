/** Splits a pack into chunks, writes the full and fixture packs, and logs their counts. */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { PackManifest } from '../../src/domain/repos.ts';
import { type Chunk, chunk, contentHash, emit, writeManifest } from './emit.ts';
import type { Pack } from './fixture.ts';
import { TATOEBA_DATE } from './sources.ts';

const CHUNK = { words: 8_000, kanji: 5_000, sentences: 3_000, grammar: 1_000, lang: 10_000 };

function chunks(pack: Pack): Chunk[] {
  return [
    ...chunk('words', pack.words, CHUNK.words),
    ...chunk('kanji', pack.kanji, CHUNK.kanji),
    ...chunk('sentences', pack.sentences, CHUNK.sentences),
    ...chunk('grammar', pack.grammar, CHUNK.grammar),
    ...chunk('clusters', pack.clusters, CHUNK.grammar),
    ...chunk('units', pack.units, CHUNK.grammar),
    ...pack.languages.flatMap((l) => [
      ...chunk('glosses', l.glosses, CHUNK.lang, l.language),
      ...chunk('translations', l.translations, CHUNK.lang, l.language),
    ]),
  ];
}

function megabytes(bytes: number): string {
  return `${(bytes / 1e6).toFixed(2)} MB`;
}

function logSizes(label: string, manifest: PackManifest, rawBytes: number): void {
  const sum = (files: { bytes: number }[]) => files.reduce((total, f) => total + f.bytes, 0);
  const byStore = new Map<string, number>();
  for (const f of manifest.files) byStore.set(f.store, (byStore.get(f.store) ?? 0) + f.bytes);
  const stores = [...byStore].map(([store, bytes]) => `${store} ${megabytes(bytes)}`).join(', ');
  const langs = Object.entries(manifest.languages ?? {})
    .map(([lang, files]) => `${lang} ${megabytes(sum(files))}`)
    .join(', ');
  console.log(
    `  ${label}: ${megabytes(rawBytes)} JSON; base ${megabytes(sum(manifest.files))} gzip (${stores}); languages ${langs}`,
  );
}

/** Writes public/packs/<version>/ and the manifest, and deletes older version directories. */
export function writeFull(packs: string, pack: Pack): void {
  const all = chunks(pack);
  const version = `${TATOEBA_DATE.replaceAll('-', '')}-${contentHash(all)}`;
  for (const entry of existsSync(packs) ? readdirSync(packs, { withFileTypes: true }) : []) {
    if (entry.isDirectory() && entry.name !== 'fixture' && entry.name !== version) {
      rmSync(join(packs, entry.name), { recursive: true });
    }
  }
  const { manifest, rawBytes } = emit(join(packs, version), `${version}/`, version, all);
  writeManifest(join(packs, 'manifest.json'), manifest);
  logSizes(`full ${version}`, manifest, rawBytes);
}

/** Writes public/packs/fixture/ with urls relative to it. */
export function writeFixture(packs: string, pack: Pack): void {
  const all = chunks(pack);
  const dir = join(packs, 'fixture');
  rmSync(dir, { recursive: true, force: true });
  const { manifest, rawBytes } = emit(dir, '', `fixture-${contentHash(all)}`, all);
  writeManifest(join(dir, 'manifest.json'), manifest);
  reportPack('fixture', pack);
  logSizes(`fixture ${manifest.version}`, manifest, rawBytes);
}

function byLevel<T>(rows: readonly T[], level: (row: T) => number | undefined): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = `N${level(row) ?? '-'}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts]
    .sort()
    .map(([k, n]) => `${k} ${n}`)
    .join(', ');
}

/** Logs the counts per level of every store. */
export function reportPack(label: string, pack: Pack): void {
  const examples = pack.grammar.filter((g) => g.exampleSentenceIds.length > 0);
  console.log(`  ${label} words ${pack.words.length}: ${byLevel(pack.words, (w) => w.jlpt)}`);
  console.log(`  ${label} kanji ${pack.kanji.length}: ${byLevel(pack.kanji, (k) => k.jlpt)}`);
  console.log(
    `  ${label} sentences ${pack.sentences.length}: ${byLevel(pack.sentences, (s) => s.level)}`,
  );
  console.log(
    `  ${label} grammar with examples ${examples.length}/${pack.grammar.length}: ${byLevel(examples, (g) => g.level)}`,
  );
  console.log(
    `  ${label} clusters ${pack.clusters.length}: ${byLevel(pack.clusters, (c) => c.level)}`,
  );
  console.log(
    `  ${label} units ${pack.units.length}; languages ${pack.languages.map((l) => `${l.language} ${l.glosses.length} glosses, ${l.translations.length} translations`).join('; ')}`,
  );
}
