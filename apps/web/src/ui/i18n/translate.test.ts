import { describe, expect, it } from 'vitest';
import { createFormats } from './format.ts';
import { ENGLISH, loadMessages } from './load.ts';
import { fr } from './messages/fr/index.ts';
import { createTranslator, interpolate } from './translate.ts';
import type { Messages } from './types.ts';

describe('createTranslator', () => {
  it('looks up a key in the language, with English as the base', async () => {
    const t = createTranslator('fr', await loadMessages('fr'), ENGLISH);
    expect(t('common.next')).toBe('Suivant');
    const partial = { ...fr, common: {} } as unknown as Messages;
    expect(createTranslator('fr', partial, ENGLISH)('common.next')).toBe('Next');
  });

  it('fills placeholders and formats numbers for the locale', () => {
    const t = createTranslator('en', ENGLISH, ENGLISH);
    expect(t('ai.refused', { status: 403 })).toContain('(403)');
    expect(interpolate('{n} of {total}', { n: 1234 }, new Intl.NumberFormat('fr-FR'))).toBe(
      '1 234 of {total}',
    );
  });

  it('picks plural forms with the language rules', () => {
    const messages = {
      ...ENGLISH,
      common: { ...ENGLISH.common, back: { one: '{n} card', other: '{n} cards' } },
    } as unknown as Messages;
    const t = createTranslator('fr', messages, ENGLISH) as (k: string, p: object) => string;
    expect(t('common.back', { n: 1 })).toBe('1 card');
    expect(t('common.back', { n: 0 })).toBe('0 card');
    expect(t('common.back', { n: 2 })).toBe('2 cards');
    const english = createTranslator('en', messages, ENGLISH) as (k: string, p: object) => string;
    expect(english('common.back', { n: 0 })).toBe('0 cards');
  });

  it('shows an unknown key as itself', () => {
    const t = createTranslator('en', ENGLISH, ENGLISH) as (k: string) => string;
    expect(t('nope.nothing')).toBe('nope.nothing');
  });
});

describe('createFormats', () => {
  it('formats costs in dollars, with four decimals under a cent', () => {
    expect(createFormats('en').cost(1.5)).toBe('$1.50');
    expect(createFormats('en').cost(0.0004)).toBe('$0.0004');
    expect(createFormats('fr').cost(0)).toMatch(/^0,00/);
  });

  it('formats dates and numbers for the language', () => {
    const at = new Date(2026, 9, 18);
    expect(createFormats('fr').date(at, { day: 'numeric', month: 'long' })).toBe('18 octobre');
    expect(createFormats('es').date(at, { day: 'numeric', month: 'long' })).toBe('18 de octubre');
    expect(createFormats('en').number(1234)).toBe('1,234');
  });
});
