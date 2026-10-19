/**
 * What the Start button plays (IA3): one press starts the next round. The choice made on Today
 * (IA2) decides; the daily mix plays the next unit lesson part first when one is due. The pure
 * resolver is `resolveStart`; `startPlan` reads its input from the `Repos` port.
 */
import type { Repos } from '../repos.ts';
import type {
  KanjiReading,
  LessonSection,
  PracticeChoice,
  Settings,
  UnitProgress,
} from '../types.ts';
import { nextPart } from './lesson-sections.ts';
import type { SessionFocus } from './session-pool.ts';
import { type UnitView, unitPath } from './units.ts';

/** The round Start begins. */
export type StartPlan =
  | { kind: 'mix' }
  | { kind: 'lesson'; unit: string; section: LessonSection; part: number }
  | { kind: 'reading' }
  | { kind: 'grammar'; grammar?: string }
  | { kind: 'kanji'; focus?: SessionFocus };

/** The next lesson part of the path's current unit, and whether it is due. */
export interface NextLesson {
  unit: string;
  section: LessonSection;
  part: number;
  /** No lesson part was finished today: the daily mix plays this part first. */
  due: boolean;
}

export interface StartInput {
  choice: PracticeChoice;
  lesson?: NextLesson | undefined;
  /** The grammar point to practise: the current unit's first not yet known. */
  grammar?: string | undefined;
  /** The kanji reading to practise: one still being learned. */
  kanji?: SessionFocus | undefined;
}

function lessonPlan({ unit, section, part }: NextLesson): StartPlan {
  return { kind: 'lesson', unit, section, part };
}

const PLANS: Record<Exclude<PracticeChoice, 'mix' | 'lesson'>, (input: StartInput) => StartPlan> = {
  reading: () => ({ kind: 'reading' }),
  grammar: ({ grammar }) => (grammar ? { kind: 'grammar', grammar } : { kind: 'grammar' }),
  kanji: ({ kanji }) => (kanji ? { kind: 'kanji', focus: kanji } : { kind: 'kanji' }),
};

/**
 * Start's round for a choice (IA3). Next lesson plays the next part, or the mix when there is
 * none; the daily mix plays the next part first when it is due. Grammar and kanji without a
 * point or reading to focus on are a session with more drills.
 */
export function resolveStart(input: StartInput): StartPlan {
  const { choice, lesson } = input;
  if (choice === 'mix' || choice === 'lesson') {
    const play = lesson && (choice === 'lesson' || lesson.due);
    return play ? lessonPlan(lesson) : { kind: 'mix' };
  }
  return PLANS[choice](input);
}

/** Local midnight of the day containing `at`. */
function dayStart(at: number): number {
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** The latest lesson part finished in any unit (S3), or 0. */
export function lastPartAt(status: Readonly<Record<string, UnitProgress>>): number {
  const sections = Object.values(status).flatMap((unit) => Object.values(unit.sections ?? {}));
  return Math.max(0, ...sections.flatMap((s) => (s?.at !== undefined && s.done > 0 ? [s.at] : [])));
}

/**
 * The next part of the unit's current section. It is due unless a lesson part was finished
 * today (`lastAt`), so the daily mix plays one lesson part a day first.
 */
export function nextLesson(
  unit: UnitView | undefined,
  now: number,
  lastAt: number,
): NextLesson | undefined {
  if (!unit || unit.step === 'done') return undefined;
  const part = nextPart(unit.progress.sections?.[unit.step]);
  return { unit: unit.unit.id, section: unit.step, part, due: lastAt < dayStart(now) };
}

/** The current unit of the path, unless the learner follows a class lesson (T3). */
async function pathUnit(repos: Repos, settings: Settings, now: number) {
  return settings.currentLesson === undefined ? (await unitPath(repos, now)).current : undefined;
}

async function unitGrammar(repos: Repos, unit: UnitView | undefined): Promise<string | undefined> {
  const ids = unit?.unit.grammar ?? [];
  const items = await repos.items.getMany(ids.map((id) => `grammar:${id}` as const));
  return ids.find((_, i) => (items[i]?.level ?? 0) < 3) ?? ids[0];
}

/** A reading still being learned (level 1 or 2), the one with the most words to read it in. */
export function learningReading(rows: readonly KanjiReading[]): SessionFocus | undefined {
  const learning = rows.filter((r) => r.level > 0 && r.level < 3 && r.wordIds.length > 0);
  const [best] = learning.sort(
    (a, b) => b.wordIds.length - a.wordIds.length || a.id.localeCompare(b.id),
  );
  return best ? { kanji: best.kanji, reading: best.reading } : undefined;
}

/** The input of `resolveStart` for a choice, read from storage. */
async function startInput(repos: Repos, now: number, choice: PracticeChoice) {
  const settings = await repos.settings.get();
  const unit = await pathUnit(repos, settings, now);
  const lastAt = lastPartAt(settings.unitStatus ?? {});
  const input: StartInput = { choice, lesson: nextLesson(unit, now, lastAt) };
  if (choice === 'grammar') input.grammar = await unitGrammar(repos, unit);
  if (choice === 'kanji') input.kanji = learningReading(await repos.kanjiReadings.all());
  return input;
}

/** What Start plays now (IA3), for the choice saved on Today or the one given. */
export async function startPlan(
  repos: Repos,
  now: number,
  choice?: PracticeChoice,
): Promise<StartPlan> {
  const chosen = choice ?? (await repos.settings.get()).practice ?? 'mix';
  return resolveStart(await startInput(repos, now, chosen));
}

/** Saves the choice on Today (IA2); Start follows it from then on. */
export async function choosePractice(repos: Repos, choice: PracticeChoice): Promise<void> {
  await repos.settings.patch({ practice: choice });
}
