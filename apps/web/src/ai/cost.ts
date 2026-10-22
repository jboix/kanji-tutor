import type { AiLogEntry } from '../domain/types.ts';
import { estimateCostUsd } from './pricing.ts';

/** This month's AI use, for the settings cost page (A9). */
export interface MonthSummary {
  /** Calls that reached the provider (successful or not). */
  calls: number;
  /** Answers served from the local cache (no tokens, no cost). */
  cachedCalls: number;
  inputTokens: number;
  outputTokens: number;
  /** Estimated from list prices in `PRICES`. */
  costUsd: number;
}

/** Start of the local calendar month containing `now`, in ms; pass to `aiLog.since`. */
export function monthStart(now: number): number {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}

function nextMonthStart(now: number): number {
  const date = new Date(now);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
}

/** Sums the log entries of the calendar month containing `now`; other entries are ignored. */
export function summariseMonth(entries: readonly AiLogEntry[], now: number): MonthSummary {
  const from = monthStart(now);
  const to = nextMonthStart(now);
  const summary: MonthSummary = {
    calls: 0,
    cachedCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };
  for (const entry of entries) {
    if (entry.at < from || entry.at >= to) continue;
    if (entry.cached) summary.cachedCalls += 1;
    else summary.calls += 1;
    summary.inputTokens += entry.inputTokens;
    summary.outputTokens += entry.outputTokens;
    summary.costUsd += estimateCostUsd(
      entry.model,
      entry.inputTokens,
      entry.outputTokens,
      entry.at,
      entry.cachedTokens,
    );
  }
  return summary;
}
