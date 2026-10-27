import type { GenerateContentParameters } from '@google/genai';
import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../limiter.ts';
import type { AiRequest, ToolRunner } from '../types.ts';
import { createGeminiProvider, type GenAiSdk, isLegacyModel, toParams } from './gemini.ts';

const REQUEST: AiRequest = {
  task: 'analysePage',
  promptVersion: 1,
  model: 'gemini-3.5-flash-lite',
  system: 'System text',
  prompt: 'Prompt text',
  schema: { type: 'object' },
  media: [{ mime: 'image/jpeg', data: 'AAAA' }],
};

type Reply = Awaited<
  ReturnType<InstanceType<GenAiSdk['GoogleGenAI']>['models']['generateContent']>
>;

function fakeSdk(reply: Reply | Error | Reply[]) {
  const calls: GenerateContentParameters[] = [];
  const keys: string[] = [];
  let loads = 0;
  class GoogleGenAI {
    models = {
      generateContent: async (params: GenerateContentParameters) => {
        calls.push(params);
        if (reply instanceof Error) throw reply;
        return Array.isArray(reply) ? (reply[calls.length - 1] ?? {}) : reply;
      },
    };
    constructor(options: { apiKey: string }) {
      keys.push(options.apiKey);
    }
  }
  const loadSdk = async (): Promise<GenAiSdk> => {
    loads += 1;
    return { GoogleGenAI };
  };
  return { loadSdk, calls, keys, loads: () => loads };
}

describe('toParams', () => {
  it('sends the prompt, inline media, system instruction and JSON schema', () => {
    const signal = new AbortController().signal;
    expect(toParams(REQUEST, signal)).toEqual({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Prompt text' },
            { inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } },
          ],
        },
      ],
      config: {
        systemInstruction: 'System text',
        responseMimeType: 'application/json',
        responseJsonSchema: { type: 'object' },
        abortSignal: signal,
      },
    });
  });

  it('omits the abort signal and media when absent', () => {
    const { media: _media, ...plain } = REQUEST;
    const params = toParams(plain);
    expect(params.config).not.toHaveProperty('abortSignal');
    expect(params.contents).toEqual([{ role: 'user', parts: [{ text: 'Prompt text' }] }]);
  });
});

describe('createGeminiProvider', () => {
  it('reads text and token usage, creating the client once with the key', async () => {
    const sdk = fakeSdk({
      text: '{"lines":[]}',
      usageMetadata: { promptTokenCount: 1300, candidatesTokenCount: 40 },
    });
    const provider = createGeminiProvider('user-key', {
      loadSdk: sdk.loadSdk,
      limiter: createRateLimiter(),
    });
    expect(provider.id).toBe('gemini');
    expect(await provider.generate(REQUEST)).toEqual({
      text: '{"lines":[]}',
      inputTokens: 1300,
      outputTokens: 40,
      cachedTokens: 0,
    });
    await provider.generate(REQUEST);
    expect(sdk.keys).toEqual(['user-key']);
    expect(sdk.loads()).toBe(1);
    expect(sdk.calls).toHaveLength(2);
  });

  it('treats a missing text or usage as empty', async () => {
    const provider = createGeminiProvider('k', {
      loadSdk: fakeSdk({}).loadSdk,
      limiter: createRateLimiter(),
    });
    expect(await provider.generate(REQUEST)).toEqual({
      text: '',
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
    });
  });

  it('rethrows SDK errors for the task to map', async () => {
    const error = Object.assign(new Error('quota'), { status: 429 });
    const provider = createGeminiProvider('k', {
      loadSdk: fakeSdk(error).loadSdk,
      limiter: createRateLimiter(),
    });
    await expect(provider.generate(REQUEST)).rejects.toBe(error);
  });

  it('retries loading the SDK after a failed load', async () => {
    const sdk = fakeSdk({ text: '{}' });
    let fail = true;
    const loadSdk = () => {
      if (fail) {
        fail = false;
        return Promise.reject(new Error('chunk failed'));
      }
      return sdk.loadSdk();
    };
    const provider = createGeminiProvider('k', { loadSdk, limiter: createRateLimiter() });
    await expect(provider.generate(REQUEST)).rejects.toThrow('chunk failed');
    expect(await provider.generate(REQUEST)).toMatchObject({ text: '{}' });
  });
});

const TOOLS: ToolRunner & { seen: string[] } = {
  seen: [],
  declarations: [{ name: 'lookup_word', description: 'Look up', parameters: { type: 'object' } }],
  async execute(call) {
    this.seen.push(`${call.id}:${call.name}`);
    return { ...(call.id ? { id: call.id } : {}), name: call.name, response: { output: 'まつ' } };
  },
};

