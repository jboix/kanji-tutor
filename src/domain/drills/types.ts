/**
 * Drills (R8): short reading exercises mixed into a session. Each one is built from what the
 * learner already reads, so it stays i+1: lookalike kanji in a sentence, one kanji read several
 * ways, a phonetic family, and a grammar cloze. Pure data, no React or storage.
 */
import type { VerbForm } from '../conjugation/forms.ts';
import type { ItemId, Sentence } from '../types.ts';

/** The R8 reading drills, mixed in by the learner's mistakes and the plan. */
export type ReadingDrillKind = 'lookalike' | 'readings' | 'family' | 'cloze';

/** The R8 drills, then the S4 exercise types. */
export type DrillKind =
  | ReadingDrillKind
  | 'meaning'
  | 'particle'
  | 'pattern'
  | 'conjugation'
  | 'build'
  | 'listening';

/** A kanji with its dictionary readings (KANJIDIC: on in katakana, kun as い.きる). */
export interface KanjiChoice {
  char: string;
  readings: string[];
}

/** "Which kanji fits?": the sentence with one kanji blanked, and two lookalikes (待/持). */
export interface LookalikeDrill {
  kind: 'lookalike';
  sentence: Sentence;
  /** Token holding the blanked kanji. */
  tokenIndex: number;
  /** Offset of the kanji in `sentence.text`. */
  at: number;
  wordId: string;
  itemId: ItemId;
  /** The kanji that fits. */
  answer: string;
  /** Both kanji in a seeded order, with their readings, shown after answering. */
  choices: KanjiChoice[];
  /** The learner swapped these two recently (a real mistake, not only a lookalike shape). */
  confused: boolean;
}

/** One word of a "many readings" drill: 学生, read with 生 as セイ. */
export interface ReadingItem {
  wordId: string;
  itemId: ItemId;
  /** Written form, e.g. 学生. */
  form: string;
  /** The kanji reading this word proves, as stored: "セイ" or "い.きる". */
  kanjiReading: string;
  /** Accepted answers in hiragana, the word's primary reading first. */
  readings: string[];
}

/** One kanji, many readings: 2–4 known words reading the same kanji differently (生). */
export interface ReadingsDrill {
  kind: 'readings';
  kanji: string;
  items: ReadingItem[];
}

/** Same part, same sound: known members of a phonetic family and one to guess (青 清 晴 → 精). */
export interface FamilyDrill {
  kind: 'family';
  /** The shared phonetic part, e.g. 青. */
  part: string;
  /** The shared on'yomi in katakana, e.g. セイ. */
  sound: string;
  /** Members the learner reads with that sound. */
  known: string[];
  /** The member to guess. */
  guess: string;
  itemId: ItemId;
  /** Accepted answers in hiragana: the shared sound first, then the guess's other on'yomi. */
  accepted: string[];
  /** A dictionary word written with the guess alone, shown after answering. */
  word?: { form: string; reading: string };
}

/** A grammar pattern the learner has, as a cloze choice. */
export interface PatternChoice {
  grammarId: string;
  /** As shown: the pattern without its leading 〜 (わけではない). */
  pattern: string;
}

/** Grammar cloze: a sentence with a known pattern blanked, and 2–3 patterns of the lesson. */
export interface ClozeDrill {
  kind: 'cloze';
  sentence: Sentence;
  grammarId: string;
  itemId: ItemId;
  meaning: string;
  /** Blanked range in `sentence.text`, end exclusive. */
  start: number;
  end: number;
  choices: PatternChoice[];
  /** The sentence's meaning, shown with the blank, when several choices would be grammatical. */
  hint?: string;
}

/** A word as written and as read. */
export interface WrittenWord {
  written: string;
  reading: string;
}

/** One option of a meaning check: a word's glosses, in English and the installed languages. */
export interface MeaningOption {
  wordId: string;
  /** The word as written, shown as the option of a reversed check. */
  written: string;
  glosses: string[];
  glossesByLang?: Record<string, string[]>;
}

/**
 * Meaning check (S4): a word of the lesson and four meanings, one of them its own. Reversed,
 * the meaning is shown and the word is chosen among four of the level ("which word means…?").
 */
export interface MeaningDrill {
  kind: 'meaning';
  reverse?: true;
  wordId: string;
  itemId: ItemId;
  word: WrittenWord;
  options: MeaningOption[];
  /** Index of the word's own meaning. */
  answer: number;
}

/** Particle fill (S4): a sentence with one particle blanked, and particles of the level. */
export interface ParticleDrill {
  kind: 'particle';
  sentence: Sentence;
  tokenIndex: number;
  /** Offset of the particle in `sentence.text`. */
  at: number;
  /** The particle that fits, as written. */
  answer: string;
  /** The answer and its distractors, in a seeded order. */
  choices: string[];
  /** The function word's review item (`grammar:particle-ni`). */
  itemId: ItemId;
}

/** Pattern drill as in 練習 A/B (S4): a cue word, a grammar point, and the cue transformed. */
export interface PatternDrill {
  kind: 'pattern';
  grammarId: string;
  itemId: ItemId;
  /** The shape to make, e.g. 〜てもいいですか. */
  shape: string;
  cue: WrittenWord & { wordId?: string };
  /** The model line, with another cue: 見る → 見てもいいですか. */
  example?: { cue: string; answer: string };
  answer: WrittenWord;
  /** Every answer that counts, in kana and as written. */
  accepted: string[];
}

/** Conjugation drill (S4): a verb and a form at the learner's level (て, ない, potential…). */
export interface ConjugationDrill {
  kind: 'conjugation';
  wordId: string;
  itemId: ItemId;
  cue: WrittenWord;
  form: VerbForm;
  answer: WrittenWord;
  accepted: string[];
}

/** Sentence building (S4): the sentence's pieces shuffled, to put back in order. */
export interface BuildDrill {
  kind: 'build';
  sentence: Sentence;
  /** The pieces in the sentence's order (closing punctuation left out). */
  pieces: string[];
  /** Indices into `pieces`, in the order the tiles are shown. */
  shuffled: number[];
  /** What the answer reviews: a lesson word or grammar point, when there is one. */
  itemId?: ItemId;
}

/** One meaning of a listening drill: a sentence's translation, in English and installed languages. */
export interface ListeningOption {
  translation: string;
  translations?: Record<string, string>;
}

/**
 * Listening (S4): the sentence spoken, and four meanings to choose from. With `read`, the
 * sentence is shown instead of spoken: a meaning check on a whole sentence of the lesson.
 */
export interface ListeningDrill {
  kind: 'listening';
  read?: true;
  sentence: Sentence;
  options: ListeningOption[];
  answer: number;
  itemId?: ItemId;
}

/** The S4 exercise types. */
export type ExerciseDrill =
  | MeaningDrill
  | ParticleDrill
  | PatternDrill
  | ConjugationDrill
  | BuildDrill
  | ListeningDrill;

export type Drill = LookalikeDrill | ReadingsDrill | FamilyDrill | ClozeDrill | ExerciseDrill;
