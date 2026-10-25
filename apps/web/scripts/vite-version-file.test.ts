import { describe, expect, it } from 'vitest';
import { featureLines } from './vite-version-file.ts';

describe('the lines on what is new', () => {
  it('keeps the feat subjects, without their prefix, capitalised', () => {
    const subjects = [
      'feat(web): a verdict on Use it, with what works',
      'fix(web): keep suggested questions inside the tutor sheet',
      'feat: listening drills can wait',
      'chore(release): 1.4.0 [skip ci]',
    ];
    expect(featureLines(subjects)).toEqual([
      'A verdict on Use it, with what works',
      'Listening drills can wait',
    ]);
  });

  it('keeps three at most, newest first', () => {
    const subjects = ['feat: one', 'feat: two', 'feat: three', 'feat: four'];
    expect(featureLines(subjects)).toEqual(['One', 'Two', 'Three']);
  });

  it('has nothing to say without feat commits', () => {
    expect(featureLines([''])).toEqual([]);
  });
});
