/**
 * Test helpers for the AI module: an in-memory context, a fake `verifyReading` over the sample
 * dictionary, and a scripted provider. No network, ever.
 */
import type { LearnerOverview, LearnerView } from '../../domain/learner-view.ts';
import type { AiCacheEntry, AiLogEntry } from '../../domain/types.ts';
import { SAMPLE_WORDS } from '../../lang/testing/fake-dictionary.ts';
import type { ReadingCheck } from '../../lang/types.ts';
import type { Verifier } from '../task-def.ts';
import type { AiContext, AiProvider, AiRequest, AiResponse } from '../types.ts';

/**
 * `verifyReading` against a surface → readings table: `verified` for a listed reading, `mismatch`
 * for a listed surface with another reading, `unknown` otherwise. Seeded from `SAMPLE_WORDS`.
 */
export function fakeVerifier(extra: Record<string, string[]> = {}): Verifier & { calls: string[] } {
  const table = new Map<string, string[]>();
  for (const word of SAMPLE_WORDS) {
    for (const form of word.forms) table.set(form, [...(table.get(form) ?? []), ...word.readings]);
  }
  for (const [surface, readings] of Object.entries(extra)) table.set(surface, readings);
  const usual = new Map(
    SAMPLE_WORDS.flatMap((word) =>
      (word.variants ?? []).flatMap((variant) =>
        word.forms.map((form) => [`${form}=${variant}`, word.readings[0] ?? ''] as const),
      ),
    ),
  );
  const calls: string[] = [];
  const verifyReading = async (surface: string, reading: string): Promise<ReadingCheck> => {
    calls.push(`${surface}=${reading}`);
    const expected = table.get(surface);
    if (!expected) return { status: 'unknown' };
    if (!expected.includes(reading)) return { status: 'mismatch', expected };
    const preferred = usual.get(`${surface}=${reading}`);
    return preferred ? { status: 'verified', preferred } : { status: 'verified' };
  };
  return { verifyReading, calls };
}

/** An `AiContext` with in-memory cache and log, online, at a fixed time. */
export interface TestContext extends AiContext {
  logEntries: AiLogEntry[];
  cacheEntries: Map<string, AiCacheEntry>;
}

/** Builds a test context; override any field. */
export function testContext(overrides: Partial<AiContext> = {}): TestContext {
  const logEntries: AiLogEntry[] = [];
  const cacheEntries = new Map<string, AiCacheEntry>();
  return {
    provider: undefined,
    model: 'gemini-3.5-flash-lite',
    cache: {
      get: async (hash) => cacheEntries.get(hash),
      put: async (entry) => {
        cacheEntries.set(entry.hash, entry);
      },
      clear: async () => cacheEntries.clear(),
    },
    log: {
      add: async (entry) => {
        logEntries.push(entry);
      },
      since: async (at) => logEntries.filter((entry) => entry.at >= at),
    },
    lang: fakeVerifier(),
    profile: { knownWords: ['一緒', '駅', '友達'], recentErrors: ['long-vowel'] },
    isOnline: () => true,
    now: () => Date.UTC(2026, 9, 17, 9, 0),
    ...overrides,
    logEntries,
    cacheEntries,
  };
}

/** One scripted reply: JSON text, a full response, or an error to throw. */
export type ScriptedReply = string | AiResponse | Error;

/** A provider that replays `replies` in order (the last one repeats) and records requests. */
export function scriptedProvider(
  replies: ScriptedReply[],
): AiProvider & { requests: AiRequest[]; signals: (AbortSignal | undefined)[] } {
  const requests: AiRequest[] = [];
  const signals: (AbortSignal | undefined)[] = [];
  const generate = async (request: AiRequest, signal?: AbortSignal): Promise<AiResponse> => {
    const reply = replies[Math.min(requests.length, replies.length - 1)];
    requests.push(request);
    signals.push(signal);
    if (reply instanceof Error) throw reply;
    if (typeof reply === 'string') return { text: reply, inputTokens: 100, outputTokens: 20 };
    if (!reply) throw new Error('No scripted reply.');
    return reply;
  };
  return { id: 'mock', generate, requests, signals };
}

/** A learner overview at N4 with a little coverage, for teacher-tier tests. */
export function learnerOverview(overrides: Partial<LearnerOverview> = {}): LearnerOverview {
  return {
    level: 4,
    levelSource: 'set',
    explanationLanguage: 'en',
    coverage: {
      words: [
        { level: 5, known: 90, total: 100 },
        { level: 4, known: 25, total: 100 },
      ],
      kanji: [{ level: 4, known: 10, total: 100 }],
      grammar: [],
    },
    recentMistakes: [],
    ...overrides,
  };
}

/** A `LearnerView` that records every call by name; override any method. */
export function fakeLearner(
  overrides: Partial<LearnerView> = {},
): LearnerView & { calls: string[] } {
  const calls: string[] = [];
  const spy =
    <A extends unknown[], R>(name: string, run: (...args: A) => Promise<R>) =>
    (...args: A) => {
      calls.push(name);
      return run(...args);
    };
  const base: LearnerView = {
    getLearnerProfile: async () => learnerOverview(),
    checkKnown: async (query) =>
      (query.words ?? []).map((text) => ({ kind: 'word', text, found: true, state: 'known' })),
    lookupWord: async () => [
      { forms: ['待つ'], readings: ['まつ'], meanings: ['to wait'], common: true, state: 'known' },
    ],
    knownExamples: async () => [],
  };
  const view = { ...base, ...overrides };
  return {
    calls,
    getLearnerProfile: spy('getLearnerProfile', view.getLearnerProfile),
    checkKnown: spy('checkKnown', view.checkKnown),
    lookupWord: spy('lookupWord', view.lookupWord),
    knownExamples: spy('knownExamples', view.knownExamples),
  };
}
