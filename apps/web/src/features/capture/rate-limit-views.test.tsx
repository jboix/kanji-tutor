import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient, Result } from '../../ai/types.ts';
import {
  CAPTURE_LINES,
  captureDictionary,
  fixtureTokenize,
} from '../../domain/services/capture-fixtures.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeAi, fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import { CaptureScreen } from './capture-screen.tsx';

const LINE = CAPTURE_LINES.map((line) => line.text);

/** A 429 with the wait Google asked for (A14). */
const rateLimited = (retryAfterMs: number) => (): Promise<Result<never>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

/** Pastes the capture, taps line 2 and asks the tutor about it. */
async function askLine(answerQuestion: AiClient['answerQuestion']) {
  const repos = createMemoryRepos({ dictionary: captureDictionary() });
  const services = fakeServices({
    repos,
    lang: fakeLang({ tokenize: fixtureTokenize }),
    ai: fakeAi({ answerQuestion }),
  });
  renderWithServices(<CaptureScreen />, { services, path: '/capture' });
  fireEvent.click(screen.getByRole('button', { name: 'Paste text instead' }));
  fireEvent.change(screen.getByLabelText('Japanese text, one line per sentence'), {
    target: { value: LINE.join('\n') },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Use this text' }));
  fireEvent.click(await screen.findByRole('button', { name: LINE[2] ?? '' }));
  fireEvent.click(await screen.findByRole('button', { name: /^Ask the tutor about this line, / }));
}

function waitBox(): Promise<HTMLElement> {
  return waitFor(() => {
    const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
    if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
    return box;
  });
}

describe('rate limit on a capture line (A14, D57)', () => {
  it('shows the countdown with Retry disabled during the wait', async () => {
    await askLine(vi.fn(rateLimited(30_000)));
    const box = await waitBox();
    expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
  });

  it('asks again on Retry once the wait has passed', async () => {
    const answerQuestion = vi.fn(rateLimited(0));
    await askLine(answerQuestion);
    const box = await waitBox();
    fireEvent.click(within(box).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(answerQuestion).toHaveBeenCalledTimes(2));
  });
});
