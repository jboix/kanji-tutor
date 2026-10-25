/** Saves and a server in memory, for the cloud tests. */

import { BACKUP_APP, type BackupFile } from '../data/backup-schema.ts';
import { type CloudApi, CloudError, type RemoteSave } from '../data/cloud/api.ts';
import type { SaveData } from '../data/cloud/merge.ts';
import { DEFAULT_SETTINGS } from '../domain/defaults.ts';
import type { Item, Review } from '../domain/types.ts';

export function save(data: Partial<SaveData> = {}): BackupFile {
  const {
    apiKey: _key,
    packVersion: _pack,
    packLanguages: _languages,
    ...settings
  } = DEFAULT_SETTINGS;
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: 0,
    data: {
      items: [],
      kanjiReadings: [],
      reviews: [],
      sentences: [],
      grammar: [],
      scans: [],
      notes: [],
      plans: [],
      aiLog: [],
      settings,
      ...data,
    },
  };
}

export const item = (id: string, updatedAt: number): Item => ({
  id: `word:${id}`,
  kind: 'word',
  ref: id,
  level: 1,
  source: { kind: 'manual', week: '2026-W43', addedAt: 1 },
  updatedAt,
});

export const review = (itemId: string, at: number, id?: number): Review => ({
  ...(id === undefined ? {} : { id }),
  at,
  itemId: `word:${itemId}`,
  answer: 'まって',
  expected: 'まって',
  verdict: 'correct',
  durationMs: 1000,
  mode: 'typed',
});

/** The sync server's save rules in memory: versions, 412 on a stale write, 304 when known. */
export function memoryServer() {
  const server = { data: undefined as Uint8Array<ArrayBuffer> | undefined, version: 0, puts: 0 };
  const fail = { next: undefined as CloudError['reason'] | undefined };
  const failing = () => {
    const reason = fail.next;
    fail.next = undefined;
    if (reason) throw new CloudError(reason);
  };
  const api: CloudApi = {
    post: async () => ({}) as never,
    get: async () => ({}) as never,
    remove: async () => undefined,
    getSave: async (known): Promise<RemoteSave> => {
      failing();
      if (!server.data) return { status: 'none' };
      if (known === server.version) return { status: 'same' };
      return { status: 'got', data: server.data, version: server.version };
    },
    putSave: async (data, version) => {
      failing();
      if (version !== server.version) throw new CloudError('save-changed');
      server.puts += 1;
      server.data = data;
      server.version += 1;
      return server.version;
    },
  };
  return { server, fail, api };
}
