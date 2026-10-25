import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../test/memory-repos.ts';
import * as ai from './index.ts';
import { scriptedProvider, testContext } from './testing/context.ts';
import type { AiContext } from './types.ts';

describe('createAiClient', () => {
  it('binds every task and resolves the context on each call', async () => {
    const repos = createMemoryRepos();
    let contexts = 0;
    const getContext = async (): Promise<AiContext> => {
      contexts += 1;
      return testContext({
        provider: ai.createMockProvider(),
        cache: repos.aiCache,
        log: repos.aiLog,
      });
    };
    const client = ai.createAiClient(getContext);
    expect(Object.keys(client)).toHaveLength(17);
    const input = { description: 'temple on the right' };
    expect(await client.describeKanji(input)).toMatchObject({ ok: true, cached: false });
    expect(await client.describeKanji(input)).toMatchObject({ ok: true, cached: true });
    expect(contexts).toBe(2);
    const log = await repos.aiLog.since(0);
    expect(log.map((entry) => entry.cached)).toEqual([false, true]);
    expect(ai.summariseMonth(log, Date.UTC(2026, 9, 17, 9))).toMatchObject({
      calls: 1,
      cachedCalls: 1,
    });
  });
});

describe('public task exports', () => {
  it('run the real tasks lazily under their contract names', async () => {
    const provider = scriptedProvider(['{"candidates":["待","待つ"]}']);
    const result = await ai.recognizeHandwriting(
      { image: { mime: 'image/png', data: 'iVBO' } },
      testContext({ provider }),
    );
    expect(result).toEqual({ ok: true, cached: false, value: { candidates: ['待'] } });
    const exported = [ai.explainMistake, ai.weeklyNotes, ai.transcribeReading];
    expect(exported.map((task) => typeof task)).toEqual(['function', 'function', 'function']);
  });
});
