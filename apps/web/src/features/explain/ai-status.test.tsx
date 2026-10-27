import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithServices } from '../../test/render.tsx';
import { AiProblem } from './ai-status.tsx';

describe('AiProblem', () => {
  it('offers Retry at once when Gemini was too slow', () => {
    const onRetry = vi.fn();
    renderWithServices(
      <AiProblem
        error={{ kind: 'provider', code: 'timeout', message: 'slow' }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(/took too long to answer; it may be busy/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Retry/ }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says Gemini is busy after a 5xx, with Retry', () => {
    renderWithServices(
      <AiProblem
        error={{ kind: 'provider', code: 'busy', status: 503, message: 'overloaded' }}
        onRetry={() => undefined}
      />,
    );
    expect(screen.getByText(/Gemini is busy right now/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Retry/ })).toBeTruthy();
  });

  it('has no Retry for a refusal, which asking again would not fix', () => {
    renderWithServices(
      <AiProblem
        error={{ kind: 'provider', code: 'refused', status: 403, message: 'no' }}
        onRetry={() => undefined}
      />,
    );
    expect(screen.queryByRole('button', { name: /^Retry/ })).toBeNull();
  });
});
