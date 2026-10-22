import type { z } from 'zod';
import { type Failure, failure, mapProviderError } from './errors.ts';
import { finishTask } from './finish.ts';
import { sha256Hex, stableJson } from './hash.ts';
import { proseInLanguage } from './language.ts';
import { type Plan, planRequest } from './request.ts';
import type { TaskDef } from './task-def.ts';
import { MAX_TOOL_ROUNDS } from './tools/loop.ts';
import type {
  AiContext,
  AiProvider,
  AiRequest,
  Result,
  TaskInput,
  TaskName,
  TaskOutput,
} from './types.ts';

type Outcome<V> = { ok: true; value: V; offLanguage?: true } | Failure;
type AnyDef = TaskDef<TaskName, z.ZodType>;

/** Provider attempts per call: one retry when the reply is not valid JSON for the schema. */
const ATTEMPTS = 2;

/**
 * Provider requests one press may make, tool rounds and the retry included (A14): under a
 * free-tier minute of 10–15. The first attempt runs at most 1 + `MAX_TOOL_ROUNDS` = 3; the retry
 * gets what is left, with no tool rounds.
 */
export const REQUESTS_PER_ACTION = 4;

/**
 * Cache key: SHA-256 of the stable JSON of task, prompt version, model, input (media too) and the
 * scope: the explanation language and, for teacher tasks, the learner snapshot.
 */
export function cacheKey(
  task: TaskName,
  promptVersion: number,
  model: string,
  input: unknown,
  scope: Plan['scope'] = { language: 'en' },
) {
  return sha256Hex(stableJson({ task, promptVersion, model, input, scope }));
}

async function safely(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch {
    // Cache and log writes are best effort; a failed write never fails the task.
  }
}

interface Usage {
  cached: boolean;
  ok: boolean;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number | undefined;
}

/** Logs one call; Gemini's implicitly cached prompt tokens only when there were some (A15). */
function record(context: AiContext, request: AiRequest, usage: Usage): Promise<void> {
  const { task, model } = request;
  const { cachedTokens, ...rest } = usage;
  const entry = { at: context.now(), task, model, ...rest };
  const logged = cachedTokens ? { ...entry, cachedTokens } : entry;
  return safely(() => context.log.add(logged));
}

/** Drops `null` fields so optional keys the model filled with null still validate. */
function dropNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropNulls);
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value).filter(([, inner]) => inner !== null);
  return Object.fromEntries(entries.map(([key, inner]) => [key, dropNulls(inner)]));
}

function stripFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
}

/** Parses and validates a raw reply. Exported for the parsing tests. */
export function parseReply<S extends z.ZodType>(schema: S, text: string): Outcome<z.output<S>> {
  let json: unknown;
  try {
    json = JSON.parse(stripFence(text));
  } catch {
    return failure('invalid-response', 'The reply was not valid JSON.');
  }
  const parsed = schema.safeParse(dropNulls(json));
  if (parsed.success) return { ok: true, value: parsed.data };
  const issue = parsed.error.issues[0];
  const where = issue?.path.join('.') || 'reply';
  return failure('invalid-response', `The reply did not match the schema at ${where}.`);
}

async function fromCache(def: AnyDef, hash: string, context: AiContext) {
  let entry: Awaited<ReturnType<AiContext['cache']['get']>>;
  try {
    entry = await context.cache.get(hash);
  } catch {
    return undefined;
  }
  if (!entry) return undefined;
  const parsed = def.schema.safeParse(entry.value);
  return parsed.success ? parsed.data : undefined;
}

/** One provider call and the requests it made: one, plus one per tool round. */
async function callOnce(def: AnyDef, request: AiRequest, provider: AiProvider, context: AiContext) {
  const usage = { cached: false, ok: false, inputTokens: 0, outputTokens: 0 };
  try {
    const response = await provider.generate(request, context.signal);
    const outcome = parseReply(def.schema, response.text);
    const { inputTokens, outputTokens, cachedTokens } = response;
    const counts = { inputTokens, outputTokens, cachedTokens };
    await record(context, request, { ...usage, ok: outcome.ok, ...counts });
    return { outcome, requests: 1 + (response.toolRounds ?? 0) };
  } catch (error) {
    await record(context, request, usage);
    const outcome = { ok: false, error: mapProviderError(error) } satisfies Failure;
    return { outcome, requests: 1 + (request.maxToolRounds ?? MAX_TOOL_ROUNDS) };
  }
}

function inLanguage(def: AnyDef, value: unknown, language: string): boolean {
  return !def.prose || proseInLanguage(def.prose(value), language);
}

/**
 * One provider call. `final` unless the reply was invalid or in the wrong language; those are
 * retried once, and a reply still in the wrong language comes back marked `offLanguage`.
 */
