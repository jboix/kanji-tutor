import { itemId } from '../ids.ts';
import { unknownTokens } from '../selector.ts';
import type { WordLevels } from '../session-types.ts';
import type { GrammarPoint, Sentence } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { ClozeDrill, PatternChoice } from './types.ts';

export interface ClozeInput {
  /** The learner's grammar points of the current lesson: the answer and the other choices. */
  points: readonly GrammarPoint[];
  /** Grammar ids to drill first (plan focus, recent misses). */
  prefer?: readonly string[];
  /** Grammar ids not to ask about (already drilled this session); they may still be choices. */
  exclude?: ReadonlySet<string>;
  /** Verified sentences whose readings JMdict confirms. */
  sentences: readonly Sentence[];
  levels: WordLevels;
  seed: string;
}

/** Choices per cloze: the answer and up to two other patterns. */
const MAX_CHOICES = 3;

/** The text a pattern is written with in a sentence: no leading 〜, no spaces (わけではない). */
export function patternText(pattern: string): string {
  const text = pattern.replace(/\s+/gu, '').replace(/^[〜~～]+/u, '');
  return /[〜~～]/u.test(text) ? '' : text;
}

/** A sentence that writes the pattern out and has no unknown word: the pattern is the target. */
function carries(sentence: Sentence, text: string, levels: WordLevels): boolean {
  return sentence.text.includes(text) && unknownTokens(sentence, levels).length === 0;
}

function choicesFor(point: GrammarPoint, input: ClozeInput, sentence: Sentence) {
  const others = input.points.filter((p) => {
    const text = patternText(p.pattern);
    return p.id !== point.id && text !== '' && !sentence.text.includes(text);
  });
  const picked = [point, ...seededOrder(others, (p) => p.id, input.seed)].slice(0, MAX_CHOICES);
  return seededOrder(picked, (p) => p.id, input.seed).map(
    (p): PatternChoice => ({ grammarId: p.id, pattern: patternText(p.pattern) }),
  );
}

function drillFor(point: GrammarPoint, input: ClozeInput, sentence: Sentence) {
  const text = patternText(point.pattern);
  const choices = choicesFor(point, input, sentence);
  if (choices.length < 2) return undefined;
  const start = sentence.text.indexOf(text);
  const drill: ClozeDrill = {
    kind: 'cloze',
    sentence,
    grammarId: point.id,
    itemId: itemId('grammar', point.id),
    meaning: point.meaning,
    start,
    end: start + text.length,
    choices,
  };
  return drill;
}

function ordered(input: ClozeInput): GrammarPoint[] {
  const prefer = new Set(input.prefer ?? []);
  const points = seededOrder(input.points, (p) => p.id, input.seed);
  return points
    .filter((p) => !input.exclude?.has(p.id))
    .sort((a, b) => Number(prefer.has(b.id)) - Number(prefer.has(a.id)));
}

/**
 * Grammar cloze (R8): a sentence with one of the learner's grammar points blanked, and two or
 * three patterns of the lesson to choose from. Preferred points come first, and sentences tagged
 * with the point; a sentence must write the pattern out and contain no unknown word. Undefined
 * when no point fits.
 */
export function clozeDrill(input: ClozeInput): ClozeDrill | undefined {
  const sentences = seededOrder(input.sentences, (s) => s.id, input.seed);
  for (const point of ordered(input)) {
    const text = patternText(point.pattern);
    const tagged = (s: Sentence) => Number(!(s.grammarIds ?? []).includes(point.id));
    const pool = [...sentences].sort((a, b) => tagged(a) - tagged(b));
    const sentence = text === '' ? undefined : pool.find((s) => carries(s, text, input.levels));
    const drill = sentence && drillFor(point, input, sentence);
    if (drill) return drill;
  }
  return undefined;
}
