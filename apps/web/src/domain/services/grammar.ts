/**
 * Grammar points for Use it (A6): which one to write with next, its place in the lesson, and a
 * manual add for learners with none yet (K1, K5).
 */
import { isoWeek, itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import { newCard } from '../scheduler.ts';
import type { GrammarPoint, Item, Source } from '../types.ts';

/** The grammar point to write with, and where it sits among its lesson's points. */
export interface ComposeTarget {
  grammar: GrammarPoint;
  /** 1-based position in `points`, e.g. 3 of 6. */
  position: number;
  total: number;
}

/**
 * True when the learner has used this grammar point in an accepted sentence of their own: the
 * same rule as Today's "Grammar you've used yourself" (a compose source or level ≥ 3).
 */
export function isGrammarUsed(item: Item | undefined): boolean {
  return item !== undefined && (item.source.kind === 'compose' || item.level >= 3);
}

/**
 * The learner's grammar points: those they added, and catalogue points (installed with the packs)
 * once they have an item, i.e. once they are learning them.
 */
async function learnerGrammar(repos: Repos): Promise<GrammarPoint[]> {
  const tracked = new Set((await repos.items.byKind('grammar')).map((item) => item.ref));
  return (await repos.grammar.all()).filter((p) => !p.catalogue || tracked.has(p.id));
}

/** The current lesson's grammar points in stored order, or every point when it has none. */
export async function lessonGrammar(repos: Repos): Promise<GrammarPoint[]> {
  const { currentLesson } = await repos.settings.get();
  const all = await learnerGrammar(repos);
  if (currentLesson === undefined) return all;
  const lesson = all.filter((point) => point.lesson === currentLesson);
  return lesson.length > 0 ? lesson : all;
}

function siblings(all: readonly GrammarPoint[], point: GrammarPoint): GrammarPoint[] {
  return point.lesson === undefined ? [...all] : all.filter((p) => p.lesson === point.lesson);
}

async function pick(repos: Repos, grammarId: string | undefined) {
  const chosen = grammarId === undefined ? undefined : await repos.grammar.get(grammarId);
  if (chosen) {
    const points = siblings(await learnerGrammar(repos), chosen);
    return {
      point: chosen,
      points: points.some((p) => p.id === chosen.id) ? points : [chosen, ...points],
    };
  }
  const points = await lessonGrammar(repos);
  const items = await repos.items.getMany(points.map((p) => itemId('grammar', p.id)));
  const next = points.find((_, i) => !isGrammarUsed(items[i])) ?? points[0];
  return next ? { point: next, points } : undefined;
}

/**
 * The grammar point Use it asks for: `grammarId` when it exists, else the first point of the
 * current lesson not used yet (what Today links to), else the lesson's first point. Undefined
 * when the learner has no grammar points at all.
 */
export async function composeTarget(
  repos: Repos,
  grammarId?: string,
): Promise<ComposeTarget | undefined> {
  const found = await pick(repos, grammarId);
  if (!found) return undefined;
  const position = found.points.findIndex((p) => p.id === found.point.id) + 1;
  return { grammar: found.point, position, total: found.points.length };
}

/**
 * After a sentence with `grammarId` is saved: the next point among its siblings not used yet,
 * going round from the one just written. Undefined when every other point is used.
 */
export async function nextComposeTarget(
  repos: Repos,
  grammarId: string,
): Promise<ComposeTarget | undefined> {
  const found = await pick(repos, grammarId);
  if (!found) return undefined;
  const { points } = found;
  const at = points.findIndex((p) => p.id === grammarId);
  const round = [...points.slice(at + 1), ...points.slice(0, Math.max(at, 0))];
  const items = await repos.items.getMany(round.map((p) => itemId('grammar', p.id)));
  const next = round.find((_, i) => !isGrammarUsed(items[i]));
  if (!next) return undefined;
  return { grammar: next, position: points.indexOf(next) + 1, total: points.length };
}

/** What a learner types to add a grammar point by hand. */
export interface AddGrammarInput {
  pattern: string;
  meaning: string;
  /** Lesson tag; defaults to `settings.currentLesson`. Empty means none. */
  lesson?: string;
  now: number;
}

/** A stable id from the pattern: the pattern without the leading 〜 or ~ and spaces. */
export function grammarIdFor(pattern: string): string {
  return pattern.replace(/\s+/g, '').replace(/^[〜~～]+/, '');
}

function grammarItem(point: GrammarPoint, now: number): Item {
  const source: Source = { kind: 'manual', week: isoWeek(new Date(now)), addedAt: now };
  if (point.lesson !== undefined) source.lesson = point.lesson;
  return {
    id: itemId('grammar', point.id),
    kind: 'grammar',
    ref: point.id,
    level: 1,
    card: newCard(now),
    source,
    updatedAt: now,
  };
}

/**
 * Saves a grammar point the learner typed, with its item at level 1 (seen) and a fresh FSRS
 * card, sourced as a manual add tagged to the lesson (K1, K5). A pattern that already exists
 * is returned unchanged.
 */
export async function addGrammarPoint(repos: Repos, input: AddGrammarInput): Promise<GrammarPoint> {
  const pattern = input.pattern.trim();
  const id = grammarIdFor(pattern);
  if (id === '') throw new Error('A grammar point needs a pattern.');
  const existing = await repos.grammar.get(id);
  if (existing) return existing;
  const lesson = (input.lesson ?? (await repos.settings.get()).currentLesson ?? '').trim();
  const point: GrammarPoint = {
    id,
    pattern,
    meaning: input.meaning.trim(),
    exampleSentenceIds: [],
  };
  if (lesson !== '') point.lesson = lesson;
  await repos.grammar.put(point);
  await repos.items.put(grammarItem(point, input.now));
  return point;
}
