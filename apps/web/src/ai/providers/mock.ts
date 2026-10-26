import type { Fixture } from '../fixtures/index.ts';
import { limited, type RateLimiter } from '../limiter.ts';
import { runToolLoop, type ToolSession } from '../tools/loop.ts';
import type { AiProvider, AiRequest, AiResponse, ToolCall, ToolResult } from '../types.ts';

/**
 * Picks the fixture whose `match` occurs earliest in the prompt (prompts put the target first),
 * else the task's default (the first fixture without `match`, or the first one).
 */
export function selectFixture(fixtures: readonly Fixture[], prompt: string): Fixture | undefined {
  let best: { fixture: Fixture; at: number } | undefined;
  for (const fixture of fixtures) {
    const at = fixture.match ? prompt.indexOf(fixture.match) : -1;
    if (at >= 0 && (!best || at < best.at)) best = { fixture, at };
  }
  return best?.fixture ?? fixtures.find((fixture) => !fixture.match) ?? fixtures[0];
}

function abortError(): Error {
  const error = new Error('The request was cancelled.');
  error.name = 'AbortError';
  return error;
}

/** Like the Gemini API, rejects results that do not answer each call by id and name. */
function checkResults(calls: readonly ToolCall[], results: readonly ToolResult[]): void {
  const answered = calls.every(
    (call, at) => results[at]?.id === call.id && results[at]?.name === call.name,
  );
  if (!answered || calls.length !== results.length) {
    throw new Error('Function responses do not match the function calls.');
  }
}

/**
 * Replays a fixture's recorded tool rounds, then its final JSON. The loop runs the real local
 * handlers on each round, so tests see real tool output against fake repos.
 */
export function fixtureSession(fixture: Fixture): ToolSession {
  const rounds = fixture.toolCalls ?? [];
  let round = 0;
  return {
    next: async (results, allowTools) => {
      if (results) checkResults(rounds[round - 1] ?? [], results);
      const calls = allowTools ? (rounds[round] ?? []) : [];
      round += 1;
      if (calls.length > 0) return { calls, text: '', inputTokens: 0, outputTokens: 0 };
      const { inputTokens, outputTokens } = fixture;
      return { calls: [], text: JSON.stringify(fixture.response), inputTokens, outputTokens };
    },
  };
}

async function replay(request: AiRequest, signal?: AbortSignal): Promise<AiResponse> {
  if (signal?.aborted) throw abortError();
  const { FIXTURES } = await import('../fixtures/index.ts');
  const fixture = selectFixture(FIXTURES[request.task].fixtures, request.prompt);
  if (!fixture) throw new Error(`No fixture for ${request.task}`);
  const chat = fixtureSession(fixture);
  if (request.tools) return runToolLoop(chat, request.tools, request.maxToolRounds);
  const { calls: _calls, ...response } = await chat.next(undefined, false);
  return response;
}

/**
 * What an e2e build exposes of the mock (`window.__kanjiMockAi`): how many requests reached it,
 * and an error the next request throws, e.g. a 429 with a `RetryInfo` body.
 */
export interface MockProbe {
  calls: number;
  failNext?: { status: number; message: string } | undefined;
  /** As if no key were set: the app treats the tutor as not set up (e2e of that state). */
  noKey?: boolean | undefined;
}

export interface MockOptions {
  /** Requests wait their turn like real ones (A14); none by default, so unit tests never wait. */
  limiter?: RateLimiter;
  probe?: MockProbe;
}

function probed(probe: MockProbe | undefined, request: AiRequest, signal?: AbortSignal) {
  if (!probe) return replay(request, signal);
  probe.calls += 1;
  const fail = probe.failNext;
  if (!fail) return replay(request, signal);
  probe.failNext = undefined;
  return Promise.reject(Object.assign(new Error(fail.message), { status: fail.status }));
}

/**
 * Replays recorded fixtures from `src/ai/fixtures/`, including recorded tool calls; never
 * touches the network and is deterministic. Powers unit tests and e2e (`VITE_AI_PROVIDER=mock`).
 */
export function createMockProvider(options: MockOptions = {}): AiProvider {
  const { limiter, probe } = options;
  return {
    id: 'mock',
    generate: (request, signal) => limited(limiter, signal, () => probed(probe, request, signal)),
  };
}
