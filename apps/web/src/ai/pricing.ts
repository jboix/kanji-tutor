/** USD per million tokens, for the cost estimate on the settings page (A9, A12, D34). */
export interface ModelPrice {
  input: number;
  output: number;
  /** Prompt tokens served from Gemini's implicit cache (A15). */
  cachedInput: number;
}

/** A list price valid until `until` (exclusive, UTC ISO date), or open-ended. */
export interface PricePeriod extends ModelPrice {
  until?: string;
}

/** Gemini 3.8 Flash launch price until 2026-12-31, then the regular price (D34). */
const FLASH_3_8: readonly PricePeriod[] = [
  { input: 0.75, output: 3.75, cachedInput: 0.075, until: '2027-01-01' },
  { input: 1.5, output: 7.5, cachedInput: 0.15 },
];

/**
 * Published list prices, oldest period first. Retired models stay so past cost logs still price.
 * Update by hand from ai.google.dev/gemini-api/docs/pricing.
 */
export const PRICES: Readonly<Record<string, readonly PricePeriod[]>> = {
  'gemini-3.5-flash-lite': [{ input: 0.3, output: 2.5, cachedInput: 0.03 }],
  'gemini-3.1-flash-lite': [{ input: 0.25, output: 1.5, cachedInput: 0.025 }],
  'gemini-3.6-flash': FLASH_3_8,
  'gemini-3.8-flash': FLASH_3_8,
  'gemini-2.5-flash-lite': [{ input: 0.1, output: 0.4, cachedInput: 0.01 }],
  'gemini-2.5-flash': [{ input: 0.3, output: 2.5, cachedInput: 0.03 }],
};

/** Models offered as chips in Settings; any other id can be typed (D34). */
export const MODEL_CHOICES: readonly string[] = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

/** Unknown models are estimated at the fast default's price. */
const FALLBACK: ModelPrice = { input: 0.3, output: 2.5, cachedInput: 0.03 };

/** The list price of `model` at time `at` (epoch ms), or undefined for an unknown model. */
export function priceFor(model: string, at: number): ModelPrice | undefined {
  const periods = PRICES[model];
  if (!periods) return undefined;
  const period = periods.find((p) => !p.until || at < Date.parse(p.until)) ?? periods.at(-1);
  return period && { input: period.input, output: period.output, cachedInput: period.cachedInput };
}

/**
 * Estimated cost in USD of one call made at `at` (epoch ms). `cachedTokens` are the part of
 * `inputTokens` Gemini served from its implicit cache, priced at the cached rate (A15).
 */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  at: number,
  cachedTokens = 0,
): number {
  const price = priceFor(model, at) ?? FALLBACK;
  const cached = Math.min(cachedTokens, inputTokens);
  const fresh = (inputTokens - cached) * price.input + cached * price.cachedInput;
  return (fresh + outputTokens * price.output) / 1_000_000;
}
