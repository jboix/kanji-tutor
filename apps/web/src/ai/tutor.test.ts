import { describe, expect, it } from 'vitest';
import { createMockProvider } from './providers/mock.ts';
import { explainMistake, explainWord, transcribeReading } from './tasks.ts';
import {
  fakeLearner,
  fakeVerifier,
  learnerOverview,
  scriptedProvider,
  testContext,
} from './testing/context.ts';
import { TEACHER_RULE } from './tools/teacher.ts';
import type { ExplainMistakeInput, ExplainWordInput } from './types.ts';

const MISTAKE: ExplainMistakeInput = {
  sentence: { text: '駅で友達を待っている間に、本を読みました。' },
  target: { surface: '待って', expected: 'まって' },
  answer: 'もって',
  errorType: 'wrong-kanji',
};
const WORD: ExplainWordInput = { sentence: MISTAKE.sentence, surface: '間に' };
const VERIFIER = { 待って: ['まって'], 持って: ['もって'], 待っている: ['まっている'] };

const wordReply = (nuance: string) =>
  JSON.stringify({
    surface: '間に',
    reading: { surface: '間', reading: 'あいだ' },
    meaning: nuance,
    nuance,
    chips: [],
    readings: [],
  });

describe('model tiers (A12)', () => {
  it('runs teacher tasks on the teacher model at medium thinking, fast ones on the fast model', async () => {
    const provider = scriptedProvider([wordReply('While.'), '{"kana": "まって"}']);
    const context = testContext({ provider, teacherModel: 'gemini-3.8-flash' });
    await explainWord(WORD, context);
    await transcribeReading({ audio: { mime: 'audio/webm', data: 'AA' } }, context);
    expect(provider.requests.map((r) => [r.model, r.thinking])).toEqual([
      ['gemini-3.8-flash', 'medium'],
      ['gemini-3.5-flash-lite', 'minimal'],
    ]);
    expect(context.logEntries.map((entry) => entry.model)).toEqual([
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('falls back to the fast model without a teacher model, and sends no tools without a learner', async () => {
    const provider = scriptedProvider([wordReply('While.')]);
    await explainWord(WORD, testContext({ provider }));
    expect(provider.requests[0]?.model).toBe('gemini-3.5-flash-lite');
    expect(provider.requests[0]?.tools).toBeUndefined();
    expect(provider.requests[0]?.system).not.toContain(TEACHER_RULE);
  });
});

describe('explanation language (N10)', () => {
  it('names the language in the system instruction and the request, and keys the cache by it', async () => {
    const provider = scriptedProvider([wordReply('Pendant que.')]);
    const french = testContext({ provider, explanationLanguage: 'fr' });
    await explainWord(WORD, french);
    expect(provider.requests[0]?.system).toContain('in French (fr)');
    expect(provider.requests[0]?.prompt.split('\n')[0]).toBe(
      'Explanation language: French (fr). Write all non-Japanese prose in French.',
    );
    const english = { ...french, explanationLanguage: 'en' };
    expect(await explainWord(WORD, english)).toMatchObject({ ok: true, cached: false });
    expect(await explainWord(WORD, french)).toMatchObject({ ok: true, cached: true });
  });

  it('flows to the mock, which replays the French fixture', async () => {
    const context = testContext({
      provider: createMockProvider(),
      explanationLanguage: 'fr',
      lang: fakeVerifier(VERIFIER),
    });
    const result = await explainWord(WORD, context);
    expect(result.ok && result.value.meaning).toBe('pendant que, à un moment pendant');
    expect(result.ok && result.offLanguage).toBeFalsy();
  });

  it('retries prose in the wrong script once, then accepts the retry', async () => {
    const provider = scriptedProvider([
      wordReply('のんびり過ごすという意味です。'),
      wordReply('While.'),
    ]);
    const context = testContext({ provider });
    expect(await explainWord(WORD, context)).toMatchObject({ ok: true, cached: false });
    expect(provider.requests).toHaveLength(2);
    expect(context.cacheEntries.size).toBe(1);
  });

  it('marks prose still in the wrong language after the retry and does not cache it', async () => {
    const provider = scriptedProvider([wordReply('のんびり過ごすという意味です。')]);
    const context = testContext({ provider, explanationLanguage: 'fr' });
    const result = await explainWord(WORD, context);
    expect(result).toMatchObject({ ok: true, cached: false, offLanguage: true });
    expect(provider.requests).toHaveLength(2);
    expect(context.cacheEntries.size).toBe(0);
  });

  it('keeps an off-language reply over an invalid retry', async () => {
    const provider = scriptedProvider([wordReply('のんびり過ごす。'), 'not json']);
    const result = await explainWord(WORD, testContext({ provider }));
    expect(result).toMatchObject({ ok: true, offLanguage: true });
  });
});

describe('learner tools (A10)', () => {
  it('runs the recorded tool calls through the real handlers, then verifies the final readings', async () => {
    const learner = fakeLearner();
    const context = testContext({
      provider: createMockProvider(),
      learner,
      lang: fakeVerifier({ ...VERIFIER, 持って: ['もちって'] }),
    });
    const result = await explainMistake(MISTAKE, context);
    expect(learner.calls).toEqual([
      'getLearnerProfile',
      'getLearnerProfile',
      'checkKnown',
      'lookupWord',
    ]);
    if (!result.ok) throw new Error('expected an explanation');
    const checked = Object.fromEntries(result.value.readings.map((r) => [r.surface, r.verified]));
    expect(checked).toMatchObject({ 待って: true, 持って: false });
  });

  it('adds the teacher rule and the level line, and keys the cache by the learner snapshot', async () => {
    let overview = learnerOverview();
    const learner = fakeLearner({ getLearnerProfile: async () => overview });
    const provider = scriptedProvider([wordReply('While.')]);
    const context = testContext({ provider, learner });
    await explainWord(WORD, context);
    const [request] = provider.requests;
    expect(request?.system).toContain(TEACHER_RULE);
    expect(request?.prompt).toContain('Learner level: N4 (set); about 20% of N4 words known.');
    expect(request?.tools?.declarations.map((tool) => tool.name)).toEqual([
      'get_learner_profile',
      'check_known',
      'lookup_word',
      'known_examples',
    ]);
    expect(await explainWord(WORD, context)).toMatchObject({ cached: true });
    overview = learnerOverview({ level: 3 });
    expect(await explainWord(WORD, context)).toMatchObject({ cached: false });
  });

  it('still answers when the learner view fails', async () => {
    const learner = fakeLearner({
      getLearnerProfile: async () => {
        throw new Error('db closed');
      },
    });
    const context = testContext({
      provider: createMockProvider(),
      learner,
      lang: fakeVerifier(VERIFIER),
    });
    expect(await explainMistake(MISTAKE, context)).toMatchObject({ ok: true });
  });
});
