/**
 * Repository ports. Pure interfaces implemented by `src/data` (Dexie) and by in-memory fakes in
 * tests. Features reach them through `useServices()` from `src/ui/services.tsx`.
 */

import type { JlptLevel } from './learner-view.ts';
import type { ScannedLesson } from './scan-types.ts';
import type {
  AiCacheEntry,
  AiLogEntry,
  Cluster,
  GrammarPoint,
  Item,
  ItemId,
  ItemKind,
  Kanji,
  KanjiReading,
  Note,
  Review,
  Sentence,
  SentenceSource,
  Settings,
  UnitPack,
  WeeklyPlan,
  Word,
} from './types.ts';
import type { WildPhoto } from './wild-types.ts';

/** Basic keyed store. */
export interface Store<T, K extends string = string> {
  get(key: K): Promise<T | undefined>;
  getMany(keys: readonly K[]): Promise<(T | undefined)[]>;
  put(value: T): Promise<void>;
  putMany(values: readonly T[]): Promise<void>;
  delete(key: K): Promise<void>;
  all(): Promise<T[]>;
  count(): Promise<number>;
}

export interface ItemRepo extends Store<Item, ItemId> {
  byKind(kind: ItemKind): Promise<Item[]>;
  /** Items with an FSRS card due at or before `at` (epoch ms), soonest first. */
  dueBefore(at: number): Promise<Item[]>;
  byWeek(week: string): Promise<Item[]>;
  byLesson(lesson: string): Promise<Item[]>;
}

export interface KanjiReadingRepo extends Store<KanjiReading> {
  byKanji(char: string): Promise<KanjiReading[]>;
}

export interface ReviewRepo {
  add(review: Review): Promise<number>;
  since(at: number): Promise<Review[]>;
  byItem(itemId: ItemId): Promise<Review[]>;
  /** The reviews of any of these items, in one read. */
  byItems(itemIds: readonly ItemId[]): Promise<Review[]>;
  all(): Promise<Review[]>;
  count(): Promise<number>;
}

/** Level gate and size of a sentence query (G3). */
export interface SentenceQuery {
  /**
   * Hardest level allowed: 4 returns N5 and N4 sentences. Sentences without a `level` are left
   * out when this is set.
   */
  maxLevel?: JlptLevel;
  /** At most this many, easiest first. */
  limit?: number;
}

export interface SentenceRepo extends Store<Sentence> {
  /**
   * Sentences whose tokens include this JMdict word id. With `maxLevel` or `limit`, only
   * sentences at or below that level, easiest first.
   */
  containingWord(wordId: string, query?: SentenceQuery): Promise<Sentence[]>;
  /** Sentences that use this catalogue grammar point, easiest first. */
  withGrammar(grammarId: string, query?: SentenceQuery): Promise<Sentence[]>;
  /** Sentences at exactly this level. */
  atLevel(level: JlptLevel, limit?: number): Promise<Sentence[]>;
  bySource(source: SentenceSource): Promise<Sentence[]>;
}

/** Word clusters from the packs (V1), on their path order. */
export interface ClusterRepo {
  get(id: string): Promise<Cluster | undefined>;
  /** Clusters of one level, in path order. */
  byLevel(level: JlptLevel): Promise<Cluster[]>;
  /** The clusters that contain this word (usually one). */
  ofWord(wordId: string): Promise<Cluster[]>;
  all(): Promise<Cluster[]>;
}

/** Thematic units resolved against the packs (T1–T3), in path order. */
export interface UnitRepo {
  get(id: string): Promise<UnitPack | undefined>;
  all(): Promise<UnitPack[]>;
}

/** Scanned lessons, newest first when listed. */
export interface ScanRepo extends Store<ScannedLesson> {
  recent(limit: number): Promise<ScannedLesson[]>;
}

export interface SettingsRepo {
  get(): Promise<Settings>;
  patch(patch: Partial<Settings>): Promise<Settings>;
}

export interface AiCacheRepo {
  get(hash: string): Promise<AiCacheEntry | undefined>;
  put(entry: AiCacheEntry): Promise<void>;
  clear(): Promise<void>;
}

export interface AiLogRepo {
  add(entry: AiLogEntry): Promise<void>;
  since(at: number): Promise<AiLogEntry[]>;
}

