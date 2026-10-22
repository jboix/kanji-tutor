/**
 * JLPT-shaped questions (J1–J5, J7, T6): four options, one right, each option explained. Pure
 * data built by deterministic generators; the read feature renders them in a session.
 */
import type { ErrorType, ItemId, QuestionKind } from '../types.ts';

export type { QuestionKind } from '../types.ts';

/** The JLPT section name shown above each question (J7). */
export const SECTION: Readonly<Record<QuestionKind, string>> = {
  'kanji-reading': '問題 · 漢字読み',
  orthography: '問題 · 表記',
  'context-word': '問題 · 文脈規定',
  'grammar-form': '問題 · 文法形式の判断',
  'sentence-order': '問題 · 文の組み立て',
  comprehension: '問題 · 読解',
};

/** What an option's note says, by code; the UI words it in the learner's language. */
export type NoteCode =
  | 'long-vowel-dropped'
  | 'long-vowel-added'
  | 'sokuon-added'
  | 'sokuon-turned'
  | 'sokuon-dropped'
  | 'voiced'
  | 'unvoiced'
  | 'other-reading'
  | 'read-as'
  | 'swap-parts'
  | 'swap-needs'
  | 'another-word'
  | 'spelling'
  | 'word-misfits'
  | 'word-fits'
  | 'form-misfits'
  | 'form-fits'
  | 'order-star'
  | 'order-slot'
  | 'line-not';

/** A generated note: a code and the values it names (kana, kanji, glosses, numbers). */
export interface CodedNote {
  code: NoteCode;
  params: Readonly<Record<string, string | number>>;
}

/** A coded note from a generator, or prose written for the app or by the tutor. */
export type OptionNote = CodedNote | string;

/** A coded note. */
export const note = (code: NoteCode, params: CodedNote['params']): CodedNote => ({ code, params });

/** One of the four options, with why it is right or wrong (J7). */
export interface QuestionOption {
  /** As shown: a reading, a spelling, a word, a form or a chunk. */
  text: string;
  /** Why it fits, or why it does not ("しょかい drops the long vowel of しょう"). */
  note: OptionNote;
  /** A wrong reading's slip (J1), saved as the review's error type when chosen. */
  slip?: ErrorType;
  /** A lookalike spelling (J2): [the kanji meant, this option's kanji], saved as a swap. */
  swap?: [string, string];
}

/** The sentence as shown: the text before, the marked span, the text after. */
export interface Stem {
  before: string;
  /** The underlined span (J1, J2), or the hidden answer of a blank (J3, J4). */
  target: string;
  after: string;
  /** `underline`: the target is shown underlined. `blank`: shown as a gap until answered. */
  mark: 'underline' | 'blank';
}

interface QuestionBase {
  /** Stable for the same source and seed, e.g. `q:kanji-reading:tatoeba:42:3`. */
  id: string;
  /** JLPT section name (J7). */
  section: string;
  /** Exactly four, all different. */
  options: QuestionOption[];
  /** Index of the right option. */
  answer: number;
  /** The item the answer reviews: a word for J1–J3, a grammar point for J4 (and J5 when found). */
  itemId?: ItemId;
  sentenceId?: string;
  /** The sentence's English translation, shown after answering. */
  translation?: string;
  /**
   * J3, J4: the English translation with the blank's meaning masked, the only meaning
   * shown before answering. Absent when it cannot be masked: then none is shown before.
   */
  hint?: string;
}

/** J1–J4: a sentence with an underlined span or a blank, and four options. */
export interface ChoiceQuestion extends QuestionBase {
  kind: 'kanji-reading' | 'orthography' | 'context-word' | 'grammar-form';
  stem: Stem;
}

/** J5 文の組み立て: four chunks to order in `before _ _ ★ _ after`. */
export interface OrderQuestion extends QuestionBase {
  kind: 'sentence-order';
  before: string;
  after: string;
  /** Slot (0–3) holding the ★. */
  star: number;
  /** Option indices in the sentence's order. `order[star] === answer`. */
  order: number[];
}

/** What a comprehension question asks about (T6). */
export type ComprehensionType = 'content' | 'reason' | 'phrase-meaning' | 'reference';

/** T6 読解: one question on a passage. */
export interface ComprehensionQuestion extends QuestionBase {
  kind: 'comprehension';
  type: ComprehensionType;
  /** The question itself, in Japanese. */
  question: string;
  /** Index of the passage sentence that proves the answer. */
  evidence: number;
}

export type Question = ChoiceQuestion | OrderQuestion | ComprehensionQuestion;

/** A passage line, Japanese with its English. */
export interface PassageLine {
  ja: string;
  en: string;
}

/** A passage and its 2–4 questions, ready to render one question at a time (T6). */
export interface ComprehensionSet {
  id: string;
  sentences: PassageLine[];
  questions: ComprehensionQuestion[];
}
