import { estimateCostUsd } from '../../ai/index.ts';
import type { AiLogEntry } from '../../domain/types.ts';

/** Calls and estimated cost of one model (A12). */
export interface ModelUse {
  model: string;
  calls: number;
  costUsd: number;
}

/** Totals for the cost page (A9). Cached answers cost nothing and use no tokens. */
export interface AiUseSummary {
  calls: number;
  failed: number;
  cached: number;
  inputTokens: number;
  outputTokens: number;
  /** Input tokens Gemini served from its implicit cache, priced lower (A15). */
  cachedTokens: number;
  costUsd: number;
}

const EMPTY: AiUseSummary = {
  calls: 0,
  failed: 0,
  cached: 0,
  inputTokens: 0,
  outputTokens: 0,
  cachedTokens: 0,
  costUsd: 0,
};

/** One logged call's estimated cost; local cache hits cost nothing. */
export function entryCost(entry: AiLogEntry): number {
  if (entry.cached) return 0;
  const { model, inputTokens, outputTokens, at, cachedTokens } = entry;
  return estimateCostUsd(model, inputTokens, outputTokens, at, cachedTokens);
}

function add(sum: AiUseSummary, entry: AiLogEntry): AiUseSummary {
  if (entry.cached) return { ...sum, cached: sum.cached + 1 };
  return {
    calls: sum.calls + 1,
    failed: sum.failed + (entry.ok ? 0 : 1),
    cached: sum.cached,
    inputTokens: sum.inputTokens + entry.inputTokens,
    outputTokens: sum.outputTokens + entry.outputTokens,
    cachedTokens: sum.cachedTokens + (entry.cachedTokens ?? 0),
    costUsd: sum.costUsd + entryCost(entry),
  };
}

/** Sums logged AI use, pricing each call with its own model at the price of its day. */
export function summariseAiUse(entries: readonly AiLogEntry[]): AiUseSummary {
  return entries.reduce(add, EMPTY);
}

/** Calls and cost per model, costliest first; cached answers are left out (A12). */
export function costByModel(entries: readonly AiLogEntry[]): ModelUse[] {
  const byModel = new Map<string, AiLogEntry[]>();
  for (const entry of entries) {
    if (!entry.cached) byModel.set(entry.model, [...(byModel.get(entry.model) ?? []), entry]);
  }
  return [...byModel]
    .map(([model, rows]) => ({ model, ...summariseAiUse(rows) }))
    .map(({ model, calls, costUsd }) => ({ model, calls, costUsd }))
    .sort((a, b) => b.costUsd - a.costUsd || a.model.localeCompare(b.model));
}

/** Local midnight on the first of `now`'s month, in epoch ms. */
export function startOfMonth(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}
