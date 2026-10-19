import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient, Result, WeeklyNotes } from '../../ai/types.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { NotesScreen } from './notes-screen.tsx';

/** Sunday 18 October 2026, local time: the last day of 2026-W42. */
const NOW = new Date(2026, 9, 18, 20).getTime();

/** A 429 with the wait Google asked for (A14). */
const rateLimited = (retryAfterMs: number) => (): Promise<Result<WeeklyNotes>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

/** A week with one review, so there is a letter to ask for; then asks for it. */
async function askLetter(weeklyNotes: AiClient['weeklyNotes']) {
  const repos = await readingRepos();
  await repos.reviews.add({
    at: new Date(2026, 9, 14, 9).getTime(),
    itemId: `word:${W.shoukai.id}`,
    answer: 'しょかい',
    expected: 'しょうかい',
    verdict: 'near-miss',
    errorType: 'long-vowel',
    durationMs: 3000,
    mode: 'typed',
  });
  const services = fakeServices({
    repos,
    ai: fakeAi({ weeklyNotes, peek: vi.fn(async () => undefined) }),
  });
  renderWithServices(<NotesScreen now={NOW} />, { services, path: '/notes' });
  const name = /^Ask the tutor to write this week's letter, (1 request|saved), uses AI/;
  fireEvent.click(await screen.findByRole('button', { name }));
}

function waitBox(): Promise<HTMLElement> {
  return waitFor(() => {
    const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
    if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
    return box;
  });
}

describe('rate limit on the weekly letter (A14, D57)', () => {
  it('keeps the plain letter and shows the countdown with Retry disabled', async () => {
    await askLetter(vi.fn(rateLimited(30_000)));
    const box = await waitBox();
    expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
    expect(screen.getByRole('region', { name: 'Letter on the week' })).toBeTruthy();
  });

  it('asks again on Retry once the wait has passed', async () => {
    const weeklyNotes = vi.fn(rateLimited(0));
    await askLetter(weeklyNotes);
    const box = await waitBox();
    fireEvent.click(within(box).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(weeklyNotes).toHaveBeenCalledTimes(2));
  });
});
