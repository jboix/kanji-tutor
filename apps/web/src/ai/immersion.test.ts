import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ImmersionMode } from '../domain/types.ts';
import { summaryOf, withSummary } from './immersion.ts';
import { createMockProvider } from './providers/mock.ts';
import { assessLevel, breakdownSentence, explainMistake } from './tasks.ts';
import { fakeLearner, scriptedProvider, testContext } from './testing/context.ts';
import type { AiContext, ExplainMistakeInput } from './types.ts';

const MISTAKE: ExplainMistakeInput = {
  sentence: { text: '駅で友達を待っている。' },
  target: { surface: '待って', expected: 'まって' },
  answer: 'もって',
  errorType: 'wrong-kanji',
};

const japaneseReply = JSON.stringify({
  explanation: '「待つ」は駅で友達を待つときに使います。',
  chips: [],
  readings: [],
  summaryNative: 'You use 待つ when you wait for someone.',
});

function context(mode: ImmersionMode, overrides: Partial<AiContext> = {}) {
  return testContext({
    learner: fakeLearner(),
    immersion: () => mode,
    lang: { verifyReading: async () => ({ status: 'verified' }), tokenize: async () => [] },
    ...overrides,
  });
}

describe('immersion requests (M1, M2)', () => {
  it('asks for Japanese at the learner level, with the tools and summaryNative', async () => {
    const provider = scriptedProvider([japaneseReply]);
    const result = await explainMistake(MISTAKE, context('japanese', { provider }));
    const request = provider.requests[0];
    expect(request?.prompt.split('\n')[0]).toBe('Immersion: japanese, at N4.');
    expect(request?.system).toContain('write the explanation fields in simple Japanese');
    expect(request?.system).toContain('check_known');
    expect(JSON.stringify(request?.schema)).toContain('summaryNative');
    expect(result.ok && result.value.immersion).toMatchObject({
      mode: 'japanese',
      summaryNative: 'You use 待つ when you wait for someone.',
      checked: true,
    });
  });

  it('does not treat Japanese prose as off-language, and checks the summary instead', async () => {
    const provider = scriptedProvider([japaneseReply]);
    const result = await explainMistake(MISTAKE, context('japanese', { provider }));
    expect(provider.requests).toHaveLength(1);
    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.offLanguage).toBeFalsy();
  });

  it('asks mixed mode for Japanese sentences followed by a line in the learner language', async () => {
    const provider = scriptedProvider([japaneseReply]);
    await explainMistake(MISTAKE, context('mixed', { provider, explanationLanguage: 'fr' }));
    expect(provider.requests[0]?.system).toContain('then one short French line');
    expect(provider.requests[0]?.prompt).toMatch(/^Immersion: mixed, at N4\./);
  });

  it('keys the cache by mode, so a native answer is not reused in Japanese', async () => {
    const english = JSON.stringify({ explanation: 'You read 持.', chips: [], readings: [] });
    const provider = scriptedProvider([english, japaneseReply]);
    const shared = context('native', { provider });
    await explainMistake(MISTAKE, shared);
    await explainMistake(MISTAKE, { ...shared, immersion: () => 'japanese' });
    await explainMistake(MISTAKE, { ...shared, immersion: () => 'japanese' });
    expect(provider.requests).toHaveLength(2);
    expect(provider.requests[0]?.system).not.toContain('Immersion');
  });

  it('leaves native requests, fast tasks and the assessment alone', async () => {
    const provider = scriptedProvider([japaneseReply]);
    const native = await explainMistake(MISTAKE, context('native', { provider }));
    expect(native.ok && native.value.immersion).toBeUndefined();
    const fast = scriptedProvider([JSON.stringify({ translation: 'x', chunks: [], readings: [] })]);
    await breakdownSentence(
      { sentence: MISTAKE.sentence },
      context('japanese', { provider: fast }),
    );
    expect(fast.requests[0]?.prompt).not.toContain('Immersion');
    const tutor = createMockProvider();
    const input = { answers: [], staircaseLevel: 4 as const };
    const assessed = await assessLevel(input, context('japanese', { provider: tutor }));
    expect(assessed.ok && 'immersion' in assessed.value).toBe(false);
  });

  it('replays the Japanese mistake fixture with the mock in Japanese mode', async () => {
    const result = await explainMistake(
      MISTAKE,
      context('japanese', { provider: createMockProvider() }),
    );
    expect(result.ok && result.value.explanation).toContain('漢字の差');
    expect(result.ok && result.value.immersion?.summaryNative).toContain('left side');
  });
});

describe('summaryNative', () => {
  it('is added to object schemas once, and read only when it is text', () => {
    const schema = z.object({ text: z.string() });
    expect(withSummary(schema)).toBe(withSummary(schema));
    expect(withSummary(schema).safeParse({ text: 'a', summaryNative: 'b' }).data).toEqual({
      text: 'a',
      summaryNative: 'b',
    });
    expect(withSummary(z.string())).toBeInstanceOf(z.ZodString);
    expect(summaryOf({ summaryNative: '  ' })).toBeUndefined();
    expect(summaryOf({ summaryNative: 3 })).toBeUndefined();
    expect(summaryOf(null)).toBeUndefined();
  });
});

describe('assessLevel (A11)', () => {
  it('returns a level, strengths, gaps and notes from the mock, with tools', async () => {
    const input = {
      answers: [{ kind: 'kanji-reading' as const, level: 5 as const, right: true, item: '学生' }],
      staircaseLevel: 4 as const,
      written: 'わたしは学生です。',
    };
    const result = await assessLevel(input, context('native', { provider: createMockProvider() }));
    expect(result.ok && result.value).toMatchObject({ level: 4, strengths: expect.any(Array) });
  });
});
