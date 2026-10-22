import { Dexie, type EntityTable, type Table } from 'dexie';
import type {
  AiCacheEntry,
  AiLogEntry,
  Capture,
  Cluster,
  GrammarPoint,
  Item,
  ItemId,
  Kanji,
  KanjiReading,
  Note,
  Review,
  Sentence,
  Settings,
  UnitPack,
  WeeklyPlan,
  Word,
} from '../domain/types.ts';
import { type SentenceRow, sentenceKeysMiddleware } from './sentence-keys.ts';

/** Dictionary row: a word plus its readings folded to hiragana, for prefix search. */
export interface WordRow extends Word {
  kana: string[];
}

/** The single settings row. */
export interface SettingsRow extends Settings {
  key: 'app';
}

/**
 * Kanji Tutor's IndexedDB database, schema v4. It keeps its first name, `kanji-reader`, as do the
 * localStorage keys: renaming them would empty every install.
 */
export class KanjiTutorDb extends Dexie {
  words!: Table<WordRow, string>;
  kanji!: Table<Kanji, string>;
  sentences!: Table<SentenceRow, string, Sentence>;
  grammar!: Table<GrammarPoint, string>;
  items!: Table<Item, ItemId>;
  kanjiReadings!: Table<KanjiReading, string>;
  reviews!: EntityTable<Review, 'id'>;
  captures!: Table<Capture, string>;
  notes!: Table<Note, string>;
  plans!: Table<WeeklyPlan, string>;
  aiCache!: Table<AiCacheEntry, string>;
  aiLog!: EntityTable<AiLogEntry, 'id'>;
  settings!: Table<SettingsRow, 'app'>;
  clusters!: Table<Cluster, string>;
  units!: Table<UnitPack, string>;

  constructor(name = 'kanji-reader') {
    super(name);
    this.version(1).stores({
      words: 'id, *forms, *kana, common',
      kanji: 'char, phonetic, *components',
      sentences: 'id, source, *wordIds',
      grammar: 'id, lesson',
      items: 'id, kind, level, card.due, source.week, source.lesson',
      kanjiReadings: 'id, kanji',
      reviews: '++id, at, itemId',
      captures: 'id, createdAt',
      notes: 'id, createdAt',
      plans: 'id',
      aiCache: 'hash',
      aiLog: '++id, at',
      settings: 'key',
    });
    // v2: index words by JLPT level for the known-items import (K6).
    this.version(2).stores({ words: 'id, *forms, *kana, common, jlpt' });
    // v3: index kanji by JLPT level for the learned screen's coverage (P3).
    this.version(3).stores({ kanji: 'char, phonetic, *components, jlpt' });
    // v4 (D40): sentence levels and level keys (G2, G3), word clusters (V1) and units (T1).
    // Rows written before v4 have no level; the next pack update rewrites them with one.
    this.version(4).stores({
      sentences: 'id, source, *wordIds, level, *levelKeys',
      clusters: 'id, level, order, *wordIds',
      units: 'id, order',
    });
    this.use(sentenceKeysMiddleware);
  }
}

/** Stores holding the user's own data: exported in backups and cleared on a replace-import. */
export const USER_STORES = [
  'items',
  'kanjiReadings',
  'reviews',
  'grammar',
  'captures',
  'notes',
  'plans',
  'aiLog',
] as const;
