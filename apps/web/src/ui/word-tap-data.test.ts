import { describe, expect, it } from 'vitest';
import { S } from '../test/reading-fixtures.ts';
import { blankHelpCard, questionHelpCard } from './exercise-cards.ts';
import { maskSentence, opensSheet, sliceTokens } from './word-tap-data.ts';

const sentence = { ...S.waiting, translation: 'While waiting…', grammarIds: ['te-iru'] };

describe('maskSentence', () => {
  it('replaces the span, drops what could give it away, and shuts the cut pieces', () => {
    // 待 of 待っ masked: the っ left of the token is shut too.
    const m = maskSentence(sentence, 5, 6, '〇');
    expect(m.sentence.text).toBe('駅で友達を〇っている間に、本を読みました。');
    expect(m.sentence.translation).toBeUndefined();
    expect(m.sentence.grammarIds).toBeUndefined();
    expect(m.sentence.id).not.toBe(sentence.id);
    expect(m.sentence.tokens[m.blank]?.surface).toBe('〇');
    expect(m.locked).toEqual([m.blank, m.blank + 1]);
    expect(m.sentence.tokens[m.blank + 1]?.surface).toBe('っ');
    expect(opensSheet(m.sentence.tokens[m.blank] ?? sentence.tokens[0]!)).toBe(false);
  });

  it('slices whole tokens of a range, with their indices', () => {
    const { run, origin } = sliceTokens(sentence, 0, 5);
    expect(run.text).toBe('駅で友達を');
    expect(origin).toEqual([0, 1, 2, 3]);
  });
});

describe('questionHelpCard (U6)', () => {
  const q = {
    id: 'q',
    kind: 'kanji-reading' as const,
    section: '',
    answer: 0,
    options: [{ text: 'まっ', note: '' }],
    itemId: 'word:3' as const,
    stem: {
      before: '駅で友達を',
      target: '待っ',
      after: 'ている間に、本を読みました。',
      mark: 'underline' as const,
    },
  };

  it('hides the 漢字読み reading from the tutor before the answer', () => {
    const { card } = questionHelpCard(q, sentence, false);
    expect(card.sentence.translation).toBeUndefined();
    expect(card.targets[0]).toMatchObject({ readings: ['まっ'], wordId: '3' });
  });

  it('rebuilds the stem when the sentence is not at hand, blank and all', () => {
    const blank = {
      ...q,
      kind: 'context-word' as const,
      stem: { ...q.stem, mark: 'blank' as const },
    };
    const { card } = questionHelpCard(blank, undefined, false);
    expect(card.sentence.text).not.toContain('待っ');
    expect(questionHelpCard(blank, undefined, true).card.sentence.text).toContain('待っ');
  });

  it('tells the tutor what a 文脈規定 blank hides, the sentence still masked (A19)', () => {
    const blank = {
      ...q,
      kind: 'context-word' as const,
      stem: { ...q.stem, mark: 'blank' as const },
    };
    const help = questionHelpCard(blank, sentence, false);
    expect(help.card.sentence.text).not.toContain('待っ');
    expect(help.blank).toEqual({
      text: '駅で友達を待っている間に、本を読みました。',
      answer: '待っ',
      readings: ['まっ', '待っ'],
    });
    expect(questionHelpCard(blank, sentence, true).blank).toBeUndefined();
    expect(questionHelpCard(q, sentence, false).blank).toBeUndefined();
  });

  it('tells it what a drill blank hides too', () => {
    const range = { from: 5, to: 7, fill: '＿' };
    expect(blankHelpCard(sentence, range, false).blank).toMatchObject({ answer: '待っ' });
    expect(blankHelpCard(sentence, range, true).blank).toBeUndefined();
  });
});
