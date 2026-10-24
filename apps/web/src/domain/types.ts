/**
 * Core domain types shared by every layer. Pure TypeScript: no React, Dexie or network.
 * Field names are stable: they are persisted in IndexedDB and in backup files (K7).
 */

/** 0 unseen · 1 seen · 2 knows meaning · 3 reads in a familiar word · 4 reads in a new word or sentence (K2). */
import type { LessonSection, SectionProgress } from './lesson-types.ts';
import type {
  ImmersionSetting,
  OnboardingKnown,
  PracticeChoice,
  SessionMinutes,
  TutorMode,
} from './settings-types.ts';

export type { AiCacheEntry, AiLogEntry } from './ai-log-types.ts';
export type { LessonSection, SectionProgress } from './lesson-types.ts';
export type {
  ImmersionMode,
  ImmersionSetting,
  OnboardingKnown,
  PracticeChoice,
  SessionMinutes,
  TutorMode,
} from './settings-types.ts';

export type KnowledgeLevel = 0 | 1 | 2 | 3 | 4;

/** The four kinds of tracked items (K1). */
export type ItemKind = 'word' | 'kanji' | 'kanjiReading' | 'grammar';

/**
 * Stable item key: `word:<JMdict seq>`, `kanji:<char>`, `kanjiReading:<char>:<reading>`,
 * `grammar:<grammar id>`. Build them with `itemId()` from `src/domain/ids.ts`.
 */
export type ItemId = `${ItemKind}:${string}`;

/** Where an item came from (K5). */
export type SourceKind = 'textbook' | 'capture' | 'manual' | 'import' | 'compose' | 'session';

export interface Source {
  kind: SourceKind;
  /** Free-text lesson tag chosen by the user, e.g. "Tobira 第4課" or "Minna 第12課". */
  lesson?: string;
  /** Capture this item was added from, when `kind === 'capture'`. */
  captureId?: string;
  /** ISO week the item belongs to, e.g. "2026-W42" (school week). */
  week: string;
  /** Epoch milliseconds. */
  addedAt: number;
}

/** FSRS card state, serialisable. Mirrors ts-fsrs `Card` with dates as epoch ms (K4). */
export interface CardState {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  /** ts-fsrs `State`: 0 New, 1 Learning, 2 Review, 3 Relearning. */
  state: 0 | 1 | 2 | 3;
  lastReview?: number;
}

/** A tracked item with its knowledge level. Words and grammar points carry an FSRS card. */
export interface Item {
  id: ItemId;
  kind: ItemKind;
  /** The referenced entity: JMdict seq, kanji char, `<char>:<reading>`, or grammar id. */
  ref: string;
  level: KnowledgeLevel;
  card?: CardState;
  source: Source;
  updatedAt: number;
}

/** Dictionary word (JMdict entry, pruned). Read-only pack data. */
export interface Word {
  /** JMdict entry sequence number, as a string. */
  id: string;
  /** Kanji writings, most common first. Empty for kana-only words. */
  forms: string[];
  /** Kana readings (hiragana or katakana as in JMdict), most common first. */
  readings: string[];
  /** English glosses, most important sense first. */
  glosses: string[];
  common: boolean;
  /** Approximate JLPT level, when known. No official lists exist. */
  jlpt?: 5 | 4 | 3 | 2 | 1;
  /** Parts of speech of the first sense (JMdict tags, e.g. "v5r", "n", "adj-na"). */
  pos?: string[];
  /**
   * Valid but less usual readings of the first form, meaning the same as `readings[0]`, its
   * preferred reading: 日本人 has にっぽんじん. Accepted when typed, never shown.
   */
  variants?: string[];
  /**
   * Glosses in other languages, keyed by BCP-47 code ("fr", "es"), from an installed language
   * pack (N9). A missing language means: fall back to `glosses` (English) and mark it.
   */
  glossesByLang?: Record<string, string[]>;
}

