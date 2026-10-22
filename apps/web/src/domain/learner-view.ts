/**
 * The learner as the AI tutor's tools see it (A10). A pure port: `services/learner-profile.ts`
 * implements it over `Repos`, and `src/ai/tools/` exposes it to the model as function calls.
 */
import type { ErrorType, LearnerLevel, Verdict } from './types.ts';

/** A JLPT level as tagged in the dictionary packs. */
export type JlptLevel = 5 | 4 | 3 | 2 | 1;

/** Known items of one JLPT level: known (level ≥ 3) out of the level's list. */
export interface LevelCoverage {
  level: LearnerLevel;
  known: number;
  total: number;
}

export interface LearnerCoverage {
  words: LevelCoverage[];
  kanji: LevelCoverage[];
  grammar: LevelCoverage[];
}

/** One recent wrong or near-miss answer. */
export interface RecentMistake {
  at: number;
  /** The word or kanji that was asked, e.g. "待つ". */
  target: string;
  expected: string;
  given: string;
  verdict: Exclude<Verdict, 'correct'>;
  errorType?: ErrorType;
}

/** The path's current unit as the tutor sees it (A10): its theme, step, words and grammar. */
export interface CurrentUnit {
  id: string;
  /** e.g. "自動販売機". */
  titleJa: string;
  /** English theme, e.g. "At the vending machine". */
  theme: string;
  level: LearnerLevel;
  step: 'words' | 'grammar' | 'practice' | 'reading' | 'review' | 'done';
  /** The unit's key words as written, e.g. "自動販売機". */
  words: string[];
  /** Its grammar patterns, e.g. "〜てもいい". */
  grammar: string[];
}

/** What `getLearnerProfile` returns. */
export interface LearnerOverview {
  level: LearnerLevel;
  /** `set` when the learner chose it, `estimated` from coverage otherwise. */
  levelSource: 'set' | 'estimated';
  /** BCP-47 language of the tutor's prose (N10). */
  explanationLanguage: string;
  coverage: LearnerCoverage;
  /** The thematic unit in progress (T3, T4), when the packs have one. */
  currentUnit?: CurrentUnit;
  /** The class lesson tag, e.g. "Tobira 第4課". */
  currentLesson?: string;
  /** Last mistakes, newest first (at most 20). */
  recentMistakes: RecentMistake[];
}

export type KnownState = 'unseen' | 'learning' | 'known';

/** One answer of `checkKnown`. */
export interface KnownCheck {
  kind: 'word' | 'kanji' | 'grammar';
  text: string;
  /** False when the dictionary or catalogue does not know the item. */
  found: boolean;
  state: KnownState;
  jlpt?: JlptLevel;
}

export interface KnownQuery {
  words?: readonly string[];
  kanji?: readonly string[];
  grammar?: readonly string[];
}

/** One dictionary entry for `lookupWord`. */
export interface DictionaryHit {
  forms: string[];
  /** The usual reading first (R10). */
  readings: string[];
  /** The standard, most common reading: the one to teach (R10). */
  preferredReading?: string;
  /** Valid but less common readings: "also possible, less common". */
  lessCommon?: string[];
  meanings: string[];
  jlpt?: JlptLevel;
  common: boolean;
  state: KnownState;
}

/** A known word, or a verified sentence, that uses a kanji or grammar pattern. */
export interface KnownExample {
  kind: 'word' | 'sentence';
  text: string;
  reading?: string;
  meaning?: string;
}

/** The learner's progress, read-only, for the tutor's tools (A10). */
export interface LearnerView {
  /**
   * The overview; `withUnit` adds the current unit (the tool asks for it; the level line and the
   * immersion mode do not need it, and working out the unit path is not free).
   */
  getLearnerProfile(options?: { withUnit?: boolean }): Promise<LearnerOverview>;
  checkKnown(query: KnownQuery): Promise<KnownCheck[]>;
  lookupWord(text: string): Promise<DictionaryHit[]>;
  /** Up to 5 known words (for a kanji) or verified sentences (for a word or grammar pattern). */
  knownExamples(query: string): Promise<KnownExample[]>;
}
