/**
 * Property tests over every sentence of the e2e fixture pack: whatever a generator emits has
 * four distinct options, exactly one right answer, a note on each option, and no wrong option
 * that is itself right (a valid reading, a valid spelling, the same form or a reordering).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { allLevels, fixturePack, fixtureRepos } from '../../test/fixture-pack.ts';
import { toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { Sentence } from '../types.ts';
import { optionKey } from './options.ts';
import {
  contextWordMaker,
  grammarFormMaker,
  kanjiReadingMaker,
  type Maker,
  orthographyMaker,
  type QuestionContext,
  sentenceOrderMaker,
} from './sources.ts';
import { type ChoiceQuestion, type Question, SECTION } from './types.ts';

let repos: Repos;
let ctx: QuestionContext;

beforeAll(async () => {
  repos = await fixtureRepos();
  ctx = {
    repos,
    levels: allLevels(3),
    sentences: fixturePack().sentences,
    avoid: new Set(),
    learnerLevel: 3,
    grammar: [],
    seed: 'property',
  };
});

async function all(maker: Maker, at: QuestionContext = ctx): Promise<[Sentence, Question][]> {
  const out: [Sentence, Question][] = [];
  for (const sentence of fixturePack().sentences) {
    const question = await maker(at, sentence);
    if (question) out.push([sentence, question]);
  }
  return out;
}

/** Every learner level in turn: grammar is asked at the learner's level and the one below. */
async function atEveryLevel(maker: Maker): Promise<[Sentence, Question][]> {
  const levels = [5, 4, 3] as const;
  const lists = await Promise.all(levels.map((l) => all(maker, { ...ctx, learnerLevel: l })));
  return lists.flat();
}

/**
 * A blank covers whole tokens and never stops at a stem: no ます, た or ない is left outside
 * right after a verb stem (もら|いました), and the text right before the
 * blank is not repeated at the start of an option (を | をくれる).
 */
function expectWholeBlank(sentence: Sentence, q: ChoiceQuestion) {
  const from = q.stem.before.length;
  const to = from + q.stem.target.length;
  const starts = sentence.tokens.map((t) => t.start);
  const ends = sentence.tokens.map((t) => t.start + t.surface.length);
  expect(starts).toContain(from);
  expect(ends).toContain(to);
  const lastIn = sentence.tokens.find((t) => t.start + t.surface.length === to);
  const next = sentence.tokens.find((t) => t.start === to);
  // 持って|ない is 持っていない said fast: the て (of てる) is a whole te-form.
  const contracted = lastIn?.base === 'てる' || lastIn?.base === 'でる';
  const stem =
    !contracted &&
    lastIn?.surface !== lastIn?.base &&
    ['verb', 'adjective'].includes(lastIn?.pos ?? '');
  const continues = next?.pos === 'auxiliary' && ['ます', 'た', 'ない'].includes(next.base);
  expect(stem && continues).toBe(false);
  const last = q.stem.before.slice(-1);
  if (last !== '' && /[をがはにで]/u.test(last)) {
    for (const o of q.options) expect(o.text.startsWith(last)).toBe(false);
  }
}

function expectSound(question: Question) {
  expect(question.options).toHaveLength(4);
  expect(new Set(question.options.map((o) => optionKey(o.text))).size).toBe(4);
  expect(question.answer).toBeGreaterThanOrEqual(0);
  expect(question.answer).toBeLessThan(4);
  expect(question.options.every((o) => o.text !== '' && o.note !== '')).toBe(true);
  expect(question.section).toBe(SECTION[question.kind]);
  expect(question.itemId).toBeDefined();
}

const wrongTexts = (q: Question) => q.options.filter((_, i) => i !== q.answer).map((o) => o.text);

function stemText(q: ChoiceQuestion, target: string) {
  return q.stem.before + target + q.stem.after;
}

describe('generators over the fixture pack', { timeout: 30_000 }, () => {
  it('漢字読み: the answer is the token reading, no wrong option is a reading of the form', async () => {
    const made = await all(kanjiReadingMaker);
    expect(made.length).toBeGreaterThan(50);
    for (const [sentence, q] of made) {
      expectSound(q);
      const choice = q as ChoiceQuestion;
      expect(stemText(choice, choice.stem.target)).toBe(sentence.text);
      const writtenAlike = await repos.dictionary.wordsByText(choice.stem.target);
      const readings = new Set(writtenAlike.flatMap((w) => w.readings.map(toKanaFold)));
      for (const text of wrongTexts(q)) expect(readings.has(text)).toBe(false);
    }
  });

  it('表記: the answer is the written span, no wrong option is a form of the word', async () => {
    const made = await all(orthographyMaker);
    expect(made.length).toBeGreaterThan(50);
    for (const [sentence, q] of made) {
      expectSound(q);
      const choice = q as ChoiceQuestion;
      expect(stemText(choice, choice.options[q.answer]?.text ?? '')).toBe(sentence.text);
      const word = await repos.dictionary.word(q.itemId?.slice('word:'.length) ?? '');
      for (const text of wrongTexts(q)) expect(word?.forms).not.toContain(text);
    }
  });

  it('文脈規定: the blank holds the word, distractors are other words', async () => {
    const made = await all(contextWordMaker());
    expect(made.length).toBeGreaterThan(20);
    for (const [sentence, q] of made) {
      expectSound(q);
      const choice = q as ChoiceQuestion;
      expect(choice.stem.mark).toBe('blank');
      expectWholeBlank(sentence, choice);
      expect(stemText(choice, choice.options[q.answer]?.text ?? '')).toBe(sentence.text);
      expect(q.translation).toBe(sentence.translation);
    }
  });

  it('文法形式の判断: the blank holds the form, no distractor repeats it', async () => {
    const made = await atEveryLevel(grammarFormMaker);
    expect(made.length).toBeGreaterThan(10);
    for (const [sentence, q] of made) {
      expectSound(q);
      const choice = q as ChoiceQuestion;
      expectWholeBlank(sentence, choice);
      expect(stemText(choice, choice.options[q.answer]?.text ?? '')).toBe(sentence.text);
      expect(q.itemId?.startsWith('grammar:')).toBe(true);
    }
  });

  it('文の組み立て: the order rebuilds the sentence and the ★ piece is the answer', async () => {
    const made = await all(sentenceOrderMaker);
    expect(made.length).toBeGreaterThan(0);
    for (const [sentence, q] of made) {
      expectSound(q);
      if (q.kind !== 'sentence-order') throw new Error('wrong kind');
      expect([...q.order].sort()).toEqual([0, 1, 2, 3]);
      expect(q.order[q.star]).toBe(q.answer);
      const rebuilt = q.before + q.order.map((i) => q.options[i]?.text).join('') + q.after;
      expect(rebuilt).toBe(sentence.text);
    }
  });

  it('is deterministic for the same seed', async () => {
    const sentence = fixturePack().sentences.find((s) => s.text === '待つしかない。');
    if (!sentence) throw new Error('fixture sentence missing');
    expect(await kanjiReadingMaker(ctx, sentence)).toEqual(await kanjiReadingMaker(ctx, sentence));
  });
});
