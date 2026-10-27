/**
 * Turns a validated reply into the task output: the task's own `finalize` (verification, A8),
 * then, for a request in immersion, the post-check against what the learner knows (M2). Runs on
 * fresh replies and cache hits alike, so the check follows the learner's progress.
 */
import type { z } from 'zod';
import { summaryOf } from './immersion.ts';
import { checkImmersion } from './immersion-check.ts';
import { withoutNewMarks } from './new-marks.ts';
import { type HiddenReading, spoilsReading } from './no-spoil.ts';
import { proseReadings } from './prose-readings.ts';
import type { Plan } from './request.ts';
import type { TaskDef } from './task-def.ts';
import type { AiContext, CheckedReading, TaskInput, TaskName, TaskOutput } from './types.ts';

/** Readings written in the summary that the listed ones miss, checked; hidden ones dropped. */
async function summaryReadings(
  context: AiContext,
  summary: string | undefined,
  value: unknown,
  hidden: readonly HiddenReading[],
): Promise<{ readings?: CheckedReading[] }> {
  const listed = (value as { readings?: unknown }).readings;
  if (!summary || !Array.isArray(listed)) return {};
  const known = listed as CheckedReading[];
  const extra = (await proseReadings(context.lang, summary, known)).filter(
    (claim) => !spoilsReading(claim, hidden),
  );
  return extra.length > 0 ? { readings: [...known, ...extra] } : {};
}

/** The output of one reply; `def` is the task's own definition (its prose is the Japanese). */
export async function finishTask<T extends TaskName, S extends z.ZodType>(
  def: TaskDef<T, S>,
  reply: z.output<S>,
  input: TaskInput<T>,
  context: AiContext,
  plan: Pick<Plan, 'immersion'>,
): Promise<TaskOutput<T>> {
  const raw = withoutNewMarks(reply);
  const value = await def.finalize(raw, input, context.lang);
  if (!plan.immersion) return value;
  const summary = summaryOf(raw);
  const hidden = def.hidden?.(input) ?? [];
  const texts = def.prose ? def.prose(value as z.output<S>) : [];
  const immersion = await checkImmersion(texts, plan.immersion, context, { hidden, summary });
  const readings = await summaryReadings(context, immersion.summaryNative, value, hidden);
  return { ...value, ...readings, immersion };
}
