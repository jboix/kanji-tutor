import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerState, answerLook, CheckMark } from './answer-state.tsx';

describe('AnswerState (U2)', () => {
  it('maps grades to looks: only a right answer is correct, a skip is its own state', () => {
    expect(answerLook({ verdict: 'correct' })).toBe('correct');
    expect(answerLook({ verdict: 'near-miss' })).toBe('wrong');
    expect(answerLook({ verdict: 'wrong' })).toBe('wrong');
    expect(answerLook({ verdict: 'wrong', skipped: true })).toBe('skipped');
  });

  it('carries the look as a data attribute and a state class', () => {
    const { container, rerender } = render(
      <AnswerState look="correct">
        <CheckMark />
      </AnswerState>,
    );
    const box = container.firstElementChild;
    expect(box?.getAttribute('data-answer')).toBe('correct');
    expect(box?.className).toMatch(/correct/);
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    rerender(<AnswerState look="wrong">x</AnswerState>);
    expect(container.firstElementChild?.getAttribute('data-answer')).toBe('wrong');
    expect(container.firstElementChild?.className).toMatch(/wrong/);
    expect(container.firstElementChild?.className).not.toMatch(/correct/);
  });
});
