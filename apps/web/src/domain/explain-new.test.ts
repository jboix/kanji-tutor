import { describe, expect, it } from 'vitest';
import { explainsGrammar, explainsKanji } from './explain-new.ts';

describe('explain new grammar and kanji', () => {
  it('explains both when nothing is set', () => {
    expect(explainsGrammar({})).toBe(true);
    expect(explainsKanji({})).toBe(true);
  });

  it('follows the former single setting until each is set', () => {
    expect(explainsGrammar({ explainFirst: false })).toBe(false);
    expect(explainsKanji({ explainFirst: false })).toBe(false);
    expect(explainsGrammar({ explainFirst: true })).toBe(true);
    expect(explainsKanji({ explainFirst: true })).toBe(true);
  });

  it('lets each be set on its own', () => {
    const settings = { explainFirst: false, explainGrammar: true };
    expect(explainsGrammar(settings)).toBe(true);
    expect(explainsKanji(settings)).toBe(false);
    expect(explainsKanji({ explainFirst: true, explainKanji: false })).toBe(false);
  });
});
