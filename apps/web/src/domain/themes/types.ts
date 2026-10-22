/**
 * Thematic units (T1, T2, T6): the lesson path, N5 → N4 → N3. Authored for this app (D33), not
 * runtime AI output. Pure data types.
 */

/** JLPT level of a unit: 5 is N5 (easiest), 3 is N3. */
export type UnitLevel = 5 | 4 | 3;

/** A key word of a unit, as written, with its reading. The pack pipeline resolves it to JMdict. */
export interface UnitWord {
  /** Usual written form, e.g. "自動販売機" (kana for kana words). */
  written: string;
  /** Reading in hiragana (katakana for loanwords as JMdict writes them), e.g. "じどうはんばいき". */
  reading: string;
}

/** One sentence of a unit passage, with its English translation. */
export interface PassageSentence {
  ja: string;
  en: string;
}

export interface UnitPassage {
  /** 3–8 sentences, written at the unit's level. */
  sentences: PassageSentence[];
}

/**
 * JLPT 読解 question shapes: what the text says, why something happens, what a phrase means, and
 * what a こ/そ/あ word points to.
 */
export type UnitQuestionKind = 'content' | 'reason' | 'phrase-meaning' | 'reference';

/** A four-option reading comprehension question on the unit passage (T6). */
export interface UnitQuestion {
  kind: UnitQuestionKind;
  /** In Japanese, at the unit's level. */
  prompt: string;
  /** Exactly four options, in Japanese. */
  options: [string, string, string, string];
  /** Index of the right option, 0–3. */
  answer: number;
  /** Index of the passage sentence that proves the answer. */
  evidence: number;
  /** In English: why the answer is right and the others are wrong. */
  explanation: string;
}

export interface Unit {
  /** Stable slug, e.g. "vending-machine". */
  id: string;
  /** Position on the path, 1-based and contiguous across all levels. */
  order: number;
  level: UnitLevel;
  /** English title, e.g. "At the vending machine". */
  theme: string;
  /** Japanese title, e.g. "自動販売機". */
  titleJa: string;
  /** One English line on why the theme is interesting. */
  summary: string;
  /** 8–15 key words introduced by the unit. */
  words: UnitWord[];
  /**
   * 2–4 grammar point ids from `GRAMMAR_CATALOGUE`, e.g. "te-mo-ii", at or below the unit's level
   * and used in its passage. Show them through `unitGrammar(unit)`, which has the patterns.
   */
  grammar: string[];
  passage: UnitPassage;
  /** 2–4 comprehension questions. */
  questions: UnitQuestion[];
}
