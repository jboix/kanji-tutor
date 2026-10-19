import { describe, expect, it } from 'vitest';
import type { AiLogEntry } from '../domain/types.ts';
import { monthStart, summariseMonth } from './cost.ts';

const NOW = new Date(2026, 9, 17, 12).getTime();

function entry(at: Date, extra: Partial<AiLogEntry> = {}): AiLogEntry {
  const base = { task: 'explainWord', model: 'gemini-2.5-flash-lite', cached: false, ok: true };
  return { at: at.getTime(), inputTokens: 1000, outputTokens: 200, ...base, ...extra };
}

describe('monthStart', () => {
  it('is midnight on the first of the local month', () => {
    expect(monthStart(NOW)).toBe(new Date(2026, 9, 1).getTime());
  });
});

describe('summariseMonth', () => {
  it('sums this calendar month only, counting cached answers apart', () => {
    const entries = [
      entry(new Date(2026, 8, 30, 23, 59)),
      entry(new Date(2026, 9, 1, 0, 0)),
      entry(new Date(2026, 9, 16), {
        model: 'gemini-2.5-flash',
        inputTokens: 2000,
        outputTokens: 400,
      }),
      entry(new Date(2026, 9, 17), { cached: true, inputTokens: 0, outputTokens: 0 }),
      entry(new Date(2026, 9, 17), { ok: false, inputTokens: 0, outputTokens: 0 }),
      entry(new Date(2026, 10, 1)),
    ];
    const summary = summariseMonth(entries, NOW);
    expect(summary).toMatchObject({
      calls: 3,
      cachedCalls: 1,
      inputTokens: 3000,
      outputTokens: 600,
    });
    const expected = (1000 * 0.1 + 200 * 0.4 + 2000 * 0.3 + 400 * 2.5) / 1_000_000;
    expect(summary.costUsd).toBeCloseTo(expected, 12);
  });

  it('is all zeros for an empty log', () => {
    expect(summariseMonth([], NOW)).toEqual({
      calls: 0,
      cachedCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    });
  });
});
