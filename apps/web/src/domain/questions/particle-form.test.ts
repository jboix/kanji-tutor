import { describe, expect, it } from 'vitest';
import type { Sentence, Token } from '../types.ts';
import { particleFormQuestion } from './particle-form.ts';

function sentence(id: string, parts: [string, string, string?][]): Sentence {
  let start = 0;
  const tokens: Token[] = parts.map(([surface, pos, base]) => {
    const token = { surface, reading: surface, base: base ?? surface, pos, start, wordId: surface };
    start += surface.length;
    return token;
  });
  const text = parts.map(([surface]) => surface).join('');
  return {
    id,
    text,
    tokens,
    wordIds: [],
    source: 'tatoeba',
    verified: true,
    translation: 'I close the door.',
  };
}

const DOOR = sentence('door', [
  ['ドア', 'noun'],
  ['を', 'particle'],
  ['閉め', 'verb', '閉める'],
  ['ます', 'auxiliary'],
  ['。', 'symbol'],
]);

describe('particleFormQuestion (J4 at N5)', () => {
  it('blanks the case particle before a verb, against の, や and か', () => {
    const question = particleFormQuestion({ sentence: DOOR, seed: 's' });
    expect(question?.kind).toBe('grammar-form');
    expect(question?.stem).toEqual({
      before: 'ドア',
      target: 'を',
      after: '閉めます。',
      mark: 'blank',
    });
    expect(question?.options.map((o) => o.text).sort()).toEqual(['か', 'の', 'や', 'を'].sort());
    expect(question?.options[question.answer]?.text).toBe('を');
    expect(question?.itemId).toBe('grammar:particle-wo');
  });

  it('never asks は or も, nor a particle after a question word or before a noun', () => {
    const topic = sentence('topic', [
      ['今日', 'noun'],
      ['は', 'particle'],
      ['休み', 'noun'],
      ['です', 'auxiliary'],
      ['。', 'symbol'],
    ]);
    expect(particleFormQuestion({ sentence: topic, seed: 's' })).toBeUndefined();
    const what = sentence('what', [
      ['何', 'pronoun'],
      ['が', 'particle'],
      ['ある', 'verb'],
      ['の', 'particle'],
      ['？', 'symbol'],
    ]);
    expect(particleFormQuestion({ sentence: what, seed: 's' })).toBeUndefined();
    const linked = sentence('linked', [
      ['駅', 'noun'],
      ['の', 'particle'],
      ['前', 'noun'],
      ['です', 'auxiliary'],
      ['。', 'symbol'],
    ]);
    expect(particleFormQuestion({ sentence: linked, seed: 's' })).toBeUndefined();
  });
});