/** Read-only dictionary packs (words, kanji), loaded once on first run (N4). */
export interface DictionaryRepo {
  word(id: string): Promise<Word | undefined>;
  words(ids: readonly string[]): Promise<(Word | undefined)[]>;
  /** Words with this exact kanji writing or kana reading. */
  wordsByText(text: string): Promise<Word[]>;
  /** Words whose reading starts with this kana, common words first. */
  wordsByReadingPrefix(kana: string, limit: number): Promise<Word[]>;
  kanji(char: string): Promise<Kanji | undefined>;
  kanjiMany(chars: readonly string[]): Promise<(Kanji | undefined)[]>;
  /** Kanji that share this phonetic component. */
  kanjiByPhonetic(component: string): Promise<Kanji[]>;
  /** Kanji that contain this visual component. */
  kanjiByComponent(component: string): Promise<Kanji[]>;
  wordCount(): Promise<number>;
  /**
   * Optional: words on an approximate JLPT list (needs a `jlpt` index). Without it, the
   * known-words import scans by reading prefix instead (K6).
   */
  wordsByJlpt?(level: 5 | 4 | 3 | 2 | 1): Promise<Word[]>;
  /**
   * Optional: kanji of a JLPT level (needs a `jlpt` index on kanji). Without it, the learned
   * screen falls back to the kanji of that level's words (P3).
   */
  kanjiByJlpt?(level: 5 | 4 | 3 | 2 | 1): Promise<Kanji[]>;
}

/** Everything the app persists, grouped by store. */
export interface Repos {
  items: ItemRepo;
  kanjiReadings: KanjiReadingRepo;
  reviews: ReviewRepo;
  sentences: SentenceRepo;
  grammar: Store<GrammarPoint>;
  scans: ScanRepo;
  /** In the wild's photos, kept on this device only (not in backups: photos are large). */
  wildPhotos: Store<WildPhoto>;
  notes: Store<Note>;
  plans: Store<WeeklyPlan>;
  settings: SettingsRepo;
  aiCache: AiCacheRepo;
  aiLog: AiLogRepo;
  dictionary: DictionaryRepo;
  clusters: ClusterRepo;
  units: UnitRepo;
}

/** Backup as JSON text, so features never see storage types (K7). */
export interface BackupPort {
  exportJson(): Promise<string>;
  /** Validates and replaces all user data; the API key and dictionary packs are kept. */
  importJson(text: string): Promise<{ ok: true } | { ok: false; error: string }>;
  /**
   * Deletes everything this app keeps on the device: the database (progress, settings, the key,
   * the AI cache, the dictionary), local storage, the offline caches and the service worker.
   */
  eraseAll(): Promise<void>;
}

/** One file of a pack set, as listed in `public/packs/manifest.json`. */
export interface PackFile {
  store: 'words' | 'kanji' | 'sentences' | 'grammar' | 'clusters' | 'units';
  url: string;
  bytes: number;
  count: number;
}

/** A language pack's file: glosses per word or translations per sentence (N9). */
export interface LanguageFile {
  store: 'glosses' | 'translations';
  url: string;
  bytes: number;
  count: number;
}

/** Language codes with an optional pack (BCP-47). English is in the base pack. */
export type PackLanguage = 'fr' | 'es';

export interface PackManifest {
  version: string;
  files: PackFile[];
  /** Optional language packs, installed only on request (N9). */
  languages?: Partial<Record<PackLanguage, LanguageFile[]>>;
}

export interface PackProgress {
  stage: PackFile['store'] | LanguageFile['store'] | 'done';
  /** Rows loaded and to load in this stage. */
  loaded: number;
  total: number;
  /**
   * How far the whole item is, 0 to 1, when the loader knows: the dictionary, or a
   * language pack.
   */
  overall?: number;
  /** Set while a language pack (meanings and translations) loads. */
  language?: PackLanguage;
}

/** First-run loader for the dictionary packs into IndexedDB (N4). */
export interface PackLoader {
  /** Version currently in IndexedDB, if any. */
  installed(): Promise<string | undefined>;
  manifest(): Promise<PackManifest>;
  /**
   * Installs or updates the base packs, then re-applies the installed language packs. Grammar
   * points merge by id: the learner's own points and every item's progress are kept.
   */
  install(onProgress: (progress: PackProgress) => void): Promise<void>;
  /** Optional: installs one language pack (glosses and translations) for the installed version. */
  installLanguage?(
    language: PackLanguage,
    onProgress: (progress: PackProgress) => void,
  ): Promise<void>;
  /** Optional: the language packs installed, e.g. ["fr"]. */
  installedLanguages?(): Promise<PackLanguage[]>;
}