/** Kanji entry (KANJIDIC2, pruned). Read-only pack data. */
export interface Kanji {
  char: string;
  meanings: string[];
  /** On'yomi in katakana, e.g. "セイ". */
  on: string[];
  /** Kun'yomi in hiragana with "." before okurigana, e.g. "い.きる". */
  kun: string[];
  strokes?: number;
  grade?: number;
  jlpt?: 5 | 4 | 3 | 2 | 1;
  /** Frequency rank among newspaper kanji (lower is more common). */
  freq?: number;
  /** Visual components (radicals and parts), e.g. ["彳", "寺"] for 待. */
  components: string[];
  /** Phonetic component shared with a sound family, e.g. "青" for 清 晴 精. */
  phonetic?: string;
}

/** A kanji–reading pair with a level derived from the words that prove it (K3). */
export interface KanjiReading {
  /** `<char>:<reading>`, e.g. "生:セイ" or "生:い.きる". */
  id: string;
  kanji: string;
  /** On in katakana, kun in hiragana with "." before okurigana. */
  reading: string;
  level: KnowledgeLevel;
  /** Word ids whose known readings prove this kanji reading. */
  wordIds: string[];
}

export interface GrammarPoint {
  /** Slug, e.g. "wake-dewa-nai". */
  id: string;
  /** As written in the textbook, e.g. "〜わけではない". */
  pattern: string;
  meaning: string;
  lesson?: string;
  /** JLPT level of the point, when the catalogue gives one ("other" on the learned screen). */
  level?: 5 | 4 | 3;
  exampleSentenceIds: string[];
  /** Installed from the grammar catalogue pack; pack updates may refresh it. */
  catalogue?: true;
}

/** One token from the tokenizer, aligned to the sentence text. */
export interface Token {
  surface: string;
  /** Reading in hiragana, as the tokenizer (or pre-tokenizer) derived it. */
  reading: string;
  /** Dictionary form. */
  base: string;
  /** Coarse part of speech, e.g. "noun", "verb", "particle", "symbol". */
  pos: string;
  /** JMdict id the token resolved to, if any. */
  wordId?: string;
  /**
   * Other usual readings of this writing, when `reading` is the preferred one of several:
   * 日本人 にほんじん has にっぽんじん. Accepted when typed, but never shown or offered as wrong.
   */
  variants?: string[];
  /** Start offset in UTF-16 code units within the sentence text. */
  start: number;
}

/** `tatoeba` and `unit` (thematic unit passages) come from the packs; the others are the learner's. */
export type SentenceSource = 'tatoeba' | 'unit' | 'capture' | 'ai' | 'compose';

export interface Sentence {
  id: string;
  text: string;
  translation?: string;
  source: SentenceSource;
  /** Tatoeba id, capture id, or compose item id. */
  sourceRef?: string;
  tokens: Token[];
  /** Distinct word ids of the tokens, for indexing. */
  wordIds: string[];
  /** Grammar point ids the sentence exercises, when known. */
  grammarIds?: string[];
  /**
   * Hardest JLPT level among its kanji words, kanji and grammar (G2); untagged words count
   * as N1. Absent on sentences saved before levels were computed: level-gated queries skip them.
   */
  level?: 5 | 4 | 3 | 2 | 1;
  /** Translations in other languages, keyed by BCP-47 code ("fr", "es"), when installed (N9). */
  translations?: Record<string, string>;
  /** False for AI sentences that have not passed verification; never shown in sessions. */
  verified: boolean;
  /** A captured line the tutor read from a photo (OCR): it keeps a tutor mark (A18). */
  aiRead?: true;
}

/** A small group of words of one JLPT level linked by a shared kanji or co-occurrence (V1). */
export interface Cluster {
  /** `c<level>-<seed word id>`, e.g. "c5-1416650". */
  id: string;
  level: 5 | 4 | 3 | 2 | 1;
  /** Position on the cluster path: level N5 first, then by frequency. */
  order: number;
  /** The shared kanji, or the most frequent word's form. */
  name: string;
  /** The kanji every word shares, when there is one. */
  kanji?: string;
  /** 5–8 word ids, most frequent first. */
  wordIds: string[];
}

