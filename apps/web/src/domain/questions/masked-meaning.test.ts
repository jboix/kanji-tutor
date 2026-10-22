import { describe, expect, it } from 'vitest';
import { MASK, maskedMeaning, meaningFields } from './options.ts';

describe('maskedMeaning (J3, J4)', () => {
  it('masks the words of the blank’s meaning, with their endings', () => {
    expect(maskedMeaning('I want to drink tea.', ['want to …; wish to …'])).toBe(
      `I ${MASK} to drink tea.`,
    );
    expect(maskedMeaning('She was waiting at the station.', ['to wait; to await'])).toBe(
      `She was ${MASK} at the station.`,
    );
    expect(maskedMeaning('My head feels heavy.', ['heavy; feeling heavy'])).toBe(
      `My head ${MASK}.`,
    );
  });

  it('gives no hint when the translation says it in other words', () => {
    expect(maskedMeaning("I'd like to check out.", ['want to …'])).toBeUndefined();
    expect(meaningFields("I'd like to check out.", ['want to …'])).toEqual({
      translation: "I'd like to check out.",
    });
    expect(meaningFields(undefined, ['want to'])).toEqual({});
  });
});
