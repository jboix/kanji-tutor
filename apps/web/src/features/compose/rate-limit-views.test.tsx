import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AiClient, Result } from '../../ai/index.ts';
import type { Repos } from '../../domain/repos.ts';
import type { GrammarPoint } from '../../domain/types.ts';
import type { Lang } from '../../lang/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ComposeScreen } from './compose-screen.tsx';

const SENTENCE = '日本語が嫌いわけではない。';
const WAKE: GrammarPoint = {
  id: 'wake-dewa-nai',
  pattern: '〜わけではない',
  meaning: "It's not that…",
  level: 3,
  exampleSentenceIds: [],
  lesson: 'Tobira 第4課',
};

/** Overrides first, then a rejection, like the stub in compose-screen.test.tsx. */
function stub<T extends object>(overrides: Partial<T>): T {
  const unwired = (name: string) => () => Promise.reject(new Error(`not wired: ${name}`));
  return new Proxy(overrides, {
    get: (target, name) => Reflect.get(target, name) ?? unwired(String(name)),
  }) as T;
}

/** A 429 with the wait Google asked for (A14). */
const rateLimited = (retryAfterMs: number) => (): Promise<Result<never>> =>
  Promise.resolve({
    ok: false,
    error: { kind: 'rate-limit', message: 'The tutor needs a minute.', retryAfterMs },
  });

async function renderCompose(ai: Partial<AiClient>) {
  const repos: Repos = createMemoryRepos({ settings: { currentLesson: 'Tobira 第4課' } });
  await repos.grammar.put(WAKE);
  const lang = stub<Lang>({ tokenize: async () => [] });
  const services = fakeServices({ repos, ai: stub<AiClient>(ai), lang });
  renderWithServices(
    <Routes>
      <Route path="/compose" element={<ComposeScreen />} />
    </Routes>,
    { services, path: '/compose' },
  );
  fireEvent.change(await screen.findByLabelText('Your sentence'), { target: { value: SENTENCE } });
  fireEvent.click(screen.getByRole('button', { name: /^Check, / }));
}

function waitBox(): Promise<HTMLElement> {
  return waitFor(() => {
    const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
    if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
    return box;
  });
}

afterEach(() => localStorage.clear());

describe('rate limit in Use it (A14)', () => {
  it('shows the countdown with Retry disabled, and keeps the draft', async () => {
    await renderCompose({ correctSentence: vi.fn(rateLimited(30_000)) });
    const box = await waitBox();
    expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
    expect((screen.getByLabelText('Your sentence') as HTMLTextAreaElement).value).toBe(SENTENCE);
  });

  it('checks again on Retry once the wait has passed', async () => {
    const correctSentence = vi.fn(rateLimited(0));
    await renderCompose({ correctSentence });
    const box = await waitBox();
    fireEvent.click(within(box).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(correctSentence).toHaveBeenCalledTimes(2));
  });
});
