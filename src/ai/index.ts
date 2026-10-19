/** Public API of the AI module (SPEC "AI layer"). */
export { createAiClient } from './client.ts';
export { type MonthSummary, monthStart, summariseMonth } from './cost.ts';
export * from './lazy-tasks.ts';
export { REQUESTS_PER_MINUTE, sharedLimiter } from './limiter.ts';
export type { HiddenReading } from './no-spoil.ts';
export { isHiddenReading, type NoSpoil, redactOutput } from './no-spoil-output.ts';
export { estimateCostUsd, MODEL_CHOICES, type ModelPrice, PRICES, priceFor } from './pricing.ts';
export { createGeminiProvider, type GeminiOptions } from './providers/gemini.ts';
export { createMockProvider, type MockProbe } from './providers/mock.ts';
export { testKey } from './test-key.ts';
export type * from './types.ts';
