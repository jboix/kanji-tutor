import type {
  Content,
  FunctionCallingConfigMode,
  GenerateContentConfig,
  GenerateContentParameters,
  Part,
  ThinkingLevel as SdkThinkingLevel,
} from '@google/genai';
import { limited, type RateLimiter, sharedLimiter } from '../limiter.ts';
import { runToolLoop, type ToolSession, type Turn } from '../tools/loop.ts';
import type { AiProvider, AiRequest, AiResponse, ToolCall, ToolResult } from '../types.ts';

/** The slice of a `generateContent` response the provider reads. */
interface GenAiResponse {
  text?: string | undefined;
  candidates?: { content?: Content | undefined }[] | undefined;
  usageMetadata?:
    | {
        promptTokenCount?: number | undefined;
        candidatesTokenCount?: number | undefined;
        /** Prompt tokens Gemini served from its implicit cache (A15). */
        cachedContentTokenCount?: number | undefined;
      }
    | undefined;
}

interface GenAiClient {
  models: { generateContent(params: GenerateContentParameters): Promise<GenAiResponse> };
}

/** The slice of `@google/genai` the provider uses; tests inject a fake one. */
export interface GenAiSdk {
  GoogleGenAI: new (options: { apiKey: string }) => GenAiClient;
}

export interface GeminiOptions {
  /** Loads the SDK; defaults to a dynamic `import('@google/genai')`. */
  loadSdk?: () => Promise<GenAiSdk>;
  /** Every request, tool rounds included, waits its turn here (A14); the app-wide one by default. */
  limiter?: RateLimiter;
}

/**
 * Gemini 1.x and 2.x take a thinking budget, not a level, and cannot mix function calling with a
 * JSON schema; for a custom id like that, requests go without thinking config and without tools.
 */
export function isLegacyModel(model: string): boolean {
  return /^gemini-[12](\.|-)/.test(model);
}

/** The first user turn: prompt text plus inline media. */
export function userContent(request: AiRequest): Content {
  const media = (request.media ?? []).map((item) => ({
    inlineData: { mimeType: item.mime, data: item.data },
  }));
  return { role: 'user', parts: [{ text: request.prompt }, ...media] };
}

function modelConfig(request: AiRequest, allowTools: boolean): GenerateContentConfig {
  if (isLegacyModel(request.model)) return {};
  const thinking = request.thinking
    ? { thinkingConfig: { thinkingLevel: request.thinking.toUpperCase() as SdkThinkingLevel } }
    : {};
  if (!request.tools) return thinking;
  const functionDeclarations = request.tools.declarations.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: tool.parameters,
  }));
  const mode = (allowTools ? 'AUTO' : 'NONE') as FunctionCallingConfigMode;
  return {
    ...thinking,
    tools: [{ functionDeclarations }],
    toolConfig: { functionCallingConfig: { mode } },
  };
}

/**
 * The `generateContent` parameters for one turn (exported for tests). No temperature, top-p or
 * top-k: Google advises leaving them unset for Gemini 3.x.
 */
export function toParams(
  request: AiRequest,
  signal?: AbortSignal,
  contents: Content[] = [userContent(request)],
  allowTools = true,
): GenerateContentParameters {
  return {
    model: request.model,
    contents,
    config: {
      systemInstruction: request.system,
      responseMimeType: 'application/json',
      responseJsonSchema: request.schema,
      ...modelConfig(request, allowTools),
      ...(signal ? { abortSignal: signal } : {}),
    },
  };
}

function callsOf(content: Content | undefined): ToolCall[] {
  return (content?.parts ?? []).flatMap(({ functionCall: call }) =>
    call?.name
      ? [{ ...(call.id ? { id: call.id } : {}), name: call.name, args: call.args ?? {} }]
      : [],
  );
}

function toTurn(response: GenAiResponse): Turn {
  const calls = callsOf(response.candidates?.[0]?.content);
  return {
    calls,
    text: calls.length > 0 ? '' : (response.text ?? ''),
    inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    cachedTokens: response.usageMetadata?.cachedContentTokenCount ?? 0,
  };
}

/** One function response per call, with the call's id and name. */
function resultsContent(results: ToolResult[]): Content {
  const parts: Part[] = results.map(({ id, name, response }) => ({
    functionResponse: { ...(id ? { id } : {}), name, response },
  }));
  return { role: 'user', parts };
}

/**
 * A conversation that keeps the full history. The model's turns are pushed back unmodified, so
 * their thought signatures survive between rounds.
 */
function session(ai: GenAiClient, request: AiRequest, link: Link): ToolSession {
  const { signal, limiter } = link;
  const contents: Content[] = [userContent(request)];
  return {
    next: async (results, allowTools) => {
      if (results) contents.push(resultsContent(results));
      const params = toParams(request, signal, [...contents], allowTools);
      const response = await limited(limiter, signal, () => ai.models.generateContent(params));
      const content = response.candidates?.[0]?.content;
      if (content) contents.push(content);
      return toTurn(response);
    },
  };
}

/** What every round of one request shares: its abort signal and the rate limiter. */
interface Link {
  signal?: AbortSignal | undefined;
  limiter: RateLimiter;
}

async function generate(ai: GenAiClient, request: AiRequest, link: Link) {
  const tools = isLegacyModel(request.model) ? undefined : request.tools;
  const chat = session(ai, request, link);
  if (tools) return runToolLoop(chat, tools, request.maxToolRounds);
  const { calls: _calls, ...response } = await chat.next(undefined, false);
  return response satisfies AiResponse;
}

/**
 * Gemini via `@google/genai`, loaded lazily so the SDK stays out of the app shell (N4). The key is
 * the one the user typed in Settings (N3). Teacher requests run the bounded tool loop (A10).
 */
export function createGeminiProvider(apiKey: string, options: GeminiOptions = {}): AiProvider {
  const loadSdk = options.loadSdk ?? (() => import('@google/genai'));
  const limiter = options.limiter ?? sharedLimiter;
  let client: Promise<GenAiClient> | undefined;
  const getClient = () => {
    if (!client) {
      client = loadSdk().then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey }));
      client.catch(() => {
        client = undefined;
      });
    }
    return client;
  };
  return {
    id: 'gemini',
    generate: async (request, signal) => generate(await getClient(), request, { signal, limiter }),
  };
}