async function attemptOnce(def: AnyDef, request: AiRequest, plan: Plan, call: CallDeps) {
  const { outcome: next, requests } = await callOnce(def, request, call.provider, call.context);
  if (!next.ok) return { final: next.error.kind !== 'invalid-response', outcome: next, requests };
  if (inLanguage(def, next.value, plan.language)) return { final: true, outcome: next, requests };
  return { final: false, outcome: { ...next, offLanguage: true as const }, requests };
}

interface CallDeps {
  provider: AiProvider;
  context: AiContext;
}

/** The request for an attempt with `left` requests of the action's budget, or none. */
function withBudget(request: AiRequest, left: number): AiRequest | undefined {
  if (left < 1) return undefined;
  if (!request.tools) return request;
  return { ...request, maxToolRounds: Math.min(MAX_TOOL_ROUNDS, left - 1) };
}

/** At most `ATTEMPTS` attempts and `REQUESTS_PER_ACTION` requests in all. */
async function generate(def: AnyDef, plan: Plan, provider: AiProvider, context: AiContext) {
  let outcome: Outcome<unknown> = failure('invalid-response', 'No reply.');
  let used = 0;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const request = withBudget(plan.request, REQUESTS_PER_ACTION - used);
    if (!request) break;
    const next = await attemptOnce(def, request, plan, { provider, context });
    used += next.requests;
    if (next.final) return next.outcome;
    if (next.outcome.ok || !outcome.ok) outcome = next.outcome;
  }
  return outcome;
}

/**
 * Starts the tokenizer's dictionary loading while the provider answers, so verifying the reply's
 * readings (A8) does not wait for a cold dictionary afterwards. Best effort.
 */
function warmTokenizer(context: AiContext): void {
  context.lang.tokenize?.('').catch(() => undefined);
}

async function answer(
  def: AnyDef,
  plan: Plan,
  hash: string,
  context: AiContext,
  provider: AiProvider,
) {
  if (!context.isOnline()) {
    return failure(
      'offline',
      'You are offline. Explanations need a connection; the rest still works.',
    );
  }
  warmTokenizer(context);
  const outcome = await generate(def, plan, provider, context);
  if (!outcome.ok || outcome.offLanguage) return outcome;
  const { task, promptVersion, model } = plan.request;
  const entry = {
    hash,
    task,
    promptVersion,
    model,
    createdAt: context.now(),
    value: outcome.value,
  };
  await safely(() => context.cache.put(entry));
  return outcome;
}

/**
 * The request, its cache key and any cached answer, without calling the provider. `generic` is
 * the definition the request runs with (immersive in mixed or Japanese mode, M2).
 */
async function lookup<T extends TaskName, S extends z.ZodType>(
  def: TaskDef<T, S>,
  input: TaskInput<T>,
  context: AiContext,
) {
  const plan = await planRequest(def as unknown as AnyDef, input, context);
  const generic = plan.def;
  const keyed = def.cacheInput ? def.cacheInput(input) : input;
  const hash = await cacheKey(def.name, def.prompt.version, plan.request.model, keyed, plan.scope);
  const hit = await fromCache(generic, hash, context);
  return { generic, plan, hash, hit: hit as z.output<S> | undefined };
}

/**
 * The cached answer for this input, finalized, or undefined. Never calls the provider and logs
 * nothing, so a screen can show what the tutor already said without spending a call (A15).
 */
export async function peekTask<T extends TaskName, S extends z.ZodType>(
  def: TaskDef<T, S>,
  input: TaskInput<T>,
  context: AiContext,
): Promise<TaskOutput<T> | undefined> {
  if (!context.provider) return undefined;
  const { hit, plan } = await lookup(def, input, context);
  return hit === undefined ? undefined : finishTask(def, hit, input, context, plan);
}

/**
 * Runs one task: no-key check, cache lookup, offline check, provider call with one retry on an
 * invalid reply, Zod validation, verification, cache write and cost log. Never throws for expected
 * failures; they come back as `{ ok: false, error }`.
 */
export async function runTask<T extends TaskName, S extends z.ZodType>(
  def: TaskDef<T, S>,
  input: TaskInput<T>,
  context: AiContext,
): Promise<Result<TaskOutput<T>>> {
  const { provider } = context;
  if (!provider) return failure('no-key', 'Add a Gemini key in Settings to use the AI tutor.');
  const { generic, plan, hash, hit } = await lookup(def, input, context);
  if (hit !== undefined) {
    await record(context, plan.request, {
      cached: true,
      ok: true,
      inputTokens: 0,
      outputTokens: 0,
    });
    return { ok: true, value: await finishTask(def, hit, input, context, plan), cached: true };
  }
  const outcome = await answer(generic, plan, hash, context, provider);
  if (!outcome.ok) return outcome;
  const value = await finishTask(def, outcome.value as z.output<S>, input, context, plan);
  return { ok: true, value, cached: false, ...(outcome.offLanguage ? { offLanguage: true } : {}) };
}
