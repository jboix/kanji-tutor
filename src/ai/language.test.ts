import { describe, expect, it } from 'vitest';
import { languageLine, languageName, languageRule, proseInLanguage } from './language.ts';

describe('language names and rules', () => {
  it('names languages in English and falls back to the code', () => {
    expect(languageName('fr')).toBe('French');
    expect(languageName('es')).toBe('Spanish');
    expect(languageName('zz')).toBe('zz');
    expect(languageName('not a code!')).toBe('not a code!');
  });

  it('puts the language in the rule and the request line', () => {
    expect(languageRule('es')).toContain('in Spanish (es)');
    expect(languageLine('fr')).toBe(
      'Explanation language: French (fr). Write all non-Japanese prose in French.',
    );
  });
});

describe('proseInLanguage', () => {
  it('accepts Latin-script prose that quotes Japanese', () => {
    expect(proseInLanguage(['With 間に, the reading happened while you waited.'], 'en')).toBe(true);
    expect(proseInLanguage(['Avec 間に, la lecture a eu lieu pendant l’attente.'], 'fr-FR')).toBe(
      true,
    );
  });

  it('rejects prose written in Japanese when another language was asked for', () => {
    expect(proseInLanguage(['のんびり過ごすという意味です。'], 'fr')).toBe(false);
    expect(proseInLanguage(['のんびり過ごすという意味です。'], 'ru')).toBe(false);
  });

  it('passes Japanese, empty prose and non-Latin languages written in their script', () => {
    expect(proseInLanguage(['のんびり過ごす。'], 'ja')).toBe(true);
    expect(proseInLanguage(['', '…'], 'en')).toBe(true);
    expect(proseInLanguage([''], 'ru')).toBe(true);
    expect(proseInLanguage(['Это значит «ждать».'], 'ru')).toBe(true);
  });
});