/** A thematic unit resolved against the packs (T1–T3). Its text lives in `src/domain/themes`. */
export interface UnitPack {
  /** The unit's id in `src/domain/themes`. */
  id: string;
  order: number;
  level: 5 | 4 | 3;
  /** JMdict ids of the unit's words, in the unit's order (unresolved words are left out). */
  wordIds: string[];
  /** Catalogue grammar ids of the unit's grammar patterns. */
  grammarIds: string[];
  /** Ids of the passage sentences (`unit:<unit id>:<index>`, source `unit`). */
  passageIds: string[];
  /** Pack sentences at or below the unit's level that use at least two of its words. */
  sentenceIds: string[];
}

/**
 * A unit's progress on the lesson path (T3), kept in `Settings.unitStatus`. Epoch ms of
 * each step the learner reached; `doneAt` is set once the unit counts as done and then stays.
 */
export interface UnitProgress {
  /** The Introduce step was gone through, or the unit was opened for practice. */
  introducedAt?: number;
  /** The passage was read (the Read step). */
  readAt?: number;
  /** The unit counted as done (≥ 80% of its words known, each grammar point reviewed right). */
  doneAt?: number;
  /** A review unit below the learner's level, marked as done without working through it. */
  skippedAt?: number;
  /** The lesson's sections (S3), each with its parts done. */
  sections?: Partial<Record<LessonSection, SectionProgress>>;
}

/** Error categories for a wrong or near-miss reading (R5). */
export type ErrorType =
  | 'wrong-kanji'
  | 'long-vowel'
  | 'sokuon'
  | 'rendaku'
  | 'kana-variant'
  | 'other';

/** Outcome of grading one answer. `kana-variant` answers are `correct` with that error type noted. */
export type Verdict = 'correct' | 'near-miss' | 'wrong';

export interface Grade {
  verdict: Verdict;
  errorType?: ErrorType;
  /** Normalised hiragana forms that were compared. */
  expected: string;
  given: string;
  /** "I don't know" (L4): shown the answer instead. Graded `wrong` (FSRS Again), no error type. */
  skipped?: true;
  /**
   * A right answer that was a valid but less usual reading: the preferred reading the
   * feedback recommends, e.g. にほんじん for にっぽんじん.
   */
  variantOf?: string;
}

export type AnswerMode = 'typed' | 'voice' | 'drill';

/** JLPT-shaped question kinds (J1–J5, T6), see `src/domain/questions/`. */
export type QuestionKind =
  | 'kanji-reading'
  | 'orthography'
  | 'context-word'
  | 'grammar-form'
  | 'sentence-order'
  | 'comprehension';

export interface Review {
  /** Auto-increment key, assigned by storage. */
  id?: number;
  at: number;
  itemId: ItemId;
  sentenceId?: string;
  answer: string;
  expected: string;
  verdict: Verdict;
  errorType?: ErrorType;
  durationMs: number;
  mode: AnswerMode;
  /** A skip ("I don't know", L4), so stats can tell it from a wrong answer. */
  skipped?: true;
  /** A right answer in a less usual reading: the preferred one. */
  variantOf?: string;
  /** Set when the drill answer was a JLPT-shaped question (J1–J5), with its kind. */
  questionKind?: QuestionKind;
}

export interface Capture {
  id: string;
  createdAt: number;
  photo?: Blob;
  /** OCR text, one line per entry. */
  lines: string[];
  lesson?: string;
  week: string;
  addedItemIds: ItemId[];
  sentenceIds: string[];
}

/** An explanation the user kept with "Keep in my notes" (A3). */
export interface Note {
  id: string;
  createdAt: number;
  title: string;
  body: string;
  sentenceId?: string;
  itemId?: ItemId;
}

/** One line of a weekly plan (A7), e.g. { when: "Tue, Thu", what: "Write one sentence…" }. */
export interface PlanLine {
  when: string;
  what: string;
}

