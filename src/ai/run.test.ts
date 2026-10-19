import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { cacheKey, parseReply, runTask } from './run.ts';
import { explainWordSchema, finalizeWord } from './schemas/explain-word.ts';
import type { TaskDef } from './task-def.ts';
import { explainWord, extractFromImage } from './tasks.ts';
import { scriptedProvider, testContext } from './testing/context.ts';
import type { ExplainWordInput } from './types.ts';

const INPUT: ExplainWordInput = {
  sentence: { text: '駅で友達を待っている間に、本を読みました。' },
  surface: '間に',
};

const REPLY = JSON.stringify({
  surface: '間に',
  reading: { surface: '間', reading: 'あいだ' },
  meaning: 'while',
  nuance: 'At some point during.',
  chips: [{ kind: 'simpler', label: 'Simpler, please' }],
  readings: [{ surface: '本', reading: 'ほん' }],
});

describe('runTask', () => {
  it('returns no-key without a provider and makes no call or log entry', async () => {
    const context = testContext();
    const result = await explainWord(INPUT, context);
    expect(result).toMatchObject({ ok: false, error: { kind: 'no-key' } });
    expect(context.logEntries).toEqual([]);
  });

  it('calls the provider on a miss, then serves the cache with a 0-token log entry', async () => {
    const provider = scriptedProvider([{ text: REPLY, inputTokens: 700, outputTokens: 210 }]);
    const context = testContext({ provider });
    const first = await explainWord(INPUT, context);
    const second = await explainWord(INPUT, context);
    expect(first).toMatchObject({ ok: true, cached: false });
    expect(second).toMatchObject({ ok: true, cached: true });
    expect(second.ok && second.value).toEqual(first.ok && first.value);
    expect(provider.requests).toHaveLength(1);
    expect(context.logEntries).toEqual([
      expect.objectContaining({ task: 'explainWord', cached: false, ok: true, inputTokens: 700 }),
      expect.objectContaining({ cached: true, ok: true, inputTokens: 0, outputTokens: 0 }),
    ]);
    const [entry] = [...context.cacheEntries.values()];
    expect(entry).toMatchObject({ task: 'explainWord', promptVersion: 4, model: context.model });
    expect(entry?.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('answers from the cache offline, and returns offline on a miss', async () => {
    const provider = scriptedProvider([REPLY]);
    const online = testContext({ provider });
    await explainWord(INPUT, online);
    const offline = { ...online, isOnline: () => false };
    expect(await explainWord(INPUT, offline)).toMatchObject({ ok: true, cached: true });
    const miss = await explainWord({ ...INPUT, surface: '本' }, offline);
    expect(miss).toMatchObject({ ok: false, error: { kind: 'offline' } });
    expect(provider.requests).toHaveLength(1);
  });

  it('retries once on invalid JSON, then reports invalid-response', async () => {
    const provider = scriptedProvider(['not json']);
    const context = testContext({ provider });
    const result = await explainWord(INPUT, context);
    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-response' } });
    expect(provider.requests).toHaveLength(2);
    expect(context.logEntries.map((entry) => entry.ok)).toEqual([false, false]);
    expect(context.cacheEntries.size).toBe(0);
  });

  it('accepts a valid reply on the retry', async () => {
    const provider = scriptedProvider(['{"surface": 1}', REPLY]);
    const result = await explainWord(INPUT, testContext({ provider }));
    expect(result).toMatchObject({ ok: true, cached: false });
    expect(provider.requests).toHaveLength(2);
  });

  it.each([
    [Object.assign(new Error('Too many requests'), { status: 429 }), 'rate-limit'],
    [new Error('got status: 429 RESOURCE_EXHAUSTED'), 'rate-limit'],
    [Object.assign(new Error('API key not valid'), { status: 400 }), 'provider'],
    [new Error('socket hang up'), 'provider'],
  ])('maps a thrown %s to %s without retrying', async (error, kind) => {
    const provider = scriptedProvider([error]);
    const context = testContext({ provider });
    const result = await explainWord(INPUT, context);
    expect(result).toMatchObject({ ok: false, error: { kind } });
    expect(provider.requests).toHaveLength(1);
    expect(context.logEntries).toEqual([
      expect.objectContaining({ ok: false, cached: false, inputTokens: 0, outputTokens: 0 }),
    ]);
  });

  it('passes the abort signal and sends media with the request', async () => {
    const provider = scriptedProvider(['{"lines": ["日本語"]}']);
    const signal = new AbortController().signal;
    const image = { mime: 'image/jpeg', data: 'AAAA' };
    await extractFromImage({ image }, testContext({ provider, signal }));
    expect(provider.signals[0]).toBe(signal);
    expect(provider.requests[0]?.media).toEqual([image]);
  });

  it('never fails the task when cache or log writes fail', async () => {
    const broken = async () => {
      throw new Error('quota');
    };
    const context = testContext({ provider: scriptedProvider([REPLY]) });
    context.cache = { get: broken, put: broken, clear: broken };
    context.log = { add: broken, since: broken };
    expect(await explainWord(INPUT, context)).toMatchObject({ ok: true, cached: false });
  });

  it('treats a cache entry that no longer validates as a miss', async () => {
    const provider = scriptedProvider([REPLY]);
    const context = testContext({ provider });
    const hash = await cacheKey('explainWord', 2, context.model, INPUT);
    context.cacheEntries.set(hash, {
      hash,
      task: 'explainWord',
      promptVersion: 1,
      model: context.model,
      createdAt: 0,
      value: { stale: true },
    });
    expect(await explainWord(INPUT, context)).toMatchObject({ ok: true, cached: false });
  });

  it('re-verifies readings on a cache hit', async () => {
    const provider = scriptedProvider([REPLY]);
    const context = testContext({ provider });
    await explainWord(INPUT, context);
    const doubting = { verifyReading: async () => ({ status: 'unknown' as const }) };
    const hit = await explainWord(INPUT, { ...context, lang: doubting });
    expect(hit.ok && hit.value.reading.verified).toBe(false);
  });

  it('runs a custom definition with the generic core', async () => {
    const def: TaskDef<'explainWord', typeof explainWordSchema> = {
      name: 'explainWord',
      tier: 'fast',
      prompt: { version: 9, system: 'S', build: (input) => `Target: ${input.surface}` },
      schema: explainWordSchema,
      finalize: finalizeWord,
    };
    const provider = scriptedProvider([REPLY]);
    await runTask(def, INPUT, testContext({ provider }));
    expect(provider.requests[0]).toMatchObject({ promptVersion: 9, thinking: 'low' });
    expect(provider.requests[0]?.system).toMatch(/^S\nWrite every piece of prose/);
    expect(provider.requests[0]?.prompt).toBe(
      'Explanation language: English (en). Write all non-Japanese prose in English.\nTarget: 間に',
    );
    expect(provider.requests[0]?.tools).toBeUndefined();
    expect(provider.requests[0]?.media).toBeUndefined();
  });
});

describe('cacheKey', () => {
  it('depends on task, prompt version, model and input (media included), not key order', async () => {
    const base = await cacheKey('extractFromImage', 1, 'm', { image: { mime: 'a', data: 'x' } });
    expect(await cacheKey('extractFromImage', 1, 'm', { image: { data: 'x', mime: 'a' } })).toBe(
      base,
    );
    const variants = await Promise.all([
      cacheKey('extractFromImage', 1, 'm', { image: { mime: 'a', data: 'y' } }),
      cacheKey('extractFromImage', 2, 'm', { image: { mime: 'a', data: 'x' } }),
      cacheKey('extractFromImage', 1, 'n', { image: { mime: 'a', data: 'x' } }),
      cacheKey('recognizeHandwriting', 1, 'm', { image: { mime: 'a', data: 'x' } }),
    ]);
    expect(new Set([base, ...variants]).size).toBe(5);
  });
});

describe('parseReply', () => {
  const schema = z.object({ a: z.string(), b: z.string().exactOptional() });

  it('accepts fenced JSON and drops null optional fields', () => {
    expect(parseReply(schema, '```json\n{"a": "x", "b": null}\n```')).toEqual({
      ok: true,
      value: { a: 'x' },
    });
  });

  it('names the failing path', () => {
    const result = parseReply(schema, '{"a": 1}');
    expect(result.ok || result.error.message).toContain('at a');
  });

  it('rejects text that is not JSON', () => {
    expect(parseReply(schema, 'Sure! Here you go')).toMatchObject({
      ok: false,
      error: { kind: 'invalid-response' },
    });
  });
});
