/**
 * 読解 option balance (T6, D93), measured over every unit's generated comprehension set: the
 * right option should not give itself away by being the longest one, nor by repeating the line
 * that proves it word for word. Chance alone would make about a quarter of the answers the longest;
 * the units were rewritten to about one in twenty (D93).
 */
import { describe, expect, it } from 'vitest';
import { UNITS } from '../themes/units.ts';
import { comprehensionSet } from './comprehension.ts';
import type { ComprehensionQuestion, ComprehensionSet } from './types.ts';

const bare = (text: string) => [...text.replace(/[。、！？「」・\s]/gu, '')];
/** Endings every option of a kind shares: 〜からです, 〜ます. */
const ENDINGS = /(からです|ました|ません|ます|です|こと)$/u;

/** The answer is longer than every other option. */
function answerLongest(question: ComprehensionQuestion): boolean {
  const lengths = question.options.map((option) => bare(option.text).length);
  const answer = lengths[question.answer] ?? 0;
  return lengths.every((length, i) => i === question.answer || length < answer);
}

/** Length of the longest run of characters `a` and `b` share. */
function longestShared(a: readonly string[], b: readonly string[]): number {
  let best = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      let k = 0;
      while (i + k < a.length && a[i + k] === b[j + k]) k++;
      best = Math.max(best, k);
    }
  }
  return best;
}

/**
 * The answer, without its shared ending, is four characters or more and 80% of it is one run
 * of the proving line: 夜もあいているから against 夜もあいているから便利です. Short answers
 * (医者, 六月) name a fact and are not counted.
 */
function copiesLine(question: ComprehensionQuestion, set: ComprehensionSet): boolean {
  const text = question.options[question.answer]?.text ?? '';
  const answer = bare(bare(text).join('').replace(ENDINGS, ''));
  const line = bare(set.sentences[question.evidence]?.ja ?? '');
  return answer.length >= 4 && longestShared(answer, line) >= Math.ceil(answer.length * 0.8);
}

function sets(): ComprehensionSet[] {
  return UNITS.flatMap((unit) => {
    const set = comprehensionSet({
      id: unit.id,
      sentences: unit.passage.sentences,
      questions: unit.questions,
    });
    return set ? [set] : [];
  });
}

describe('読解 option balance (T6, D93)', () => {
  const all = sets().flatMap((set) => set.questions.map((question) => ({ set, question })));

  it('measures every unit question', () => {
    expect(all.length).toBeGreaterThan(120);
  });

  it('makes the right option the longest in at most a tenth of the questions', () => {
    const longest = all.filter(({ question }) => answerLongest(question));
    expect(longest.length / all.length).toBeLessThanOrEqual(0.1);
  });

  it('repeats the proving line word for word in at most a tenth of the questions', () => {
    const copied = all.filter(({ set, question }) => copiesLine(question, set));
    expect(copied.length / all.length).toBeLessThanOrEqual(0.1);
  });

  it('flags a longest answer and a copied line, and leaves a balanced one', () => {
    const set: ComprehensionSet = {
      id: 't',
      sentences: [{ ja: 'コンビニは夜もあいているから便利です。', en: '' }],
      questions: [],
    };
    const question = (options: string[], answer = 0): ComprehensionQuestion => ({
      id: 'q',
      kind: 'comprehension',
      section: 'reading',
      type: 'reason',
      question: 'どうして',
      evidence: 0,
      options: options.map((text) => ({ text, note: '' })),
      answer,
    });
    const copied = question([
      '夜もあいているからです。',
      '安いからです。',
      '近いからです。',
      '広いからです。',
    ]);
    expect(answerLongest(copied)).toBe(true);
    expect(copiesLine(copied, set)).toBe(true);
    const fair = question([
      '夜でも買えるからです。',
      '駅のそばにあるからです。',
      '品物が安いからです。',
      '店が広いからです。',
    ]);
    expect(answerLongest(fair)).toBe(false);
    expect(copiesLine(fair, set)).toBe(false);
  });
});
