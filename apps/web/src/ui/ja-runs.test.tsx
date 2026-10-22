import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JaRuns } from './ja-runs.tsx';

describe('JaRuns (N7, issue 57)', () => {
  it('sets only the Japanese of a lesson tag in Japanese type, digits included', () => {
    const { container } = render(<JaRuns text="Tobira 第4課" />);
    const ja = [...container.querySelectorAll('[lang="ja"]')].map((node) => node.textContent);
    expect(ja).toEqual(['第4課']);
    expect(container.textContent).toBe('Tobira 第4課');
  });

  it('leaves Latin text alone', () => {
    const { container } = render(<JaRuns text="Minna 12" />);
    expect(container.querySelector('[lang="ja"]')).toBeNull();
  });
});
