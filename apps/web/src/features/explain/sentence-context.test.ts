import { describe, expect, it } from 'vitest';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { fr } from '../../ui/i18n/messages/fr/index.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { followUpChips } from './sentence-context.ts';

const t = createTranslator('en', ENGLISH, ENGLISH);

describe('followUpChips', () => {
  it('always offers all five kinds, with the model labels where it gave them', () => {
    const chips = followUpChips(
      t,
      [
        { kind: 'example', label: 'One more with 待' },
        { kind: 'simpler', label: 'Break down the sentence' },
        { kind: 'compare', label: '待 and 持 side by side' },
      ],
      '待って',
    );
    expect(chips).toEqual([
      { kind: 'compare', label: '待 and 持 side by side' },
      { kind: 'example', label: 'One more with 待' },
      { kind: 'simpler', label: 'Simpler, please' },
      { kind: 'quiz', label: 'Quiz me on 待って' },
      { kind: 'keep', label: 'Keep in my notes' },
    ]);
  });

  it('fills every kind from the target when the model gave no chips', () => {
    expect(followUpChips(t, [], '間に').map((chip) => chip.label)).toEqual([
      'Compare 間に with a lookalike',
      'One more with 間に',
      'Simpler, please',
      'Quiz me on 間に',
      'Keep in my notes',
    ]);
  });

  it('can offer a chosen subset, in order', () => {
    const chips = followUpChips(t, [{ kind: 'keep', label: 'Keep it' }], '間', ['simpler', 'keep']);
    expect(chips).toEqual([
      { kind: 'simpler', label: 'Simpler, please' },
      { kind: 'keep', label: 'Keep it' },
    ]);
  });

  it('words default chips in the learner language', () => {
    const french = createTranslator('fr', fr, ENGLISH);
    expect(followUpChips(french, [], '間', ['simpler', 'quiz']).map((c) => c.label)).toEqual([
      'Plus simplement',
      'Une question sur 間',
    ]);
  });
});
