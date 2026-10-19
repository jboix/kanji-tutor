import { describe, expect, it } from 'vitest';
import type { Fixture } from '../fixtures/index.ts';
import { fakeLearner } from '../testing/context.ts';
import { createToolRunner } from '../tools/runner.ts';
import type { AiRequest } from '../types.ts';
import { createMockProvider, fixtureSession, selectFixture } from './mock.ts';

const fixture = (match?: string): Fixture => ({
  ...(match ? { match } : {}),
  inputTokens: 1,
  outputTokens: 1,
  response: { match },
});

function request(task: AiRequest['task'], prompt: string): AiRequest {
  return { task, promptVersion: 1, model: 'm', system: '', prompt, schema: {} };
}

describe('selectFixture', () => {
  const fixtures = [fixture('待って'), fixture('間に'), fixture()];

  it('picks the match that occurs earliest in the prompt', () => {
    expect(selectFixture(fixtures, 'Target: 間に\nSentence: 友達を待っている間に')?.match).toBe(
      '間に',
    );
    expect(selectFixture(fixtures, 'Target: 待って\nSentence: 待っている間に')?.match).toBe(
      '待って',
    );
  });

  it('falls back to the default, then to the first fixture', () => {
    expect(selectFixture(fixtures, 'nothing')?.match).toBeUndefined();
    expect(selectFixture([fixture('a')], 'nothing')?.match).toBe('a');
    expect(selectFixture([], 'nothing')).toBeUndefined();
  });
});

describe('createMockProvider', () => {
  it('replays a recorded reply deterministically with its token counts', async () => {
    const provider = createMockProvider();
    const first = await provider.generate(request('explainWord', 'Target: 間に'));
    const second = await provider.generate(request('explainWord', 'Target: 間に'));
    expect(first).toEqual(second);
    expect(JSON.parse(first.text).surface).toBe('間に');
    expect(first.inputTokens).toBeGreaterThan(0);
  });

  it('throws an AbortError when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      createMockProvider().generate(request('explainWord', ''), controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('recorded tool calls', () => {
  const recorded: Fixture = {
    inputTokens: 5,
    outputTokens: 2,
    toolCalls: [[{ id: 'call_1', name: 'lookup_word', args: { text: '待つ' } }]],
    response: { ok: true },
  };

  it('makes the recorded calls when the request carries tools, and runs the handlers', async () => {
    const learner = fakeLearner();
    const tools = createToolRunner(learner);
    const response = await createMockProvider().generate({
      ...request('explainMistake', 'Target: 待って'),
      tools,
    });
    expect(learner.calls).toEqual(['getLearnerProfile', 'checkKnown', 'lookupWord']);
    expect(response.toolRounds).toBe(2);
    expect(JSON.parse(response.text).confusedWith.kanji).toBe('持');
  });

  it('ignores recorded calls without tools', async () => {
    const response = await createMockProvider().generate(
      request('explainMistake', 'Target: 待って'),
    );
    expect(response.toolRounds).toBeUndefined();
  });

  it('rejects results whose ids or names do not match the calls', async () => {
    const session = fixtureSession(recorded);
    expect((await session.next(undefined, true)).calls).toHaveLength(1);
    const wrong = [{ id: 'call_2', name: 'lookup_word', response: { output: 1 } }];
    await expect(session.next(wrong, true)).rejects.toThrow('do not match');
    const missing = fixtureSession(recorded);
    await missing.next(undefined, true);
    await expect(missing.next([], true)).rejects.toThrow('do not match');
  });

  it('answers with the final JSON once tools are no longer allowed', async () => {
    const turn = await fixtureSession(recorded).next(undefined, false);
    expect(turn).toEqual({ calls: [], text: '{"ok":true}', inputTokens: 5, outputTokens: 2 });
  });
});
