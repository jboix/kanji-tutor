import { describe, expect, it } from 'vitest';
import { questionTranslationIn } from './localized.ts';

const sentence = {
  id: 's-1',
  translation: 'It is too late.',
  translations: { fr: 'Il est trop tard.' },
};
const question = { sentenceId: 's-1', translation: 'It is too late.' };

describe('questionTranslationIn (N9, issue 44)', () => {
  it("takes the source sentence's pack translation", () => {
    expect(questionTranslationIn(question, sentence, 'fr')).toEqual({
      value: 'Il est trop tard.',
      fallback: false,
    });
  });

  it('marks the English one when the pack has none, or the sentence is another', () => {
    expect(questionTranslationIn(question, sentence, 'es')).toEqual({
      value: 'It is too late.',
      fallback: true,
    });
    expect(questionTranslationIn(question, { ...sentence, id: 's-2' }, 'fr').fallback).toBe(true);
    expect(questionTranslationIn(question, undefined, 'fr').fallback).toBe(true);
  });

  it('never marks English for an English learner', () => {
    expect(questionTranslationIn(question, undefined, 'en')).toEqual({
      value: 'It is too late.',
      fallback: false,
    });
    expect(questionTranslationIn({}, undefined, 'fr')).toEqual({
      value: undefined,
      fallback: false,
    });
  });
});
