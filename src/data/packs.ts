import { DEFAULT_SETTINGS } from '../domain/defaults.ts';
import type {
  PackFile,
  PackLanguage,
  PackLoader,
  PackManifest,
  PackProgress,
} from '../domain/repos.ts';
import type { Settings } from '../domain/types.ts';
import type { KanjiTutorDb } from './db.ts';
import { applyLanguage } from './pack-languages.ts';
import { emptySeen, PACK_STORES, prunePacks, putBatch, rowId } from './pack-stores.ts';

/** Rows per IndexedDB transaction while loading, and per progress report. */
const BATCH = 2000;
const LANGUAGES: readonly PackLanguage[] = ['fr', 'es'];

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  return response;
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/**
 * Reads one `.json.gz` pack file. A server may already have decoded it (Content-Encoding: gzip),
 * so the gzip magic bytes decide whether to decompress.
 */
async function readRecords(url: string): Promise<unknown[]> {
  const bytes = new Uint8Array(await (await fetchOk(url)).arrayBuffer());
  if (!isGzip(bytes)) return JSON.parse(new TextDecoder().decode(bytes)) as unknown[];
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text()) as unknown[];
}

async function patchSettings(db: KanjiTutorDb, patch: (row: Settings) => void): Promise<void> {
  await db.transaction('rw', db.settings, async () => {
    const row = { ...DEFAULT_SETTINGS, ...(await db.settings.get('app')), key: 'app' as const };
    patch(row);
    await db.settings.put(row);
  });
}

function setPackVersion(db: KanjiTutorDb, packVersion: string): Promise<void> {
  return patchSettings(db, (row) => {
    row.packVersion = packVersion;
  });
}

type Report = (progress: PackProgress) => void;

/** Rows loaded across every store, for the overall share of the install. */
interface Overall {
  done: number;
  total: number;
}

async function loadStore(
  db: KanjiTutorDb,
  base: string,
  files: PackFile[],
  report: Report,
  run: { seen: Set<string>; overall: Overall },
) {
  const total = files.reduce((sum, file) => sum + file.count, 0);
  const { seen, overall } = run;
  let loaded = 0;
  for (const file of files) {
    const records = await readRecords(`${base}${file.url}`);
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      await putBatch(db, file.store, batch);
      for (const row of batch) seen.add(rowId(file.store, row));
      loaded += batch.length;
      overall.done += batch.length;
      report({ stage: file.store, loaded, total, overall: overall.done / overall.total });
    }
  }
}

async function installedLanguages(db: KanjiTutorDb): Promise<PackLanguage[]> {
  const chosen = (await db.settings.get('app'))?.packLanguages ?? [];
  return LANGUAGES.filter((lang) => chosen.includes(lang));
}

async function applyLanguages(db: KanjiTutorDb, base: string, next: PackManifest, report: Report) {
  const read = (url: string) => readRecords(`${base}${url}`);
  for (const lang of await installedLanguages(db)) {
    const files = next.languages?.[lang] ?? [];
    await applyLanguage({ db, lang, read, report, batch: BATCH }, files);
  }
}

/**
 * Rows are upserted over the installed version, then the version is recorded, then old rows are
 * pruned: an interrupted update leaves a usable dictionary and retries on the next start (D27).
 * Installed languages are applied again before the version is recorded.
 */
async function install(db: KanjiTutorDb, base: string, next: PackManifest, report: Report) {
  const seen = emptySeen();
  const total = next.files.reduce((sum, file) => sum + file.count, 0);
  const overall = { done: 0, total: Math.max(total, 1) };
  for (const store of PACK_STORES) {
    const files = next.files.filter((file) => file.store === store);
    await loadStore(db, base, files, report, { seen: seen[store], overall });
  }
  await applyLanguages(db, base, next, report);
  await setPackVersion(db, next.version);
  await prunePacks(db, seen);
  report({ stage: 'done', loaded: total, total, overall: 1 });
}

function addLanguage(db: KanjiTutorDb, lang: PackLanguage): Promise<void> {
  return patchSettings(db, (row) => {
    row.packLanguages = [...new Set([...(row.packLanguages ?? []), lang])];
  });
}

/** Loads the dictionary packs from `baseUrl` (e.g. `/packs/`) into IndexedDB. */
export function createPackLoader(db: KanjiTutorDb, baseUrl: string): PackLoader {
  const manifest = async (): Promise<PackManifest> =>
    (await (await fetchOk(`${baseUrl}manifest.json`)).json()) as PackManifest;
  const installed = async () => (await db.settings.get('app'))?.packVersion;
  return {
    installed,
    manifest,
    install: async (onProgress) => install(db, baseUrl, await manifest(), onProgress),
    // The language is recorded first, so an interrupted install is completed by the next update.
    installLanguage: async (lang, onProgress) => {
      const next = await manifest();
      const files = next.languages?.[lang];
      if (!files) throw new Error(`No ${lang} language pack in ${next.version}`);
      await addLanguage(db, lang);
      if ((await installed()) !== next.version) return install(db, baseUrl, next, onProgress);
      const read = (url: string) => readRecords(`${baseUrl}${url}`);
      await applyLanguage({ db, lang, read, report: onProgress, batch: BATCH }, files);
      onProgress({ stage: 'done', loaded: files.length, total: files.length });
    },
    installedLanguages: () => installedLanguages(db),
  };
}