describe('thinking and tools (A12, A10)', () => {
  it('sends the thinking level, never temperature or a budget', () => {
    const config = toParams({ ...REQUEST, thinking: 'low' }).config;
    expect(config?.thinkingConfig).toEqual({ thinkingLevel: 'LOW' });
    expect(config).not.toHaveProperty('temperature');
    expect(config?.thinkingConfig).not.toHaveProperty('thinkingBudget');
  });

  it('sends no thinking config or tools to a legacy 2.x model', () => {
    const config = toParams({
      ...REQUEST,
      model: 'gemini-2.5-flash',
      thinking: 'low',
      tools: TOOLS,
    }).config;
    expect(config).not.toHaveProperty('thinkingConfig');
    expect(config).not.toHaveProperty('tools');
    expect([isLegacyModel('gemini-2.5-flash-lite'), isLegacyModel('gemini-3.8-flash')]).toEqual([
      true,
      false,
    ]);
  });

  it('declares the tools and forbids calls once the round limit is reached', () => {
    const request = { ...REQUEST, tools: TOOLS };
    expect(toParams(request).config).toMatchObject({
      tools: [
        {
          functionDeclarations: [
            {
              name: 'lookup_word',
              description: 'Look up',
              parametersJsonSchema: { type: 'object' },
            },
          ],
        },
      ],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
    });
    const last = toParams(request, undefined, [], false).config;
    expect(last?.toolConfig).toEqual({ functionCallingConfig: { mode: 'NONE' } });
  });

  it('runs the loop: model turns go back unmodified, each call answered by id and name', async () => {
    const modelTurn = {
      role: 'model',
      parts: [
        {
          functionCall: { id: 'call_3091958', name: 'lookup_word', args: { text: '待つ' } },
          thoughtSignature: 'sig-abc',
        },
      ],
    };
    const sdk = fakeSdk([
      {
        candidates: [{ content: modelTurn }],
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 5 },
      },
      {
        text: '{"ok":true}',
        candidates: [{ content: { role: 'model', parts: [{ text: '{"ok":true}' }] } }],
        usageMetadata: {
          promptTokenCount: 150,
          candidatesTokenCount: 9,
          cachedContentTokenCount: 90,
        },
      },
    ]);
    const provider = createGeminiProvider('k', {
      loadSdk: sdk.loadSdk,
      limiter: createRateLimiter(),
    });
    const response = await provider.generate({ ...REQUEST, media: [], tools: TOOLS });
    expect(response).toEqual({
      text: '{"ok":true}',
      inputTokens: 250,
      outputTokens: 14,
      cachedTokens: 90,
      toolRounds: 1,
    });
    expect(TOOLS.seen).toEqual(['call_3091958:lookup_word']);
    const second = sdk.calls[1]?.contents as unknown[];
    expect(second).toHaveLength(3);
    expect(second[1]).toBe(modelTurn);
    expect(second[2]).toEqual({
      role: 'user',
      parts: [
        {
          functionResponse: {
            id: 'call_3091958',
            name: 'lookup_word',
            response: { output: 'まつ' },
          },
        },
      ],
    });
    expect(sdk.calls[0]?.contents).toHaveLength(1);
  });

  it('skips calls without a name and answers calls without an id by name only', async () => {
    const sdk = fakeSdk([
      {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ functionCall: { name: 'lookup_word' } }, { functionCall: {} }],
            },
          },
        ],
      },
      { text: '{}' },
    ]);
    const provider = createGeminiProvider('k', {
      loadSdk: sdk.loadSdk,
      limiter: createRateLimiter(),
    });
    expect(await provider.generate({ ...REQUEST, tools: TOOLS })).toMatchObject({
      text: '{}',
      toolRounds: 1,
    });
    const contents = (sdk.calls[1]?.contents ?? []) as { parts: unknown[] }[];
    const reply = contents[2];
    expect(reply?.parts).toEqual([
      { functionResponse: { name: 'lookup_word', response: { output: 'まつ' } } },
    ]);
  });

  it('gives up a request past its deadline with a TimeoutError, the request sent once', async () => {
    let sent = 0;
    class GoogleGenAI {
      models = {
        generateContent: (params: GenerateContentParameters) => {
          sent += 1;
          return new Promise<Reply>((_resolve, reject) => {
            params.config?.abortSignal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            );
          });
        },
      };
    }
    const provider = createGeminiProvider('k', {
      loadSdk: async () => ({ GoogleGenAI }),
      limiter: createRateLimiter(),
      deadlineMs: 10,
    });
    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(sent).toBe(1);
  });

  it('leaves a cancel by the learner an AbortError', async () => {
    const stop = new AbortController();
    class GoogleGenAI {
      models = {
        generateContent: (params: GenerateContentParameters) =>
          new Promise<Reply>((_resolve, reject) => {
            params.config?.abortSignal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            );
            stop.abort();
          }),
      };
    }
    const provider = createGeminiProvider('k', {
      loadSdk: async () => ({ GoogleGenAI }),
      limiter: createRateLimiter(),
    });
    await expect(provider.generate(REQUEST, stop.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
