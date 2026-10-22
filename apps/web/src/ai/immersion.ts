/**
 * Immersion prompt policy (M1, M2). In mixed or Japanese mode, teacher explanations are
 * written in Japanese at the learner's level, using the learner tools to stay within what they
 * know, and every reply also carries `summaryNative`, a short summary in the learner's language
 * that the post-check falls back to when too many words are above the learner.
 */
import { z } from 'zod';
import type { ImmersionMode } from '../domain/types.ts';
import { languageName } from './language.ts';
import type { TaskDef } from './task-def.ts';
import type { TaskName } from './types.ts';

/** The modes that change a request. */
export type ImmersiveMode = Exclude<ImmersionMode, 'native'>;

/** What a request in immersion knows: the mode and the learner's level. */
export interface ImmersionPlan {
  mode: ImmersiveMode;
  level: number;
}

const SHARED = (level: number, name: string) =>
  [
    `Use only words and grammar of N${level} or easier that the learner knows: call check_known`,
    'on any word you are not sure of before you use it, and prefer known_examples for examples.',
    `Short sentences in the polite です・ます form. When a new word cannot be avoided, put its`,
    `${name} meaning in brackets right after it, e.g. 鉛筆（pencil）. Readings and kanji names stay`,
    `as they are. Chip labels stay in ${name}.`,
    `Always fill summaryNative: the same explanation in one or two short ${name} sentences.`,
  ].join(' ');

/** The system-instruction rule for a mode, after the language rule (which it overrides). */
export function immersionRule(plan: ImmersionPlan, code: string): string {
  const name = languageName(code);
  const head =
    plan.mode === 'japanese'
      ? `Immersion: write the explanation fields in simple Japanese, not in ${name}.`
      : `Immersion, mixed: write each explanation field as one or two simple Japanese sentences, then one short ${name} line that says the same.`;
  return `${head} ${SHARED(plan.level, name)}`;
}

/** The first line of the request text, so the mode is stated next to the input. */
export function immersionLine(plan: ImmersionPlan): string {
  return `Immersion: ${plan.mode}, at N${plan.level}.`;
}

const summaryField = z
  .string()
  .exactOptional()
  .describe("The explanation in one or two short sentences in the learner's language.");

const extended = new WeakMap<z.ZodType, z.ZodType>();

/** The schema with `summaryNative` added, for object schemas; others are returned as they are. */
export function withSummary(schema: z.ZodType): z.ZodType {
  if (!(schema instanceof z.ZodObject)) return schema;
  const known = extended.get(schema);
  if (known) return known;
  const next = schema.extend({ summaryNative: summaryField });
  extended.set(schema, next);
  return next;
}

/** The summary a reply carried, if any. */
export function summaryOf(raw: unknown): string | undefined {
  if (raw === null || typeof raw !== 'object' || !('summaryNative' in raw)) return undefined;
  const value = raw.summaryNative;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

type AnyDef = TaskDef<TaskName, z.ZodType>;

/**
 * The definition a request in immersion runs with: the schema carries `summaryNative`, and only
 * the summary is held to the explanation language, since the rest is Japanese on purpose.
 */
export function immersiveDef(def: AnyDef): AnyDef {
  return {
    ...def,
    schema: withSummary(def.schema),
    prose: (raw) => [summaryOf(raw) ?? ''],
  };
}
