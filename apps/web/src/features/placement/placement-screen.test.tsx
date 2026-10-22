import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createAiClient } from '../../ai/client.ts';
import { createMockProvider } from '../../ai/providers/mock.ts';
import { testContext } from '../../ai/testing/context.ts';
import type { Repos } from '../../domain/repos.ts';
import { fixtureRepos } from '../../test/fixture-pack.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { PlacementScreen } from './placement-screen.tsx';

/** Answers every question with "I don't know", or the first option, until the writing step. */
async function answerAll(pick: 'skip' | 'first') {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Start' }));
  for (let n = 1; n <= 15; n += 1) {
    const card = await screen.findByRole('region', { name: `Question ${n} of about 15` });
    const buttons = card.querySelectorAll('button');
    const target = pick === 'skip' ? buttons[buttons.length - 1] : buttons[0];
    if (target) await user.click(target);
  }
  return user;
}

function render(repos: Repos, ai = fakeAi()) {
  return renderWithServices(<PlacementScreen />, { services: fakeServices({ repos, ai }) });
}

describe('Find my level (A11)', () => {
  it('runs 15 questions from N5 and proposes a level with notes, without a key', async () => {
    const repos = await fixtureRepos();
    const ai = fakeAi({
      assessLevel: async () => ({ ok: false, error: { kind: 'no-key', message: 'No key.' } }),
    });
    render(repos, ai);
    const user = await answerAll('skip');
    await screen.findByRole('region', { name: 'A short written answer' });
    expect(screen.getByText('自己紹介を書いてください。')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText('The questions point to N5.')).toBeTruthy();
    expect(screen.getByText(/^Kanji readings: not yet steady at N5\./)).toBeTruthy();
    expect(screen.queryByText(/score|%/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /^Ask the tutor to assess, / }));
    expect(await screen.findByText(/Add a Gemini key in/)).toBeTruthy();
    expect((await repos.settings.get()).learnerLevel).toBeUndefined();
    await user.click(screen.getByRole('button', { name: 'Use N5' }));
    expect(await screen.findByText(/Your level is now N5/)).toBeTruthy();
    expect((await repos.settings.get()).learnerLevel).toBe(5);
  }, 30_000);

  it('asks the tutor once with the written answer, and the learner can adjust before accepting', async () => {
    const repos = await fixtureRepos();
    let calls = 0;
    const client = createAiClient(async () => testContext({ provider: createMockProvider() }));
    const ai = fakeAi({
      assessLevel: (input) => {
        calls += 1;
        expect(input.written).toBe('わたしはアンナです。');
        expect(input.answers).toHaveLength(15);
        return client.assessLevel(input);
      },
    });
    render(repos, ai);
    const user = await answerAll('first');
    await user.type(await screen.findByRole('textbox'), 'わたしはアンナです。');
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(await screen.findByRole('button', { name: /^Ask the tutor to assess, / }));
    // The real client loads the task module on the first call: give it time under load.
    const note = await screen.findByRole(
      'note',
      { name: "The tutor's assessment" },
      { timeout: 5000 },
    );
    expect(note.textContent).toContain('The tutor suggests N4.');
    expect(note.textContent).toContain('Long vowels in N4 words');
    expect(calls).toBe(1);
    expect(screen.getByRole('button', { name: 'Use N4' })).toBeTruthy();
    await user.click(screen.getByLabelText('N3'));
    await user.click(screen.getByRole('button', { name: 'Use N3' }));
    expect((await repos.settings.get()).learnerLevel).toBe(3);
  }, 30_000);
});
