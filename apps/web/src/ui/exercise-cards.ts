/**
 * What the help bar explains for each exercise (U6), pure. Before the answer it is the
 * sentence as the exercise shows it: the blank as a blank, a 表記 word in kana, and for
 * 漢字読み the underlined word as a target whose reading the tutor's reply must not hold (L3).
 */

import { toHiragana } from 'wanakana';
import { PATTERN_BLANK } from '../domain/drills/index.ts';
import type { ChoiceQuestion } from '../domain/questions/index.ts';
import type { SessionCard } from '../domain/session-types.ts';
import type { Sentence, Token } from '../domain/types.ts';
import type { BlankAnswer } from './slots.tsx';
import { helpCard, hiddenTarget, looseSentence, maskSentence } from './word-tap-data.ts';

export type HelpCard = { card: SessionCard; step: number; blank?: BlankAnswer };

/** What a blank in [from, to) of the real sentence hides (A19): its text and readings. */
function blankAnswer(sentence: Sentence, from: number, to: number): BlankAnswer {
  const inside = sentence.tokens.filter((t) => t.start < to && t.start + t.surface.length > from);
  const reading = toHiragana(inside.map((t) => t.reading || t.surface).join(''));
  const answer = sentence.text.slice(from, to);
  return { text: sentence.text, answer, readings: [...new Set([reading, toHiragana(answer)])] };
}

/** Blank kinds whose answer is a word or a form the tutor can hint at (J3, J4). */
const BLANKS: ReadonlySet<ChoiceQuestion['kind']> = new Set(['context-word', 'grammar-form']);

/** What stands in for the stem's span until the answer. */
export const stemFill = (q: ChoiceQuestion) =>
  q.stem.mark === 'blank' ? PATTERN_BLANK : q.stem.target;

/** The sentence a stem was cut from, rebuilt when it is not at hand (placement). */
function stemSentence(q: ChoiceQuestion, fill: string): { sentence: Sentence; at: number } {
  const { before, after } = q.stem;
  const token: Token = {
    surface: fill,
    reading: '',
    base: fill,
    pos: 'symbol',
    start: before.length,
  };
  return { sentence: looseSentence(`${q.id}#stem`, before + fill + after, [token]), at: 0 };
}

function masked(q: ChoiceQuestion, sentence: Sentence | undefined) {
  const fill = stemFill(q);
  const { before, after } = q.stem;
  const fits =
    sentence &&
    sentence.tokens.length > 0 &&
    sentence.text.startsWith(before) &&
    sentence.text.endsWith(after);
  if (!fits) return stemSentence(q, fill);
  const to = sentence.text.length - after.length;
  const m = maskSentence(sentence, before.length, to, fill);
  return { sentence: m.sentence, at: m.blank };
}

/** What a J3 or J4 blank hides, from the real sentence or the stem filled in (A19). */
function blankOf(q: ChoiceQuestion, sentence: Sentence | undefined): BlankAnswer | undefined {
  if (!BLANKS.has(q.kind) || q.stem.mark !== 'blank') return undefined;
  const { before, target, after } = q.stem;
  const full = sentence?.text === before + target + after ? sentence : undefined;
  const real = full ?? stemSentence(q, target).sentence;
  return blankAnswer(real, before.length, before.length + target.length);
}

/** The help card of a 4-option question (J1–J4). */
export function questionHelpCard(
  q: ChoiceQuestion,
  sentence: Sentence | undefined,
  answered: boolean,
): HelpCard {
  if (answered) {
    return { card: helpCard(sentence ?? stemSentence(q, q.stem.target).sentence), step: 0 };
  }
  const shown = masked(q, sentence);
  const blank = blankOf(q, sentence);
  if (blank) return { card: helpCard(shown.sentence), step: 0, blank };
  if (q.kind !== 'kanji-reading') return { card: helpCard(shown.sentence), step: 0 };
  const right = q.options[q.answer]?.text ?? '';
  const wordId = q.itemId?.startsWith('word:') ? q.itemId.slice(5) : '';
  const hidden = hiddenTarget(shown.sentence, shown.at, [right], wordId);
  return { card: helpCard(shown.sentence, [hidden]), step: 0 };
}

/** The help card of a drill sentence blanked in [from, to) (lookalike, cloze). */
export function blankHelpCard(
  sentence: Sentence,
  range: { from: number; to: number; fill: string },
  answered: boolean,
): HelpCard {
  if (answered) return { card: helpCard(sentence), step: 0 };
  const m = maskSentence(sentence, range.from, range.to, range.fill);
  return {
    card: helpCard(m.sentence),
    step: 0,
    blank: blankAnswer(sentence, range.from, range.to),
  };
}
