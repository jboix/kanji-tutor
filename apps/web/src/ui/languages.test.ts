import { describe, expect, it } from 'vitest';
import { pickLanguage } from '../domain/language.ts';
import { languageName, languageOf } from './languages.ts';

describe('languages (N7b)', () => {
  it('follows the browser until one is chosen, else English', () => {
    expect(pickLanguage(['fr-CA', 'en'])).toBe('fr');
    expect(pickLanguage(['de-DE', 'es-MX'])).toBe('es');
    expect(pickLanguage(['de'])).toBe('en');
    expect(languageOf('es', ['fr'])).toBe('es');
    expect(languageOf(undefined, ['fr'])).toBe('fr');
    expect(languageOf(undefined, [])).toBe('en');
    expect(languageName('fr')).toBe('Français');
    expect(languageName('xx')).toBe('xx');
  });
});
