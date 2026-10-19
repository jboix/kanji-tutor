import type { JlptList } from '../../domain/services/index.ts';
import type { LearnerLevel } from '../../domain/types.ts';

/** The welcome wizard's steps, in order (P5). */
export const STEPS = [
  'welcome',
  'language',
  'dictionary',
  'start',
  'known',
  'class',
  'ai',
  'feel',
  'summary',
] as const;

export type StepId = (typeof STEPS)[number];

/** Steps with a Skip button: everything on them is optional. */
export const SKIPPABLE: ReadonlySet<StepId> = new Set(['known', 'class', 'ai']);

/** Where the learner starts (P1, P4): from zero, or studying N5, N4 or N3. */
export type StartChoice = 'zero' | 'n5' | 'n4' | 'n3';

export const START_LEVEL: Record<StartChoice, LearnerLevel> = { zero: 5, n5: 5, n4: 4, n3: 3 };

/** The lists a start stands for (D38): N4 means N5 is known, N3 means N5 and N4 are. */
export const START_LISTS: Record<StartChoice, readonly JlptList[]> = {
  zero: [],
  n5: [],
  n4: ['n5'],
  n3: ['n5', 'n4'],
};

/** The start a stored level stands for; N5 reads as "from zero". */
export function startOf(level: LearnerLevel | undefined): StartChoice {
  if (level === 4) return 'n4';
  if (level === 3) return 'n3';
  return 'zero';
}

export const isStep = (value: string | undefined): value is StepId =>
  STEPS.includes(value as StepId);

export const indexOf = (step: StepId) => STEPS.indexOf(step);

/**
 * Where a reload resumes (P5): the saved step, but never past the dictionary while the packs
 * are not in IndexedDB, since later steps need them.
 */
export function resumeStep(saved: string | undefined, installed: boolean): StepId {
  const step = isStep(saved) ? saved : 'welcome';
  if (!installed && indexOf(step) > indexOf('dictionary')) return 'dictionary';
  return step;
}

/**
 * The step after `step`. After a jump from the summary ("Change"), the wizard goes back to the
 * summary, except that a new start also shows what you know, since it sets those lists.
 */
export function stepAfter(step: StepId, returning: boolean): StepId {
  if (returning) return step === 'start' ? 'known' : 'summary';
  return STEPS[Math.min(indexOf(step) + 1, STEPS.length - 1)] ?? 'summary';
}

export function stepBefore(step: StepId): StepId {
  return STEPS[Math.max(indexOf(step) - 1, 0)] ?? 'welcome';
}

/** "Tobira 第4課" → "Tobira" and "第4課": the textbook is all before the last space. */
export function splitLesson(tag: string | undefined): { textbook: string; lesson: string } {
  const text = tag?.trim() ?? '';
  const at = text.lastIndexOf(' ');
  if (at < 0) return { textbook: '', lesson: text };
  return { textbook: text.slice(0, at).trim(), lesson: text.slice(at + 1) };
}

/** "Tobira" and "第4課" → "Tobira 第4課", the current lesson tag (K5). */
export function joinLesson(textbook: string, lesson: string): string {
  return [textbook.trim(), lesson.trim()].filter(Boolean).join(' ');
}
