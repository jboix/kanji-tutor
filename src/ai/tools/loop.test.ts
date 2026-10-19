import { describe, expect, it } from 'vitest';
import type { ToolCall, ToolResult, ToolRunner } from '../types.ts';
import { MAX_TOOL_ROUNDS, runToolLoop, type ToolSession, type Turn } from './loop.ts';

const call = (id: string): ToolCall => ({ id, name: 'get_learner_profile', args: {} });

function recordingRunner(): ToolRunner & { seen: ToolCall[] } {
  const seen: ToolCall[] = [];
  return {
    seen,
    declarations: [],
    execute: async (c) => {
      seen.push(c);
      return { ...(c.id ? { id: c.id } : {}), name: c.name, response: { output: c.id } };
    },
  };
}

/** A model that always asks for one more tool round while it may. */
function greedySession() {
  const sent: { results: ToolResult[] | undefined; allowTools: boolean }[] = [];
  const session: ToolSession = {
    next: async (results, allowTools): Promise<Turn> => {
      sent.push({ results, allowTools });
      const calls = allowTools ? [call(`c${sent.length}`)] : [];
      return { calls, text: allowTools ? '' : '{"done":true}', inputTokens: 10, outputTokens: 1 };
    },
  };
  return { session, sent };
}

describe('runToolLoop', () => {
  it('runs each call, answers with matching ids and stops at the round limit', async () => {
    const { session, sent } = greedySession();
    const runner = recordingRunner();
    const response = await runToolLoop(session, runner);
    expect(MAX_TOOL_ROUNDS).toBe(2);
    expect(runner.seen.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(sent.map((s) => s.allowTools)).toEqual([true, true, false]);
    expect(sent.slice(1).map((s) => s.results?.[0]?.id)).toEqual(['c1', 'c2']);
    expect(response).toEqual({
      text: '{"done":true}',
      inputTokens: 30,
      outputTokens: 3,
      cachedTokens: 0,
      toolRounds: 2,
    });
  });

  it('returns the first turn when the model answers straight away', async () => {
    const session: ToolSession = {
      next: async () => ({ calls: [], text: '{}', inputTokens: 3, outputTokens: 2 }),
    };
    expect(await runToolLoop(session, recordingRunner())).toEqual({
      text: '{}',
      inputTokens: 3,
      outputTokens: 2,
      cachedTokens: 0,
      toolRounds: 0,
    });
  });

  it('answers every call of a round in order', async () => {
    let turn = 0;
    const session: ToolSession = {
      next: async (results) => {
        turn += 1;
        if (turn === 1)
          return { calls: [call('a'), call('b')], text: '', inputTokens: 0, outputTokens: 0 };
        return { calls: [], text: JSON.stringify(results), inputTokens: 0, outputTokens: 0 };
      },
    };
    const response = await runToolLoop(session, recordingRunner());
    expect(JSON.parse(response.text).map((r: ToolResult) => r.id)).toEqual(['a', 'b']);
  });

  it('with no rounds allowed, asks for text at once', async () => {
    const { session, sent } = greedySession();
    expect((await runToolLoop(session, recordingRunner(), 0)).toolRounds).toBe(0);
    expect(sent.map((s) => s.allowTools)).toEqual([false]);
  });
});
