/**
 * Language packs (N9): French or Spanish glosses merged into word rows (`glossesByLang`) and
 * translations into sentence rows (`translations`). A base pack update rewrites those rows, so
 * the loader applies the installed languages again after every update.
 */
import type { LanguageFile, PackLanguage, PackProgress } from '../domain/repos.ts';
import type { KanjiReaderDb } from './db.ts';

interface GlossRecord {
  id: string;
  glosses: string[];
}

interface TranslationRecord {
  id: string;
  text: string;
}

async function applyGlosses(db: KanjiReaderDb, lang: PackLanguage, records: GlossRecord[]) {
  await db.transaction('rw', db.words, async () => {
    const rows = await db.words.bulkGet(records.map((r) => r.id));
    const next = records.flatMap((record, i) => {
      const row = rows[i];
      return row
        ? [{ ...row, glossesByLang: { ...row.glossesByLang, [lang]: record.glosses } }]
        : [];
    });
    await db.words.bulkPut(next);
  });
}

async function applyTranslations(
  db: KanjiReaderDb,
  lang: PackLanguage,
  records: TranslationRecord[],
) {
  await db.transaction('rw', db.sentences, async () => {
    const rows = await db.sentences.bulkGet(records.map((r) => r.id));
    const next = records.flatMap((record, i) => {
      const row = rows[i];
      return row ? [{ ...row, translations: { ...row.translations, [lang]: record.text } }] : [];
    });
    await db.sentences.bulkPut(next);
  });
}

export type ReadRecords = (url: string) => Promise<unknown[]>;

function applyBatch(
  db: KanjiReaderDb,
  lang: PackLanguage,
  store: LanguageFile['store'],
  rows: unknown[],
) {
  return store === 'glosses'
    ? applyGlosses(db, lang, rows as GlossRecord[])
    : applyTranslations(db, lang, rows as TranslationRecord[]);
}

export interface LanguageInstall {
  db: KanjiReaderDb;
  lang: PackLanguage;
  read: ReadRecords;
  report: (progress: PackProgress) => void;
  batch: number;
}

async function applyStore(
  job: LanguageInstall,
  store: LanguageFile['store'],
  files: LanguageFile[],
) {
  const total = files.reduce((sum, file) => sum + file.count, 0);
  let loaded = 0;
  for (const file of files) {
    const records = await job.read(file.url);
    for (let i = 0; i < records.length; i += job.batch) {
      const part = records.slice(i, i + job.batch);
      await applyBatch(job.db, job.lang, store, part);
      loaded += part.length;
      job.report({ stage: store, loaded, total });
    }
  }
}

/** Merges one language's files into the installed rows, reporting progress per batch. */
export async function applyLanguage(job: LanguageInstall, files: LanguageFile[]): Promise<void> {
  for (const store of ['glosses', 'translations'] as const) {
    await applyStore(
      job,
      store,
      files.filter((file) => file.store === store),
    );
  }
}
