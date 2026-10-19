import { gzipSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PackManifest, PackProgress } from '../domain/repos.ts';
import type { Kanji, Sentence, Word } from '../domain/types.ts';
import { KanjiTutorDb } from './db.ts';
import { createPackLoader } from './packs.ts';
import { createDexieRepos } from './repos.ts';

const words: Word[] = [
  { id: '1358280', forms: ['持つ'], readings: ['もつ'], glosses: ['to hold'], common: true },
  { id: '1416650', forms: ['駅'], readings: ['えき'], glosses: ['station'], common: true },
  { id: '1080510', forms: [], readings: ['テレビ'], glosses: ['television'], common: true },
];
const kanji: Kanji[] = [
  { char: '待', meanings: ['wait'], on: ['タイ'], kun: ['ま.つ'], components: ['彳', '寺'] },
];
const sentence = (id: string, source: Sentence['source']): Sentence => ({
  id,
  text: '駅で待つ。',
  source,
  tokens: [],
  wordIds: ['1416650'],
  verified: true,
});

function manifest(version: string): PackManifest {
  return {
    version,
    files: [
      { store: 'words', url: `${version}/words-00.json.gz`, bytes: 1, count: 2 },
      { store: 'words', url: `${version}/words-01.json.gz`, bytes: 1, count: 1 },
      { store: 'kanji', url: `${version}/kanji-00.json.gz`, bytes: 1, count: 1 },
      { store: 'sentences', url: `${version}/sentences-00.json.gz`, bytes: 1, count: 1 },
    ],
  };
}

function serve(version: string, options: { plain?: boolean } = {}) {
  const bodies: Record<string, unknown> = {
    '/packs/manifest.json': manifest(version),
    [`/packs/${version}/words-00.json.gz`]: words.slice(0, 2),
    [`/packs/${version}/words-01.json.gz`]: words.slice(2),
    [`/packs/${version}/kanji-00.json.gz`]: kanji,
    [`/packs/${version}/sentences-00.json.gz`]: [sentence(`tatoeba:${version}`, 'tatoeba')],
  };
  const fetchMock = vi.fn(async (url: string) => {
    const body = bodies[url];
    if (body === undefined) return new Response('missing', { status: 404 });
    const json = Buffer.from(JSON.stringify(body));
    const bytes = url.endsWith('.gz') && !options.plain ? gzipSync(json) : json;
    return new Response(new Uint8Array(bytes));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('createPackLoader', () => {
  let db: KanjiTutorDb;

  beforeEach(() => {
    db = new KanjiTutorDb(`packs-${Math.random()}`);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await db.delete();
  });

  it('reads the manifest and reports nothing installed at first', async () => {
    serve('v1');
    const loader = createPackLoader(db, '/packs/');
    expect((await loader.manifest()).version).toBe('v1');
    expect(await loader.installed()).toBeUndefined();
  });

  it('installs every store, reports progress per batch and records the version', async () => {
    serve('v1');
    const progress: PackProgress[] = [];
    await createPackLoader(db, '/packs/').install((p) => progress.push(p));
    expect(progress).toEqual([
      { stage: 'words', loaded: 2, total: 3 },
      { stage: 'words', loaded: 3, total: 3 },
      { stage: 'kanji', loaded: 1, total: 1 },
      { stage: 'sentences', loaded: 1, total: 1 },
      { stage: 'done', loaded: 5, total: 5 },
    ]);
    const repos = createDexieRepos(db);
    expect(await repos.dictionary.wordCount()).toBe(3);
    expect((await repos.dictionary.wordsByText('てれび'))[0]?.id).toBe('1080510');
    expect((await repos.dictionary.kanjiByComponent('寺'))[0]?.char).toBe('待');
    expect(await repos.sentences.containingWord('1416650')).toHaveLength(1);
    expect(await createPackLoader(db, '/packs/').installed()).toBe('v1');
  });

  it('keeps other settings when it records the version', async () => {
    serve('v1');
    const repos = createDexieRepos(db);
    await repos.settings.patch({ apiKey: 'k', onboarded: true });
    await createPackLoader(db, '/packs/').install(() => undefined);
    expect(await repos.settings.get()).toMatchObject({
      apiKey: 'k',
      onboarded: true,
      packVersion: 'v1',
    });
  });

  it('replaces old pack rows on a new version but keeps user sentences', async () => {
    serve('v1');
    await createPackLoader(db, '/packs/').install(() => undefined);
    await db.sentences.put(sentence('capture:1', 'capture'));
    await db.words.put({
      id: 'old',
      forms: [],
      readings: ['ふるい'],
      kana: [],
      glosses: [],
      common: false,
    });
    serve('v2');
    await createPackLoader(db, '/packs/').install(() => undefined);
    const ids = (await db.sentences.toArray()).map((s) => s.id).sort();
    expect(ids).toEqual(['capture:1', 'tatoeba:v2']);
    expect(await db.words.get('old')).toBeUndefined();
    expect(await createPackLoader(db, '/packs/').installed()).toBe('v2');
  });

  it('keeps the installed dictionary and version when an update is interrupted', async () => {
    serve('v1');
    await createPackLoader(db, '/packs/').install(() => undefined);
    const fetchMock = serve('v2');
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('manifest.json')
        ? Response.json(manifest('v2'))
        : new Response('offline', { status: 503 }),
    );
    await expect(createPackLoader(db, '/packs/').install(() => undefined)).rejects.toThrow();
    expect(await createPackLoader(db, '/packs/').installed()).toBe('v1');
    expect(await db.words.count()).toBe(3);
    expect(await db.sentences.get('tatoeba:v1')).toBeDefined();
  });

  it('accepts files the server already decompressed', async () => {
    serve('v1', { plain: true });
    await createPackLoader(db, '/packs/').install(() => undefined);
    expect(await db.words.count()).toBe(3);
  });

  it('fails without recording a version when a file is missing', async () => {
    const fetchMock = serve('v1');
    fetchMock.mockImplementationOnce(async () => Response.json(manifest('v1')));
    fetchMock.mockImplementationOnce(async () => new Response('gone', { status: 404 }));
    await expect(createPackLoader(db, '/packs/').install(() => undefined)).rejects.toThrow(
      /HTTP 404/,
    );
    expect(await createPackLoader(db, '/packs/').installed()).toBeUndefined();
  });
});
