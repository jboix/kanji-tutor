import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiClient, Result } from '../../ai/types.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { TARGET } from '../../test/explain-results.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { resetIntroduced } from './intro-once.ts';
import { NewItemIntro } from './new-item-intro.tsx';
import { SentenceHelp } from './sentence-help.tsx';

const CARD: SessionCard = { sentence: S.waiting, targets: [TARGET], reason: 'new' };

/** A 429 with the wait Google asked for (A14). */
const rateLimited = (retryAfterMs: number) => (): Promise<Result<never>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

async function render(ui: React.ReactElement, ai: Partial<AiClient>) {
  const services = fakeServices({ repos: await readingRepos(), ai: fakeAi(ai) });
  return renderWithServices(ui, { services });
}

/** The AI status box once it shows the countdown. */
function waitBox(): Promise<HTMLElement> {
  return waitFor(() => {
    const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
    if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
    return box;
  });
}

async function openHelp(ai: Partial<AiClient>) {
  await render(<SentenceHelp card={CARD} step={0} />, ai);
  await userEvent.click(screen.getByRole('button', { name: 'Explain this sentence' }));
  const sheet = await screen.findByRole('dialog', { name: 'About this sentence' });
  await userEvent.click(within(sheet).getByRole('button', { name: /^Ask the tutor, / }));
}

async function openHook(ai: Partial<AiClient>) {
  await render(<NewItemIntro card={CARD} target={TARGET} onDone={() => undefined} />, ai);
  await userEvent.click(await screen.findByRole('button', { name: /^Ask the tutor for a hook, / }));
}

beforeEach(() => {
  resetIntroduced();
  localStorage.clear();
});

describe('rate limit in the teach views (A14)', () => {
  it('sentence help: countdown with Retry disabled during the wait', async () => {
    await openHelp({ explainSentence: vi.fn(rateLimited(30_000)) });
    const box = await waitBox();
    expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
  });

  it('sentence help: Retry asks again once the wait has passed', async () => {
    const explainSentence = vi.fn(rateLimited(0));
    await openHelp({ explainSentence });
    const box = await waitBox();
    expect(explainSentence).toHaveBeenCalledTimes(1);
    await userEvent.click(within(box).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(explainSentence).toHaveBeenCalledTimes(2));
  });

  it('intro memory hook: countdown with Retry disabled during the wait', async () => {
    await openHook({ memoryHook: vi.fn(rateLimited(30_000)) });
    const box = await waitBox();
    expect(box.textContent).toContain('You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
  });

  it('intro memory hook: Retry asks again', async () => {
    const memoryHook = vi.fn(rateLimited(0));
    await openHook({ memoryHook });
    const box = await waitBox();
    await userEvent.click(within(box).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(memoryHook).toHaveBeenCalledTimes(2));
  });
});
