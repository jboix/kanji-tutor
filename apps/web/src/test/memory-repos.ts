/**
 * In-memory `Repos` for unit and component tests in any workstream. Behaves like the Dexie repos
 * closely enough for feature logic; pass a dictionary to replace the sample one.
 */
import { DEFAULT_SETTINGS } from '../domain/defaults.ts';
import type { DictionaryRepo, Repos, SentenceQuery, Store } from '../domain/repos.ts';
import type { ScannedLesson } from '../domain/scan-types.ts';
import type {
  AiCacheEntry,
  AiLogEntry,
  Cluster,
  Item,
  Kanji,
  KanjiReading,
  Review,
  Sentence,
  Settings,
  UnitPack,
  Word,
} from '../domain/types.ts';
import { createFakeDictionary } from '../lang/testing/fake-dictionary.ts';

function memoryStore<T, K extends string>(
  keyOf: (value: T) => K,
): Store<T, K> & { map: Map<K, T> } {
  const map = new Map<K, T>();
  return {
    map,
    get: async (key) => structuredClone(map.get(key)),
    getMany: async (keys) => keys.map((key) => structuredClone(map.get(key))),
    put: async (value) => {
      map.set(keyOf(value), structuredClone(value));
    },
    putMany: async (values) => {
      for (const value of values) map.set(keyOf(value), structuredClone(value));
    },
    delete: async (key) => {
      map.delete(key);
    },
    all: async () => [...map.values()].map((value) => structuredClone(value)),
    count: async () => map.size,
  };
}

function itemRepo(): Repos['items'] {
  const store = memoryStore<Item, Item['id']>((item) => item.id);
  const where = async (test: (item: Item) => boolean) => (await store.all()).filter(test);
  return {
    ...store,
    byKind: (kind) => where((item) => item.kind === kind),
    dueBefore: async (at) =>
      (await where((item) => item.card !== undefined && item.card.due <= at)).sort(
        (a, b) => (a.card?.due ?? 0) - (b.card?.due ?? 0),
      ),
    byWeek: (week) => where((item) => item.source.week === week),
    byLesson: (lesson) => where((item) => item.source.lesson === lesson),
  };
}

function reviewRepo(): Repos['reviews'] {
  const rows: Review[] = [];
  return {
    add: async (review) => {
      const id = rows.length + 1;
      rows.push({ ...structuredClone(review), id });
      return id;
    },
    since: async (at) => rows.filter((row) => row.at >= at).map((row) => structuredClone(row)),
    byItem: async (itemId) => rows.filter((row) => row.itemId === itemId),
    byItems: async (itemIds) => rows.filter((row) => itemIds.includes(row.itemId)),
    all: async () => rows.map((row) => structuredClone(row)),
    count: async () => rows.length,
  };
}

function settingsRepo(initial: Partial<Settings>): Repos['settings'] {
  let settings: Settings = { ...DEFAULT_SETTINGS, ...initial };
  return {
    get: async () => ({ ...settings }),
    patch: async (patch) => {
      settings = { ...settings, ...patch };
      return { ...settings };
    },
  };
}

const easiestFirst = (a: Sentence, b: Sentence) => (b.level ?? 0) - (a.level ?? 0);

/** Like the Dexie `levelKeys` queries: leveled sentences at or below `maxLevel`, easiest first. */
function gated(rows: Sentence[], query: SentenceQuery | undefined): Sentence[] {
  if (query?.maxLevel === undefined && query?.limit === undefined) return rows;
  const max = query.maxLevel ?? 1;
  const kept = rows.filter((s) => s.level !== undefined && s.level >= max).sort(easiestFirst);
  return query.limit === undefined ? kept : kept.slice(0, query.limit);
}

function memorySentences(
  sentences: Store<Sentence, string> & { map: Map<string, Sentence> },
): Repos['sentences'] {
  // Filters before cloning: property tests query every fixture sentence many times.
  const where = async (test: (s: Sentence) => boolean) =>
    [...sentences.map.values()].filter(test).map((s) => structuredClone(s));
  return {
    ...sentences,
    containingWord: async (id, query) => gated(await where((s) => s.wordIds.includes(id)), query),
    withGrammar: async (id, query = {}) =>
      gated(await where((s) => (s.grammarIds ?? []).includes(id)), query),
    atLevel: async (level, limit) => (await where((s) => s.level === level)).slice(0, limit),
    bySource: (source) => where((s) => s.source === source),
  };
}

function memoryPacks(): Pick<Repos, 'clusters' | 'units'> {
  const clusters = memoryStore<Cluster, string>((row) => row.id);
  const units = memoryStore<UnitPack, string>((row) => row.id);
  const ordered = async <T extends { order: number }>(rows: Promise<T[]>) =>
    (await rows).sort((a, b) => a.order - b.order);
  return {
    clusters: {
      ...clusters,
      byLevel: async (level) =>
        ordered(clusters.all()).then((all) => all.filter((c) => c.level === level)),
      ofWord: async (id) =>
        ordered(clusters.all()).then((all) => all.filter((c) => c.wordIds.includes(id))),
      all: () => ordered(clusters.all()),
    },
    units: { ...units, all: () => ordered(units.all()) },
  };
}

/** Fresh in-memory repositories. */
export function createMemoryRepos(
  options: { dictionary?: DictionaryRepo; settings?: Partial<Settings> } = {},
): Repos {
  const sentences = memoryStore<Sentence, string>((row) => row.id);
  const readings = memoryStore<KanjiReading, string>((row) => row.id);
  const scans = memoryStore<ScannedLesson, string>((row) => row.id);
  const cache = new Map<string, AiCacheEntry>();
  const log: AiLogEntry[] = [];
  return {
    items: itemRepo(),
    kanjiReadings: {
      ...readings,
      byKanji: async (char) => (await readings.all()).filter((row) => row.kanji === char),
    },
    reviews: reviewRepo(),
    sentences: memorySentences(sentences),
    grammar: memoryStore((row) => row.id),
    scans: {
      ...scans,
      recent: async (limit) =>
        (await scans.all()).sort((a, b) => b.createdAt - a.createdAt).slice(0, limit),
    },
    notes: memoryStore((row) => row.id),
    plans: memoryStore((row) => row.id),
    settings: settingsRepo(options.settings ?? {}),
    aiCache: {
      get: async (hash) => cache.get(hash),
      put: async (entry) => {
        cache.set(entry.hash, entry);
      },
      clear: async () => cache.clear(),
    },
    aiLog: {
      add: async (entry) => {
        log.push(entry);
      },
      since: async (at) => log.filter((entry) => entry.at >= at),
    },
    ...memoryPacks(),
    dictionary: options.dictionary ?? createFakeDictionary(),
  };
}

/** Fresh in-memory repositories over a small dictionary of these words and kanji. */
export function dictionaryRepos(words: readonly Word[], kanji: readonly Kanji[]): Repos {
  return createMemoryRepos({ dictionary: createFakeDictionary(words, kanji) });
}
