import type { Capture, Settings } from '../domain/types.ts';
import { BACKUP_APP, type BackupFile, backupSchema } from './backup-schema.ts';
import { type KanjiTutorDb, USER_STORES } from './db.ts';
import { PACK_SOURCES } from './pack-stores.ts';
import { createDexieRepos } from './repos.ts';
import { toSentence } from './sentence-keys.ts';

export type { BackupFile } from './backup-schema.ts';

async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  // Chunked: one String.fromCharCode call per 32 KB, so multi-MB photos stay fast.
  let binary = '';
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000));
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

function dataUrlToBlob(url: string): Blob {
  const [head = '', body = ''] = url.split(',', 2);
  const type = head.slice(5).replace(';base64', '');
  const binary = atob(body);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type });
}

async function exportCapture(capture: Capture): Promise<BackupFile['data']['captures'][number]> {
  const { photo, ...rest } = capture;
  return photo ? { ...rest, photo: await blobToDataUrl(photo) } : rest;
}

/**
 * The key never leaves the device (N3); the pack version and languages describe this device's
 * dictionary.
 */
function portableSettings(settings: Settings): BackupFile['data']['settings'] {
  const {
    apiKey: _apiKey,
    packVersion: _packVersion,
    packLanguages: _languages,
    ...rest
  } = settings;
  return rest;
}

/** Serialises all user data into one backup object (K7). */
export async function exportBackup(db: KanjiTutorDb, now = Date.now()): Promise<BackupFile> {
  const settings = await createDexieRepos(db).settings.get();
  const userSentences = (await db.sentences.where('source').noneOf(PACK_SOURCES).toArray()).map(
    toSentence,
  );
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: now,
    data: {
      items: await db.items.toArray(),
      kanjiReadings: await db.kanjiReadings.toArray(),
      reviews: await db.reviews.toArray(),
      sentences: userSentences,
      grammar: await db.grammar.toArray(),
      captures: await Promise.all((await db.captures.toArray()).map(exportCapture)),
      notes: await db.notes.toArray(),
      plans: await db.plans.toArray(),
      aiLog: await db.aiLog.toArray(),
      settings: portableSettings(settings),
    },
  };
}

/** Result of validating a backup before import. */
export type ParsedBackup = { ok: true; backup: BackupFile } | { ok: false; error: string };

/** Validates untrusted JSON as a backup file. */
export function parseBackup(json: unknown): ParsedBackup {
  const parsed = backupSchema.safeParse(json);
  if (parsed.success) return { ok: true, backup: parsed.data };
  const issue = parsed.error.issues[0];
  return { ok: false, error: `${issue?.path.join('.') ?? ''}: ${issue?.message ?? 'invalid'}` };
}

/**
 * Replaces all user data with the backup's contents. Dictionary packs, Tatoeba sentences, the AI
 * cache and the API key stay as they are.
 */
export async function importBackup(db: KanjiTutorDb, backup: BackupFile): Promise<void> {
  const { data } = backup;
  const captures = data.captures.map(({ photo, ...rest }) =>
    photo ? { ...rest, photo: dataUrlToBlob(photo) } : rest,
  );
  const tables = [...USER_STORES.map((name) => db.table(name)), db.sentences, db.settings];
  await db.transaction('rw', tables, async () => {
    await Promise.all(USER_STORES.map((name) => db.table(name).clear()));
    await db.sentences.where('source').noneOf(PACK_SOURCES).delete();
    await db.items.bulkPut(data.items);
    await db.kanjiReadings.bulkPut(data.kanjiReadings);
    await db.reviews.bulkPut(data.reviews);
    await db.sentences.bulkPut(data.sentences);
    await db.grammar.bulkPut(data.grammar);
    await db.captures.bulkPut(captures);
    await db.notes.bulkPut(data.notes);
    await db.plans.bulkPut(data.plans);
    await db.aiLog.bulkPut(data.aiLog);
    const current = await db.settings.get('app');
    // Keep this device's key and dictionary version; a backup's packVersion (older files) would
    // otherwise tell the pack gate that a dictionary is installed when it is not.
    const { packVersion: _packVersion, packLanguages: _languages, ...restored } = data.settings;
    const apiKey = current?.apiKey ? { apiKey: current.apiKey } : {};
    const packs = {
      ...(current?.packVersion ? { packVersion: current.packVersion } : {}),
      ...(current?.packLanguages ? { packLanguages: current.packLanguages } : {}),
    };
    await db.settings.put({ ...restored, ...apiKey, ...packs, key: 'app' });
  });
}
