/**
 * Turns a task definition and its input into a provider request (A10, A12, N10): the tier's model
 * and thinking level, the explanation language, and the learner tools for teacher tasks.
 */
import type { z } from 'zod';
import { type ImmersionPlan, immersionLine, immersionRule, immersiveDef } from './immersion.ts';
import { toProviderSchema } from './json-schema.ts';
import { DEFAULT_LANGUAGE, languageLine, languageRule } from './language.ts';
import { joinLines } from './prompts/shared.ts';
import type { TaskDef } from './task-def.ts';
import { createToolRunner } from './tools/runner.ts';
import { type LearnerSnapshot, learnerSnapshot, TEACHER_RULE } from './tools/teacher.ts';
import type { AiContext, AiRequest, TaskName } from './types.ts';

type AnyDef = TaskDef<TaskName, z.ZodType>;

/**
 * A request and the context it depends on beyond the input, for the cache key. `def` is the
 * definition the request runs with: the task's own, or its immersive form (M2).
 */
export interface Plan {
  request: AiRequest;
  language: string;
  scope: { language: string; learner?: string; immersion?: string };
  def: AnyDef;
  immersion?: ImmersionPlan;
}

const schemaCache = new WeakMap<z.ZodType, Record<string, unknown>>();

function providerSchema(schema: z.ZodType): Record<string, unknown> {
  const known = schemaCache.get(schema);
  if (known) return known;
  const converted = toProviderSchema(schema);
  schemaCache.set(schema, converted);
  return converted;
}

/** The model a task runs on: the teacher model for teacher tasks, else the fast one (A12). */
export function modelFor(def: Pick<AnyDef, 'tier'>, context: AiContext): string {
  return def.tier === 'teacher' ? (context.teacherModel ?? context.model) : context.model;
}

/** Mixed or Japanese for an immersive task, from the learner and the dial (M1). */
function immersionOf(def: AnyDef, context: AiContext, snapshot: LearnerSnapshot | undefined) {
  if (!def.immersive || !snapshot || !context.immersion) return undefined;
  const mode = context.immersion(snapshot.learner);
  return mode === 'native' ? undefined : { mode, level: snapshot.learner.level };
}

async function teacherParts(def: AnyDef, context: AiContext) {
  if (def.tier !== 'teacher' || !context.learner) return {};
  const snapshot = await learnerSnapshot(context.learner);
  const immersion = immersionOf(def, context, snapshot);
  return { snapshot, immersion, tools: createToolRunner(context.learner) };
}

function scopeOf(language: string, snapshot?: LearnerSnapshot, immersion?: ImmersionPlan) {
  return {
    language,
    ...(snapshot ? { learner: snapshot.key } : {}),
    ...(immersion ? { immersion: immersion.mode } : {}),
  };
}

type Parts = Awaited<ReturnType<typeof teacherParts>>;

/** The system instruction and the request text, stable parts first (A15). */
function textsOf(def: AnyDef, input: unknown, context: AiContext, language: string, parts: Parts) {
  const { snapshot, tools, immersion } = parts;
  return {
    system: joinLines(
      def.prompt.system,
      languageRule(language),
      tools && TEACHER_RULE,
      immersion && immersionRule(immersion, language),
    ),
    prompt: joinLines(
      immersion && immersionLine(immersion),
      languageLine(language),
      snapshot?.line,
      def.prompt.build(input as never, context.profile),
    ),
  };
}

/**
 * Builds the request; teacher tasks with a learner get the tools, the rule and a level line, and
 * immersive ones in mixed or Japanese mode the immersion rule and `summaryNative` (M2).
 */
export async function planRequest(def: AnyDef, input: unknown, context: AiContext): Promise<Plan> {
  const language = context.explanationLanguage ?? DEFAULT_LANGUAGE;
  const parts = await teacherParts(def, context);
  const { snapshot, tools, immersion } = parts;
  const active = immersion ? immersiveDef(def) : def;
  const media = def.media?.(input as never);
  const request: AiRequest = {
    task: def.name,
    promptVersion: def.prompt.version,
    model: modelFor(def, context),
    ...textsOf(def, input, context, language, parts),
    schema: providerSchema(active.schema),
    thinking: def.thinking ?? (def.tier === 'teacher' ? 'medium' : 'low'),
    ...(media && media.length > 0 ? { media } : {}),
    ...(tools ? { tools } : {}),
  };
  const scope = scopeOf(language, snapshot, immersion);
  return { request, language, scope, def: active, ...(immersion ? { immersion } : {}) };
}
