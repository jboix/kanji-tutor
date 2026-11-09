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

  it('keeps them all, newest first, up to a safety cap of 30', () => {
    const subjects = ['feat: one', 'feat: two', 'feat: three', 'feat: four'];
    expect(featureLines(subjects)).toEqual(['One', 'Two', 'Three', 'Four']);
    const many = Array.from({ length: 40 }, (_, i) => `feat: line ${i}`);
    expect(featureLines(many)).toHaveLength(30);
  });

  it('has nothing to say without feat commits', () => {
    expect(featureLines([''])).toEqual([]);
  });
});
