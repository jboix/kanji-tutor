import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../../domain/session-types.ts';
import { S } from '../../test/reading-fixtures.ts';
import { explainInput } from './sentence-input.ts';

const masked: SessionCard = {
  sentence: { ...S.waiting, text: '駅で友達を（＿＿＿）ている間に、本を読みました。' },
  targets: [],
  reason: 'drill',
};

describe('explainInput', () => {
  it('sends the masked sentence with its translation when nothing is blanked (L3)', () => {
    const input = explainInput(masked, 'While waiting…', [], []);
    expect(input).toEqual({
      sentence: { text: masked.sentence.text, translation: 'While waiting…' },
      grammar: [],
      hidden: [],
    });
  });

  it('sends the real sentence and the hidden answer for a blank, without the translation (A19)', () => {
    const blank = {
      text: '駅で友達を待っている間に、本を読みました。',
      answer: '待っ',
      readings: ['まっ'],
    };
    const input = explainInput(masked, 'While waiting…', [], [], blank);
    expect(input.sentence).toEqual({ text: blank.text });
    expect(input.blank).toEqual({ shown: masked.sentence.text, answer: '待っ' });
    expect(input.hidden).toEqual([{ surface: '待っ', readings: ['まっ'] }]);
  });
});
