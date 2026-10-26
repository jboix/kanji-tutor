/**
 * The lesson path over the `Repos` port (T3, T4, V1): unit states, the stored progress per
 * unit, and the words, sentences and grammar a session takes from the active lesson.
 */
import type { Repos } from '../repos.ts';
import { UNITS } from '../themes/index.ts';
import type {
  ItemId,
  LearnerLevel,
  LessonSection,
  Settings,
  UnitProgress,
  Word,
} from '../types.ts';
import { learnerLevelOf } from './learner-level.ts';
import { currentSection, finishPart, nextPart } from './lesson-sections.ts';
import { sharedResult } from './read-cache.ts';
import { newlyDone, type PathInput, type UnitView, unitPathOf } from './unit-path.ts';

export type { UnitCounts, UnitState, UnitStep, UnitView } from './unit-path.ts';

/** The path, the learner's level and the current unit (T4). */
export interface UnitPath {
  level: LearnerLevel;
  units: UnitView[];
  current?: UnitView;
}

async function grammarRight(repos: Repos, ids: readonly string[]): Promise<Set<string>> {
  const keys = [...new Set(ids)].map((id): ItemId => `grammar:${id}`);
  const reviews = await repos.reviews.byItems(keys);
  const right = reviews.filter((r) => r.verdict === 'correct');
  return new Set(right.map((r) => r.itemId.slice('grammar:'.length)));
}

/**
 * What the path is built from. Today's steps each ask for the path side by side; over a shared
 * view (`sharedReads`) it is read once for all of them.
 */
function pathInput(repos: Repos, settings: Settings): Promise<PathInput> {
  return sharedResult(repos, 'unit-path-input', () => readPathInput(repos, settings));
}

async function readPathInput(repos: Repos, settings: Settings): Promise<PathInput> {
  const packs = new Map((await repos.units.all()).map((pack) => [pack.id, pack]));
  const status = settings.unitStatus ?? {};
  const ids = [...packs.values()].flatMap((pack) => pack.wordIds);
  const entries = (await repos.dictionary.words(ids)).flatMap((w): [string, Word][] =>
    w ? [[w.id, w]] : [],
  );
  const items = await repos.items.byKind('word');
  const pending = UNITS.filter((u) => status[u.id]?.doneAt === undefined).flatMap((u) => u.grammar);
  return {
    level: learnerLevelOf(settings),
    units: UNITS,
    packs,
    words: new Map(entries),
    levels: new Map(items.map((item) => [item.ref, item.level])),
    grammarRight: await grammarRight(repos, pending),
    status,
    activeUnit: settings.activeUnit,
  };
}

/** Stores a patch to one unit's progress. */
async function patchUnit(repos: Repos, id: string, patch: UnitProgress): Promise<void> {
  const { unitStatus = {} } = await repos.settings.get();
  await repos.settings.patch({
    unitStatus: { ...unitStatus, [id]: { ...unitStatus[id], ...patch } },
  });
}

/** Stores these units as done, in one write. */
async function markDone(repos: Repos, views: readonly UnitView[], now: number): Promise<void> {
  if (views.length === 0) return;
  const { unitStatus = {} } = await repos.settings.get();
  const next = { ...unitStatus };
  for (const { unit } of views) next[unit.id] = { ...next[unit.id], doneAt: now };
  await repos.settings.patch({ unitStatus: next });
}

/**
 * Every unit with its state, step and counts, in path order (T4). A unit that now meets the done
 * rule is stored as done, so it stays done when a word lapses later. Over a shared view, callers
 * side by side share one path, and so one write.
 */
export function unitPath(repos: Repos, now: number): Promise<UnitPath> {
  return sharedResult(repos, `unit-path:${now}`, () => storedUnitPath(repos, now));
}

async function storedUnitPath(repos: Repos, now: number): Promise<UnitPath> {
  const settings = await repos.settings.get();
  const input = await pathInput(repos, settings);
  const path = unitPathOf(input);
  await markDone(repos, newlyDone(path.units), now);
  return { level: input.level, ...path };
}

/** The current unit (T4), read only: unlike `unitPath`, nothing is stored (A10's tools only read). */
export async function currentUnitView(repos: Repos): Promise<UnitView | undefined> {
  const settings = await repos.settings.get();
  return unitPathOf(await pathInput(repos, settings)).current;
}

/** One unit's view, or undefined for an unknown id. */
export async function unitView(repos: Repos, id: string, now: number) {
  return (await unitPath(repos, now)).units.find((view) => view.unit.id === id);
}

/** Opens a unit (T3): its Introduce step is done and it is the active lesson until done. */
export async function startUnit(repos: Repos, id: string, now: number): Promise<void> {
  const { unitStatus = {} } = await repos.settings.get();
  const introducedAt = unitStatus[id]?.introducedAt ?? now;
  await patchUnit(repos, id, { introducedAt });
  await repos.settings.patch({ activeUnit: id });
}

/** The unit's passage was read (the Read step). */
export function markUnitRead(repos: Repos, id: string, now: number): Promise<void> {
  return patchUnit(repos, id, { readAt: now });
}

/** A review unit below the learner's level, marked done (`skip` false) or skipped. */
export function markUnitDone(repos: Repos, id: string, now: number, skip = false) {
  return patchUnit(repos, id, skip ? { skippedAt: now } : { doneAt: now });
}

/**
 * A lesson section is started (S3): the unit is opened and becomes the active lesson, and the
 * section keeps its part count, with the parts already done.
 */
export async function startLessonSection(
  repos: Repos,
  id: string,
  section: LessonSection,
  parts: number,
  now: number,
): Promise<void> {
  await startUnit(repos, id, now);
  const { unitStatus = {} } = await repos.settings.get();
  const sections = unitStatus[id]?.sections ?? {};
  const done = Math.min(sections[section]?.done ?? 0, parts);
  await patchUnit(repos, id, {
    sections: { ...sections, [section]: { ...sections[section], parts, done } },
  });
}

/** A part of a lesson section is finished (S3); finishing 読み物 is the Read step too. */
export async function finishLessonPart(
  repos: Repos,
  id: string,
  section: LessonSection,
  part: number,
  now: number,
): Promise<void> {
  const { unitStatus = {} } = await repos.settings.get();
  const sections = unitStatus[id]?.sections ?? {};
  const progress = sections[section];
  const next = finishPart(progress, part, progress?.parts ?? part, now);
  const read = section === 'reading' ? { readAt: unitStatus[id]?.readAt ?? now } : {};
  await patchUnit(repos, id, { ...read, sections: { ...sections, [section]: next } });
}

/** Where a unit lesson goes on: the first section not done and its next part (S3). */
export async function lessonNext(
  repos: Repos,
  id: string,
): Promise<{ section: LessonSection; part: number } | undefined> {
  const progress = (await repos.settings.get()).unitStatus?.[id] ?? {};
  const section = currentSection(progress);
  return section && { section, part: nextPart(progress.sections?.[section]) };
}
