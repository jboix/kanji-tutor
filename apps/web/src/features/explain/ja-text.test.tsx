import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JaText, splitJapanese } from './ja-text.tsx';

describe('splitJapanese', () => {
  it('splits English and Japanese runs', () => {
    expect(splitJapanese('You read 持, to hold: 待って。')).toEqual([
      { text: 'You read ', ja: false, start: 0 },
      { text: '持', ja: true, start: 9 },
      { text: ', to hold: ', ja: false, start: 10 },
      { text: '待って。', ja: true, start: 21 },
    ]);
    expect(splitJapanese('')).toEqual([]);
  });

  it('puts Japanese in lang="ja" spans', () => {
    const { container } = render(<JaText text="間に means while" />);
    const ja = container.querySelectorAll('[lang="ja"]');
    expect([...ja].map((el) => el.textContent)).toEqual(['間に']);
    expect(container.textContent).toBe('間に means while');
  });
});
