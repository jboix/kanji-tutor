import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OUTPUT, thirdPartyText } from './third-party.ts';

describe('third-party licences', () => {
  it('the committed file is up to date (run `bun run credits`)', () => {
    expect(readFileSync(OUTPUT, 'utf8')).toBe(`${thirdPartyText()}\n`);
  });

  it('prints the app, the data, the fonts and every runtime library', () => {
    const text = thirdPartyText();
    for (const name of [
      'Kanji Tutor',
      'JMdict',
      'Tatoeba',
      'KanjiCanvas',
      '@fontsource/klee-one',
    ]) {
      expect(text).toContain(name);
    }
    expect(text).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(text).toContain('mecab-ipadic');
  });
});
