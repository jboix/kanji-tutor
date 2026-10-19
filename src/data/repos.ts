import { DEFAULT_SETTINGS, migrateSettings } from '../domain/defaults.ts';
import type { JlptLevel } from '../domain/learner-view.ts';
import type { Repos, SentenceQuery } from '../domain/repos.ts';
import type { Sentence, Settings } from '../domain/types.ts';
import type { KanjiTutorDb } from './db.ts';
import { dexieDictionary } from './dictionary.ts';
import { grammarKey, toSentence, wordKey } from './sentence-keys.ts';
import { tableStore } from './store.ts';

/** Patching the key or the lesson to '' removes it: the field is dropped, not stored (N3, K5). */
function withoutEmptyText(settings: Settings): Settings {
  const { apiKey, currentLesson, ...rest } = settings;
  return {
    ...rest,
    ...(apiKey ? { apiKey } : {}),
    ...(currentLesson ? { currentLesson } : {}),
  };
}

function settingsRepo(db: KanjiTutorDb): Repos['settings'] {
  const get = async (): Promise<Settings> => {
    const row = await db.settings.get('app');
    if (!row) return { ...DEFAULT_SETTINGS };
    const { key: _key, ...settings } = row;
    return migrateSettings({ ...DEFAULT_SETTINGS, ...settings });
  };
  return {
    get,
    // One transaction, so a patch never overwrites a field another writer (the pack loader's
    // packVersion) set between its read and its write.
    patch: (patch) =>
      db.transaction('rw', db.settings, async () => {
        const next = withoutEmptyText({ ...(await get()), ...patch });
        await db.settings.put({ ...next, key: 'app' });
        return next;
      }),
  };
}

function itemRepo(db: KanjiTutorDb): Repos['items'] {
  return {
    ...tableStore(db.items),
    byKind: (kind) => db.items.where('kind').equals(kind).toArray(),
    dueBefore: (at) => db.items.where('card.due').belowOrEqual(at).sortBy('card.due'),
    byWeek: (week) => db.items.where('source.week').equals(week).toArray(),
    byLesson: (lesson) => db.items.where('source.lesson').equals(lesson).toArray(),
  };
}

function readingRepo(db: KanjiTutorDb): Repos['kanjiReadings'] {
  return {
    ...tableStore(db.kanjiReadings),
    byKanji: (char) => db.kanjiReadings.where('kanji').equals(char).toArray(),
  };
}

function reviewRepo(db: KanjiTutorDb): Repos['reviews'] {
  return {
    add: (review) => db.reviews.add(review) as Promise<number>,
    since: (at) => db.reviews.where('at').aboveOrEqual(at).toArray(),
    byItem: (itemId) => db.reviews.where('itemId').equals(itemId).toArray(),
    all: () => db.reviews.toArray(),
  };
}

/**
 * Sentences whose level key for `prefix` (a word or grammar key) is at `maxLevel` or easier,
 * easiest first: one range of the `levelKeys` index (D40).
 */
async function byLevelKey(
  db: KanjiTutorDb,
  key: (level: JlptLevel) => string,
  query: SentenceQuery,
): Promise<Sentence[]> {
  const range = db.sentences
    .where('levelKeys')
    .between(key(query.maxLevel ?? 1), key(5), true, true)
    .reverse();
  const rows = await (query.limit === undefined ? range : range.limit(query.limit)).toArray();
  return rows.map(toSentence);
}

function sentenceRepo(db: KanjiTutorDb): Repos['sentences'] {
  const store = tableStore(db.sentences);
  return {
    ...store,
    get: async (id) => {
      const row = await db.sentences.get(id);
      return row && toSentence(row);
    },
    getMany: async (ids) =>
      (await db.sentences.bulkGet([...ids])).map((row) => row && toSentence(row)),
    all: async () => (await db.sentences.toArray()).map(toSentence),
    containingWord: async (wordId, query) => {
      if (query?.maxLevel === undefined && query?.limit === undefined) {
        return (await db.sentences.where('wordIds').equals(wordId).toArray()).map(toSentence);
      }
      return byLevelKey(db, (level) => wordKey(wordId, level), query);
    },
    withGrammar: (grammarId, query = {}) =>
      byLevelKey(db, (level) => grammarKey(grammarId, level), query),
    atLevel: async (level, limit) => {
      const rows = db.sentences.where('level').equals(level);
      return (await (limit === undefined ? rows : rows.limit(limit)).toArray()).map(toSentence);
    },
    bySource: async (source) =>
      (await db.sentences.where('source').equals(source).toArray()).map(toSentence),
  };
}

function packRepos(db: KanjiTutorDb): Pick<Repos, 'clusters' | 'units'> {
  return {
    clusters: {
      get: (id) => db.clusters.get(id),
      byLevel: (level) => db.clusters.where('level').equals(level).sortBy('order'),
      ofWord: (wordId) => db.clusters.where('wordIds').equals(wordId).sortBy('order'),
      all: () => db.clusters.orderBy('order').toArray(),
    },
    units: {
      get: (id) => db.units.get(id),
      all: () => db.units.orderBy('order').toArray(),
    },
  };
}

function captureRepo(db: KanjiTutorDb): Repos['captures'] {
  return {
    ...tableStore(db.captures),
    recent: (limit) => db.captures.orderBy('createdAt').reverse().limit(limit).toArray(),
  };
}

function aiRepos(db: KanjiTutorDb): Pick<Repos, 'aiCache' | 'aiLog'> {
  return {
    aiCache: {
      get: (hash) => db.aiCache.get(hash),
      put: async (entry) => {
        await db.aiCache.put(entry);
      },
      clear: () => db.aiCache.clear(),
    },
    aiLog: {
      add: async (entry) => {
        await db.aiLog.add(entry);
      },
      since: (at) => db.aiLog.where('at').aboveOrEqual(at).toArray(),
    },
  };
}

/** Creates every repository over one Dexie database. */
export function createDexieRepos(db: KanjiTutorDb): Repos {
  return {
    items: itemRepo(db),
    kanjiReadings: readingRepo(db),
    reviews: reviewRepo(db),
    sentences: sentenceRepo(db),
    grammar: tableStore(db.grammar),
    captures: captureRepo(db),
    notes: tableStore(db.notes),
    plans: tableStore(db.plans),
    settings: settingsRepo(db),
    ...aiRepos(db),
    ...packRepos(db),
    dictionary: dexieDictionary(db),
  };
}
