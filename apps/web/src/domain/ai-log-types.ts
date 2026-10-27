/** The AI call log and response cache records, persisted in IndexedDB (A9). */

/** One logged AI call, for the cost page (A9). */
export interface AiLogEntry {
  id?: number;
  at: number;
  task: string;
  model: string;
  cached: boolean;
  inputTokens: number;
  outputTokens: number;
  /** Prompt tokens Gemini served from its implicit cache, part of `inputTokens` (A15). */
  cachedTokens?: number;
  ok: boolean;
  /** How long the provider took, in ms; absent for cached answers and older entries. */
  ms?: number;
  /** Why it failed, as "kind: message"; absent when it worked. */
  error?: string;
}

/** Cached, validated AI response keyed by input hash (A9). */
export interface AiCacheEntry {
  hash: string;
  task: string;
  promptVersion: number;
  model: string;
  createdAt: number;
  value: unknown;
}
