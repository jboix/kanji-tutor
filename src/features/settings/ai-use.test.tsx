import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { AiLogEntry } from '../../domain/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { createFormats } from '../../ui/i18n/format.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { costByModel, startOfMonth, summariseAiUse } from './ai-use.ts';
import { AiUseSection } from './ai-use-section.tsx';
import { priceHint } from './model-section.tsx';

const NOW = new Date(2026, 9, 17, 12).getTime();
const entry = (patch: Partial<AiLogEntry>): AiLogEntry => ({
  at: NOW,
  task: 'explainMistake',
  model: 'gemini-2.5-flash-lite',
  cached: false,
  inputTokens: 0,
  outputTokens: 0,
  ok: true,
  ...patch,
});

const LOG = [
  entry({ inputTokens: 1_000_000, outputTokens: 0 }),
  entry({ model: 'gemini-2.5-flash', inputTokens: 0, outputTokens: 1_000_000 }),
  entry({ model: 'unknown-model', inputTokens: 500_000, outputTokens: 500_000, ok: false }),
  entry({ cached: true, inputTokens: 999, outputTokens: 999 }),
  entry({ cached: true }),
];

describe('AI use summary (A9)', () => {
  it('counts calls and cached answers and prices each call with its own model', () => {
    const summary = summariseAiUse(LOG);
    expect(summary).toMatchObject({
      calls: 3,
      failed: 1,
      cached: 2,
      inputTokens: 1_500_000,
      outputTokens: 1_500_000,
    });
    // 0.10 (2.5 lite in) + 2.50 (2.5 flash out) + 0.15 + 1.25 (3.5 Flash-Lite fallback) = 4.00
    expect(summary.costUsd).toBeCloseTo(4, 10);
  });

  it('prices Gemini 3.8 Flash by the date of each call and splits cost by model (A12)', () => {
    const launch = entry({
      model: 'gemini-3.8-flash',
      at: Date.UTC(2026, 11, 31),
      inputTokens: 1e6,
    });
    const regular = entry({
      model: 'gemini-3.8-flash',
      at: Date.UTC(2027, 0, 2),
      inputTokens: 1e6,
    });
    const lite = entry({ model: 'gemini-3.5-flash-lite', outputTokens: 1e6 });
    expect(costByModel([lite, launch, regular, entry({ cached: true })])).toEqual([
      { model: 'gemini-3.5-flash-lite', calls: 1, costUsd: 2.5 },
      { model: 'gemini-3.8-flash', calls: 2, costUsd: 2.25 },
    ]);
  });

  it('starts the month at local midnight on the first', () => {
    expect(startOfMonth(new Date(NOW))).toBe(new Date(2026, 9, 1).getTime());
  });

  it('formats small costs without rounding them to zero', () => {
    const { cost } = createFormats('en');
    expect(cost(0)).toBe('$0.00');
    expect(cost(0.00042)).toBe('$0.0004');
    expect(cost(2.851)).toBe('$2.85');
  });
});

describe('AiUseSection', () => {
  async function setup() {
    const repos = createMemoryRepos();
    await repos.aiLog.add(entry({ at: new Date(2026, 8, 30).getTime(), inputTokens: 10 ** 7 }));
    for (const row of LOG) await repos.aiLog.add(row);
    await repos.aiCache.put({
      hash: 'h',
      task: 'explainMistake',
      promptVersion: 1,
      model: 'm',
      createdAt: NOW,
      value: {},
    });
    renderWithServices(<AiUseSection now={() => NOW} />, { services: fakeServices({ repos }) });
    return repos;
  }

  it("shows this month's numbers only", async () => {
    await setup();
    expect(await screen.findByText('3 calls · $4.00')).toBeTruthy();
    const byModel = screen.getByLabelText('Cost by model');
    expect(byModel.textContent).toContain('gemini-2.5-flash1 call · $2.50');
    const term = screen.getByText('Answered from the cache');
    expect(term.nextElementSibling?.textContent).toBe('2');
    expect(screen.getByText('Tokens in').nextElementSibling?.textContent).toBe('1,500,000');
    expect(screen.getByText('Calls that failed').nextElementSibling?.textContent).toBe('1');
  });

  it('clears cached answers only once confirmed', async () => {
    const repos = await setup();
    await userEvent.click(screen.getByText('AI use this month'));
    await userEvent.click(screen.getByRole('button', { name: 'Clear cached answers' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await repos.aiCache.get('h')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Clear cached answers' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear them' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(await repos.aiCache.get('h')).toBeUndefined();
  });
});

const t = createTranslator('en', ENGLISH, ENGLISH);
const format = createFormats('en');

describe('priceHint', () => {
  it('names the dated price change of Gemini 3.8 Flash only before it happens', () => {
    expect(priceHint('gemini-3.8-flash', Date.UTC(2026, 9, 18), t, format)).toBe(
      'About $0.75 in and $3.75 out per million tokens through 2026-12-31, then $1.50 and $7.50.',
    );
    expect(priceHint('gemini-3.8-flash', Date.UTC(2027, 1, 1), t, format)).toBe(
      'About $1.50 in and $7.50 out per million tokens.',
    );
  });
});
