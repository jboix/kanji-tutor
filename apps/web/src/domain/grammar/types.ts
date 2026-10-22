/** Grammar catalogue types (G1). The catalogue itself is in the `n5-*`, `n4-*`, `n3-*` files. */
import type { Matcher } from './dsl.ts';

/** JLPT level of a grammar point, by common consensus (no official list exists). */
export type GrammarLevel = 5 | 4 | 3;

/** A group of points that are easy to confuse: question distractors come from the same family. */
export type GrammarFamily =
  | 'ability'
  | 'adjective'
  | 'advice'
  | 'appearance'
  | 'aspect'
  | 'attempt'
  | 'certainty'
  | 'change'
  | 'command'
  | 'comparison'
  | 'compound-verb'
  | 'conditional'
  | 'conjecture'
  | 'contrast'
  | 'copula'
  | 'correlation'
  | 'decision'
  | 'degree'
  | 'desire'
  | 'emphasis'
  | 'ease'
  | 'existence'
  | 'experience'
  | 'explanation'
  | 'giving-receiving'
  | 'honorific'
  | 'intention'
  | 'listing'
  | 'manner'
  | 'nominalizer'
  | 'obligation'
  | 'passive-causative'
  | 'permission'
  | 'plain-form'
  | 'politeness'
  | 'preference'
  | 'purpose'
  | 'quantity'
  | 'quotation'
  | 'reason'
  | 'reference'
  | 'request'
  | 'sense'
  | 'sentence-ending'
  | 'suggestion'
  | 'suitability'
  | 'tendency'
  | 'time'
  | 'wish'
  | 'word-formation';

/** One grammar point of the catalogue, written for this app. */
export interface GrammarEntry {
  /** Kebab-case slug, e.g. "te-mo-ii". Also the `GrammarPoint` id and the item ref. */
  id: string;
  /** The pattern as a learner sees it, e.g. "〜てもいい". */
  pattern: string;
  level: GrammarLevel;
  family: GrammarFamily;
  /** Short English gloss, e.g. "it is all right to". */
  meaning: string;
  /** How the pattern attaches, e.g. "V-て + もいい". */
  formation: string;
  /** Two or three sentences of explanation, in English. */
  explanation: string;
  /** Surface strings a cloze question blanks; a detected span contains one of them. */
  cloze: readonly string[];
  /** Detector over a sentence's tokens. Precision over recall: a false positive teaches wrong. */
  rule: Matcher;
}

/** Where a sentence uses a grammar point. */
export interface GrammarMatch {
  id: string;
  /** Token span, `end` exclusive. */
  start: number;
  end: number;
  /** UTF-16 offsets of the span in the sentence text, `to` exclusive. */
  from: number;
  to: number;
}

/** One use of a particle or function word, with an example written for this app (G5). */
export interface FunctionWordUse {
  /** What it does here, e.g. "Time: at, on". */
  use: string;
  example: string;
  translation: string;
}

/**
 * A particle or function word (が, は, を, に…) with its basic uses (G5), shown on tap. Kept apart
 * from the catalogue so questions, units and packs keep their compound points.
 */
export interface FunctionWord {
  /** Kebab-case, prefixed "particle-", e.g. "particle-ni". */
  id: string;
  /** The word as written, with the sense when two share a spelling, e.g. "から (from)". */
  pattern: string;
  level: GrammarLevel;
  /** Short English gloss. */
  meaning: string;
  /** One or two sentences on how it works. */
  explanation: string;
  /** Two to four uses, each with an example. Uses are listed, not detected. */
  uses: readonly FunctionWordUse[];
  /** Matches the particle token itself (zero-width context checks allowed). */
  rule: Matcher;
  /** The catalogue point that covers the same sense, so a sheet shows it once. */
  grammarId?: string;
}
