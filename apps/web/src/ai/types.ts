/**
 * Contract of the AI module: one typed task per feature (SPEC "AI layer"). The task inputs and
 * outputs are in `task-types.ts`; results, providers, the context and the client are here.
 */
import type { LearnerOverview, LearnerView } from '../domain/learner-view.ts';
import type { AiCacheRepo, AiLogRepo } from '../domain/repos.ts';
import type { ImmersionMode } from '../domain/types.ts';
import type { Lang } from '../lang/types.ts';
import type { LearnerProfile, Media } from './task-shared-types.ts';
import type { TaskInput, TaskName, TaskOutput } from './task-types.ts';

export type * from './scan-task-types.ts';
export type * from './task-shared-types.ts';
export type * from './task-types.ts';

// ── Results, providers, context ───────────────────────────────────────────────

export type AiErrorKind = 'offline' | 'no-key' | 'invalid-response' | 'provider' | 'rate-limit';

export interface AiError {
  kind: AiErrorKind;
  message: string;
  /** For `rate-limit`: how long to wait before a retry, in ms (A14). */
  retryAfterMs?: number;
  /** For `provider`: a known cause the UI words in the learner's language. */
  code?: 'cancelled' | 'refused' | 'no-answer';
  /** For `refused`: the HTTP status Google answered with. */
  status?: number;
}

/**
 * A task result. `offLanguage` marks an answer whose prose is still not in the explanation
 * language after one retry: show it, marked, rather than as normal.
 */
export type Result<T> =
  | { ok: true; value: T; cached: boolean; offLanguage?: true }
  | { ok: false; error: AiError };

/** Which model a task runs on (A12): the cheap fast model or the tool-using teacher model. */
export type ModelTier = 'fast' | 'teacher';

/** Gemini 3.x `thinkingLevel`. Never sent together with a thinking budget. */
export type ThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

/** A function the model asked to call (A10). `id` must come back on its result. */
export interface ToolCall {
  id?: string;
  name: string;
  args: Record<string, unknown>;
}

/** The answer to one `ToolCall`: `{ output }` on success, `{ error }` when the handler failed. */
export interface ToolResult {
  id?: string;
  name: string;
  response: { output: unknown } | { error: string };
}

/** A function declaration as the provider sends it (JSON Schema parameters). */
export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Local tools a request may use; `execute` never throws (errors come back as results). */
export interface ToolRunner {
  declarations: readonly ToolDeclaration[];
  execute(call: ToolCall): Promise<ToolResult>;
}

/** What a provider is asked to generate. */
export interface AiRequest {
  task: TaskName;
  promptVersion: number;
  model: string;
  system: string;
  prompt: string;
  /** JSON schema the response must follow (provider structured output). */
  schema: Record<string, unknown>;
  media?: Media[];
  thinking?: ThinkingLevel;
  /** Learner tools for teacher-tier tasks (A10); the provider runs the call loop. */
  tools?: ToolRunner;
  /** Tool rounds this request may run; `MAX_TOOL_ROUNDS` when absent, 0 forces text. */
  maxToolRounds?: number;
}

export interface AiResponse {
  /** Raw JSON text; parsed and validated by the task. */
  text: string;
  /** Tokens summed over every round of a tool loop. */
  inputTokens: number;
  outputTokens: number;
  /** Prompt tokens Gemini served from its implicit cache, part of `inputTokens` (A15). */
  cachedTokens?: number;
  /** Tool rounds the provider ran before the final answer. */
  toolRounds?: number;
}

/** A model backend: `gemini` at runtime with the user's key, `mock` in tests and e2e. */
export interface AiProvider {
  readonly id: 'gemini' | 'mock';
  generate(request: AiRequest, signal?: AbortSignal): Promise<AiResponse>;
}

/** Everything a task needs to run. */
export interface AiContext {
  /** Undefined when no key is configured: tasks return a `no-key` error. */
  provider: AiProvider | undefined;
  /** Fast-tier model (A12). */
  model: string;
  /** Teacher-tier model; the fast model when absent. */
  teacherModel?: string;
  /** BCP-47 language for the tutor's prose (N10); English when absent. */
  explanationLanguage?: string;
  /** The learner's progress for the teacher's tools (A10); no tools when absent. */
  learner?: LearnerView;
  /**
   * The immersion mode for this learner (M1): the app binds the dial setting to the domain's
   * `immersionMode`. Native when absent. Only teacher tasks with a learner view use it.
   */
  immersion?: (learner: Pick<LearnerOverview, 'level' | 'coverage'>) => ImmersionMode;
  cache: AiCacheRepo;
  log: AiLogRepo;
  /** Verification (A8), and the tokenizer for the immersion post-check (M2) when at hand. */
  lang: Pick<Lang, 'verifyReading'> & Partial<Pick<Lang, 'tokenize'>>;
  profile: LearnerProfile;
  isOnline: () => boolean;
  now: () => number;
  signal?: AbortSignal;
}

/** A task function: context in, validated and verified JSON out. */
export type Task<T extends TaskName> = (
  input: TaskInput<T>,
  context: AiContext,
) => Promise<Result<TaskOutput<T>>>;

/** The cached answer of a task for this input, without calling the provider (A15). */
export type Peek<T extends TaskName> = (
  input: TaskInput<T>,
  context: AiContext,
) => Promise<TaskOutput<T> | undefined>;

/** A task with its cache-only lookup. */
export type PeekableTask<T extends TaskName> = Task<T> & { peek: Peek<T> };

/**
 * The tasks bound to a context; what features call through `useServices().ai`. `peek` returns
 * what the tutor already answered for an input (from the local cache) and never calls Gemini.
 */
export type AiClient = {
  [T in TaskName]: (input: TaskInput<T>) => Promise<Result<TaskOutput<T>>>;
} & {
  peek<T extends TaskName>(task: T, input: TaskInput<T>): Promise<TaskOutput<T> | undefined>;
};
