import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Ruby } from './ruby.tsx';

describe('Ruby', () => {
  it('puts the reading over a word with kanji', () => {
    const { container } = render(<Ruby base="学生" reading="がくせい" />);
    expect(container.querySelector('rt')?.textContent).toBe('がくせい');
  });

  it('draws no reading over a word written in kana', () => {
    for (const base of ['ぜひ', 'ラーメン']) {
      const { container } = render(<Ruby base={base} reading="ぜひ" />);
      expect(container.querySelector('rt')).toBeNull();
      expect(container.textContent).toBe(base);
    }
  });
});
