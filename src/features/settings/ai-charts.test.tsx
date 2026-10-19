import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AiLogEntry } from '../../domain/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { CHART_DAYS, chartsStart, perDay, perTask, tokenUse } from './ai-charts.ts';
import { CallsByTask, CallsPerDay, CostPerDay, TokensChart } from './ai-charts.tsx';
import { AiUseSection } from './ai-use-section.tsx';

const NOW = new Date(2026, 9, 17, 12).getTime();
const DAY = 86_400_000;
const entry = (patch: Partial<AiLogEntry>): AiLogEntry => ({
  at: NOW,
  task: 'explainWord',
  model: 'gemini-3.5-flash-lite',
  cached: false,
  inputTokens: 1000,
  outputTokens: 100,
  ok: true,
  ...patch,
});

const LOG = [
  entry({ cachedTokens: 600 }),
  entry({ task: 'explainMistake' }),
  entry({ cached: true, inputTokens: 0, outputTokens: 0 }),
  entry({ at: NOW - 2 * DAY, task: 'breakdownSentence' }),
  entry({ at: NOW - 40 * DAY }),
];

describe('AI use chart data (A16)', () => {
  it('covers the last 30 days, oldest first, splitting real calls from cache hits', () => {
    const days = perDay(LOG, NOW);
    expect(days).toHaveLength(CHART_DAYS);
    expect(days[0]?.start).toBe(chartsStart(NOW));
    expect(days.at(-1)).toMatchObject({ real: 2, cached: 1 });
    expect(days.at(-3)).toMatchObject({ real: 1, cached: 0 });
    expect(days.reduce((sum, d) => sum + d.real, 0)).toBe(3);
    // 400 fresh × 0.30 + 600 cached × 0.03 + 100 out × 2.50, per million, plus a plain call.
    const today = days.at(-1)?.costUsd ?? 0;
    expect(today).toBeCloseTo(
      (400 * 0.3 + 600 * 0.03 + 100 * 2.5 + 1000 * 0.3 + 100 * 2.5) / 1e6,
      10,
    );
  });

  it('counts calls by task, most first, and tokens by kind', () => {
    expect(perTask(LOG.slice(0, 4))).toEqual([
      { task: 'explainWord', real: 1, cached: 1 },
      { task: 'breakdownSentence', real: 1, cached: 0 },
      { task: 'explainMistake', real: 1, cached: 0 },
    ]);
    expect(tokenUse(LOG.slice(0, 4))).toEqual({ fresh: 2400, cached: 600, output: 300 });
  });
});

describe('AI use charts', () => {
  it('draws each chart with a text table for screen readers', () => {
    const days = perDay(LOG, NOW);
    renderWithServices(
      <>
        <CallsPerDay days={days} />
        <CostPerDay days={days} />
        <CallsByTask rows={perTask(LOG)} />
        <TokensChart use={tokenUse(LOG)} />
      </>,
    );
    const calls = screen.getByRole('table', { name: 'Calls per day, last 30 days' });
    expect(within(calls).getAllByRole('row')).toHaveLength(CHART_DAYS + 1);
    expect(within(calls).getByRole('row', { name: '17 Oct 2 1' })).toBeTruthy();
    expect(
      screen.getByRole('table', { name: 'Estimated cost per day, last 30 days' }),
    ).toBeTruthy();
    const tasks = screen.getByRole('table', { name: 'Calls by task, last 30 days' });
    expect(within(tasks).getByRole('row', { name: 'Explain a word 2 1' })).toBeTruthy();
    const tokens = screen.getByRole('table', { name: 'Tokens, last 30 days' });
    expect(within(tokens).getByRole('row', { name: 'Input from Gemini’s cache 600' })).toBeTruthy();
    expect(document.querySelectorAll('svg').length).toBe(4);
    expect(document.querySelector('svg title')?.textContent).toMatch(/to Gemini/);
  });

  it('shows the charts and the cached tokens on the AI use section', async () => {
    const repos = createMemoryRepos();
    for (const row of LOG) await repos.aiLog.add(row);
    renderWithServices(<AiUseSection now={() => NOW} />, { services: fakeServices({ repos }) });
    expect(await screen.findByRole('table', { name: 'Calls per day, last 30 days' })).toBeTruthy();
    expect(screen.getByText('Tokens from Gemini’s cache').nextElementSibling?.textContent).toBe(
      '600',
    );
  });
});
