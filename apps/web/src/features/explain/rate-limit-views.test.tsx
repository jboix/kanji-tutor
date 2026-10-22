import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient, Result } from '../../ai/types.ts';
import { ANSWER, CARD, ok, TARGET, WRONG } from '../../test/explain-results.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeLang, fakeServices, renderWithServices } from '../../test/render.tsx';
import { AskBox } from './ask-box.tsx';
import { MistakeExplanation } from './mistake-explanation.tsx';
import { ReadingHook } from './reading-hook.tsx';

/** A 429 with the wait Google asked for (A14). */
const rateLimited = (retryAfterMs: number) => (): Promise<Result<never>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

/** The AI status box once it shows the countdown. */
async function waitBox(): Promise<HTMLElement> {
  return waitFor(() => {
    const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
    if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
    return box;
  });
}

/** The countdown with Retry disabled during a 30 s wait. */
async function expectCountdown() {
  const box = await waitBox();
  expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
  expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
}

/** After a wait of 0: Retry is enabled and asks again. */
async function retryOnce(task: { mock: { calls: unknown[] } }) {
  const box = await waitBox();
  expect(box.textContent).toContain('You can ask again now.');
  const before = task.mock.calls.length;
  await userEvent.click(within(box).getByRole('button', { name: /^Retry, / }));
  await waitFor(() => expect(task.mock.calls.length).toBe(before + 1));
}

async function mistake(ai: Partial<AiClient>) {
  const services = fakeServices({
    ai: fakeAi(ai),
    repos: await readingRepos(),
    lang: fakeLang({
      tokenize: async (text) => Object.values(S).find((s) => s.text === text)?.tokens ?? [],
    }),
  });
  renderWithServices(
    <MistakeExplanation
      card={CARD}
      target={TARGET}
      answer="motte"
      grade={WRONG}
      onOpenWord={vi.fn()}
    />,
    { services },
  );
  await userEvent.click(await screen.findByRole('button', { name: /^Ask the tutor why, / }));
}

function ask(ai: Partial<AiClient>) {
  renderWithServices(<AskBox sentence={S.waiting} />, {
    services: fakeServices({ ai: fakeAi(ai) }),
  });
  return userEvent.type(
    screen.getByLabelText('Ask about this sentence'),
    'What does 間に do?{Enter}',
  );
}

async function hook(ai: Partial<AiClient>) {
  const services = fakeServices({ ai: fakeAi(ai), repos: await readingRepos() });
  renderWithServices(<ReadingHook kanji="生" reading="ショウ" wordIds={[W.issho.id]} />, {
    services,
  });
  await userEvent.click(screen.getByRole('button', { name: /^Show a memory hook, / }));
}

describe('rate limit in the explain views (A14, D57)', () => {
  it('mistake note: countdown and Retry', async () => {
    await mistake({ explainMistake: vi.fn(rateLimited(30_000)), peek: async () => undefined });
    await expectCountdown();
  });

  it('mistake note: Retry asks again once the wait has passed', async () => {
    const explainMistake = vi.fn(rateLimited(0));
    await mistake({ explainMistake, peek: async () => undefined });
    await retryOnce(explainMistake);
  });

  it('ask box answer: countdown and Retry', async () => {
    await ask({ answerQuestion: vi.fn(rateLimited(30_000)) });
    await expectCountdown();
  });

  it('ask box answer: Retry asks the same question again', async () => {
    const answerQuestion = vi.fn(rateLimited(0));
    await ask({ answerQuestion });
    await retryOnce(answerQuestion);
    expect(answerQuestion).toHaveBeenLastCalledWith(
      expect.objectContaining({ question: 'What does 間に do?' }),
    );
  });

  it('follow-up chip: countdown, and Retry runs the chip again', async () => {
    const followUp = vi.fn(rateLimited(0));
    await ask({ answerQuestion: () => ok(ANSWER), followUp });
    const note = await screen.findByRole('note', { name: 'Answer' });
    await userEvent.click(within(note).getByRole('button', { name: /^Simpler, please, / }));
    await retryOnce(followUp);
    expect(followUp).toHaveBeenLastCalledWith(expect.objectContaining({ kind: 'simpler' }));
  });

  it('follow-up chip: countdown during the wait', async () => {
    await ask({ answerQuestion: () => ok(ANSWER), followUp: vi.fn(rateLimited(30_000)) });
    const note = await screen.findByRole('note', { name: 'Answer' });
    await userEvent.click(within(note).getByRole('button', { name: /^Simpler, please, / }));
    await expectCountdown();
  });

  it('kanji memory hook: countdown and Retry', async () => {
    await hook({ explainWord: vi.fn(rateLimited(30_000)) });
    await expectCountdown();
  });

  it('kanji memory hook: Retry asks again', async () => {
    const explainWord = vi.fn(rateLimited(0));
    await hook({ explainWord });
    await retryOnce(explainWord);
  });
});
