import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './limiter.ts';
import { createGeminiProvider, type GenAiSdk } from './providers/gemini.ts';
import { REQUESTS_PER_ACTION } from './run.ts';
import { breakdownSentence, explainWord } from './tasks.ts';
import { fakeLearner, testContext } from './testing/context.ts';
import { MAX_TOOL_ROUNDS } from './tools/loop.ts';

type Params = Parameters<InstanceType<GenAiSdk['GoogleGenAI']>['models']['generateContent']>[0];

/**
 * A Gemini SDK that counts every request: it asks for a tool whenever tools are allowed and
 * never sends valid JSON, the worst case for one press (tool rounds, then the retry).
 */
function countingSdk() {
  const sent: string[] = [];
  const generateContent = async (params: Params) => {
    const mode = params.config?.toolConfig?.functionCallingConfig?.mode;
    sent.push(mode ?? 'plain');
    if (mode === 'AUTO') {
      const call = {
        functionCall: { id: `c${sent.length}`, name: 'get_learner_profile', args: {} },
      };
      return { candidates: [{ content: { role: 'model', parts: [call] } }] };
    }
    return { text: 'not json' };
  };
  const sdk: GenAiSdk = {
    GoogleGenAI: class {
      models = { generateContent };
    } as unknown as GenAiSdk['GoogleGenAI'],
  };
  return { sent, loadSdk: async () => sdk };
}

function contextWith(sdk: ReturnType<typeof countingSdk>) {
  const limiter = createRateLimiter({ perMinute: 1000 });
  const provider = createGeminiProvider('AIza-test', { loadSdk: sdk.loadSdk, limiter });
  return testContext({
    provider,
    model: 'gemini-3.1-flash-lite-preview',
    teacherModel: 'gemini-3.1-flash-lite-preview',
    learner: fakeLearner(),
  });
}

const INPUT = { sentence: { text: '駅で友達を待っている間に、本を読みました。' }, surface: '間' };

describe('requests per press (Issue 42, A14)', () => {
  it('caps tool rounds at two', () => {
    expect(MAX_TOOL_ROUNDS).toBe(2);
    expect(REQUESTS_PER_ACTION).toBe(4);
  });

  it('makes at most four requests for a teacher task, tool rounds and the retry included', async () => {
    const sdk = countingSdk();
    const result = await explainWord(INPUT, contextWith(sdk));
    expect(result).toMatchObject({ ok: false, error: { kind: 'invalid-response' } });
    expect(sdk.sent.length).toBeLessThanOrEqual(REQUESTS_PER_ACTION);
    expect(sdk.sent).toEqual(['AUTO', 'AUTO', 'NONE', 'NONE']);
  });

  it('makes at most two requests for a fast task with no tools', async () => {
    const sdk = countingSdk();
    await breakdownSentence({ sentence: INPUT.sentence, focus: '間' }, contextWith(sdk));
    expect(sdk.sent).toEqual(['plain', 'plain']);
    expect(sdk.sent.length).toBeLessThanOrEqual(2);
  });
});
