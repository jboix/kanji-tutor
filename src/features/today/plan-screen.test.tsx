import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import type { ErrorType } from '../../domain/types.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import { PlanScreen } from './plan-screen.tsx';

/** Sunday 18 October 2026, local time: the last day of 2026-W42. */
const NOW = new Date(2026, 9, 18, 20).getTime();
const on = (day: number) => new Date(2026, 9, day, 9).getTime();

async function miss(repos: Repos, at: number, word: { id: string }, errorType: ErrorType) {
  await repos.reviews.add({
    at,
    itemId: `word:${word.id}`,
    answer: 'しょかい',
    expected: 'しょうかい',
    verdict: 'near-miss',
    errorType,
    durationMs: 3000,
    mode: 'typed',
  });
}

/** Two long-vowel misses and two unused grammar points of the lesson. */
async function longVowelWeek(): Promise<Repos> {
  const lesson = 'Tobira 第4課';
  const repos = await readingRepos({ currentLesson: lesson });
  await repos.grammar.putMany([
    {
      id: 'わけではない',
      pattern: '〜わけではない',
      meaning: 'not that',
      lesson,
      exampleSentenceIds: [],
    },
    { id: 'に対して', pattern: '〜に対して', meaning: 'towards', lesson, exampleSentenceIds: [] },
  ]);
  await miss(repos, on(13), W.shoukai, 'long-vowel');
  await miss(repos, on(14), W.issho, 'long-vowel');
  return repos;
}

function renderPlan(repos: Repos, language: UiLanguage = 'en') {
  renderWithServices(<PlanScreen now={NOW} />, {
    services: fakeServices({ repos }),
    path: '/plan',
    language,
  });
}

describe("This week's plan (A7, IA6)", () => {
  it('proposes a plan from the week, and saves it for this week as accepted', async () => {
    const repos = await longVowelWeek();
    renderPlan(repos);
    expect(await screen.findByRole('heading', { name: "This week's plan" })).toBeTruthy();
    expect(
      await screen.findByText('10 minutes of reading. One in four sentences has a long vowel.'),
    ).toBeTruthy();
    expect(screen.getByRole('list').textContent).toContain(
      'Write one sentence each with 〜わけではない and 〜に対して.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      "This week's sessions follow this plan.",
    );
    expect(await repos.plans.get('2026-W42')).toMatchObject({
      status: 'accepted',
      mix: { dailyMinutes: 10, focusErrorTypes: { 'long-vowel': 0.25 }, drillShare: 0 },
    });
    expect(await repos.plans.get('2026-W43')).toBeUndefined();
  });

  it('saves an edited plan', async () => {
    const repos = await longVowelWeek();
    renderPlan(repos);
    fireEvent.click(await screen.findByRole('button', { name: 'Change it' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'What, line 2' }), {
      target: { value: 'Write one sentence with 〜わけではない.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'More daily minutes' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Long vowels' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'The small っ' }));
    expect(screen.getByRole('textbox', { name: 'What, line 1' })).toHaveProperty(
      'value',
      '15 minutes of reading. One in four sentences has a small っ.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Use this plan' }));
    await screen.findByRole('status');
    const plan = await repos.plans.get('2026-W42');
    expect(plan?.mix).toMatchObject({ dailyMinutes: 15, focusErrorTypes: { sokuon: 0.25 } });
    expect(plan?.lines[1]).toEqual({
      when: 'Tue, Thu',
      what: 'Write one sentence with 〜わけではない.',
    });
  });

  it('cancels an edit and shows a plan saved earlier as accepted', async () => {
    const repos = await longVowelWeek();
    await repos.plans.put({
      id: '2026-W42',
      createdAt: NOW,
      letter: [],
      lines: [{ when: 'Daily', what: 'My own plan.' }],
      mix: { dailyMinutes: 20, focusErrorTypes: {}, grammarIds: [], drillShare: 0 },
      status: 'accepted',
    });
    renderPlan(repos);
    expect(await screen.findByText('My own plan.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Change it' }));
    fireEvent.click(screen.getByRole('button', { name: 'More daily minutes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('My own plan.')).toBeTruthy();
  });

  it('words the plan in French and Spanish', async () => {
    renderPlan(await longVowelWeek(), 'fr');
    expect(await screen.findByRole('heading', { name: 'Le plan de la semaine' })).toBeTruthy();
    expect(await screen.findByText('10 minutes de lecture.', { exact: false })).toBeTruthy();
  });

  it('words the plan in Spanish and saves it as shown', async () => {
    const repos = await longVowelWeek();
    renderPlan(repos, 'es');
    fireEvent.click(await screen.findByRole('button', { name: 'Seguir este plan' }));
    expect((await screen.findByRole('status')).textContent).toBe(
      'Las sesiones de esta semana siguen este plan.',
    );
    expect((await repos.plans.get('2026-W42'))?.lines[0]?.when).toBe('A diario');
  });
});