/** Session-mix knobs the accepted plan feeds into the selector. */
export interface SessionMix {
  dailyMinutes: number;
  /** Share of sentences that should exercise this error type, 0–1. */
  focusErrorTypes: Partial<Record<ErrorType, number>>;
  grammarIds: string[];
  drillShare: number;
}

export interface WeeklyPlan {
  /** ISO week the plan is for, e.g. "2026-W43". */
  id: string;
  createdAt: number;
  /** The letter on the past week, paragraph by paragraph. */
  letter: string[];
  lines: PlanLine[];
  mix: SessionMix;
  status: 'proposed' | 'accepted';
}

/** The JLPT level the learner is working on (P4): N5, N4 or N3. */
export type LearnerLevel = 5 | 4 | 3;

export type FuriganaMode = 'new' | 'all';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  /** Gemini API key, entered at runtime (N3). Never exported in backups. */
  apiKey?: string;
  /** Fast model for everyday tasks (A12). */
  modelId: string;
  /** Teacher model for tool-using tasks (A10, A12); absent means `DEFAULT_TEACHER_MODEL_ID`. */
  teacherModelId?: string;
  /** BCP-47 language of the UI and of the tutor's prose (N7b, N10); absent means English. */
  uiLanguage?: string;
  furigana: FuriganaMode;
  theme: ThemeMode;
  /** Lesson tag used for new items by default, e.g. "Tobira 第4課". */
  currentLesson?: string;
  lastBackupAt?: number;
  /** Epoch ms until which the backup reminder stays hidden after "Later" (N5). */
  backupReminderSnoozedUntil?: number;
  /** Version id of the dictionary packs loaded into IndexedDB. */
  packVersion?: string;
  /** Language packs installed on top of the dictionary (N9), e.g. ["fr"]. */
  packLanguages?: string[];
  /** JLPT level the learner is working on; absent means N5. */
  learnerLevel?: LearnerLevel;
  /** Progress per thematic unit id (T3). */
  unitStatus?: Record<string, UnitProgress>;
  /** A unit opened early (T3): the active lesson until it is done. Absent means the path's next. */
  activeUnit?: string;
  /** Epoch ms until which "Move to the next level?" stays hidden after "Not now" (P4). */
  levelUpSnoozedUntil?: number;
  /** The install banner was closed, or the app installed: it never shows again (N1d). */
  installBannerClosed?: boolean;
  onboarded: boolean;
  /** The welcome wizard step to resume at after a reload (P5); absent or '' means the first. */
  onboardingStep?: string;
  /** What the wizard's "What you know" step did, so its summary survives a reload (P5). */
  onboardingKnown?: OnboardingKnown;
  /** Soft answer sounds in sessions (U2); on when unset. */
  sound?: boolean;
  /** How loud the answer tones are, 0.1 to 1 (U2); full when unset. Off is `sound: false`. */
  soundVolume?: number;
  /** Listening exercises in sessions (S4); on when unset. Off, sessions leave them out. */
  listening?: boolean;
  /** About how long a session or lesson takes, in minutes (L6); absent means 5. */
  sessionMinutes?: SessionMinutes;
  /**
   * "Explain new things first" (L7): new words and grammar get an intro card before their first
   * exercise. When false, the exercise shows a "New" chip that opens the same intro in a sheet.
   * Absent means on.
   */
  explainFirst?: boolean;
  /**
   * When the tutor runs (A13): only when asked (absent or 'on-ask', the default), or also to
   * explain each wrong answer automatically ('auto-mistakes'). Skips are never explained.
   */
  tutor?: TutorMode;
  /**
   * Settings → Tutor → "Explanations in" (M1): 'auto' (absent) follows the learner's level
   * and coverage; 'native' is the learner's language, 'mixed' Japanese with a native line, and
   * 'japanese' Japanese at the learner's level.
   */
  immersion?: ImmersionSetting;
  /** What Start plays (IA3), chosen on Today; absent means the daily mix. */
  practice?: PracticeChoice;
}
