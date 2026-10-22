import { describe, expect, it, vi } from 'vitest';
import { explanationLanguageOf } from './defaults.ts';
import { pickLanguage, resolveLanguage } from './language.ts';

describe('the interface and tutor language (N7b, N10, issue 43)', () => {
  it('picks the first offered language of a list', () => {
    expect(pickLanguage(['de-DE', 'fr-CA'])).toBe('fr');
    expect(pickLanguage(['de'])).toBe('en');
    expect(pickLanguage([])).toBe('en');
  });

  it('keeps a stored choice over the browser', () => {
    expect(resolveLanguage('es', ['fr-FR'])).toBe('es');
    expect(resolveLanguage(' ', ['fr-FR'])).toBe('fr');
  });

  it('gives the tutor the browser language when none was saved, like the interface', () => {
    expect(explanationLanguageOf({}, ['fr-FR', 'en'])).toBe('fr');
    expect(explanationLanguageOf({}, ['de-DE'])).toBe('en');
    expect(explanationLanguageOf({ uiLanguage: 'es' }, ['fr-FR'])).toBe('es');
  });

  it('reads the browser languages by default', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-MX']);
    expect(explanationLanguageOf({})).toBe('es');
    vi.restoreAllMocks();
  });
});
