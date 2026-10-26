/**
 * The Today screen's numbers (R1): the session ahead, this week's class progress, the lookalike
 * pair most often swapped, and one plain trainer note built from the week's mistakes, no AI.
 */
import { isoWeek } from '../ids.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { ErrorType, GrammarPoint, Item, Review, SourceKind } from '../types.ts';
import { swappedPair } from './confusables.ts';
import { DAY_MS } from './items.ts';
import { type LastTime, lastTime } from './last-time.ts';
import { type LevelUp, levelUpSuggestion } from './level-up.ts';
import { buildSession } from './session.ts';
import { sessionOutline } from './session-outline.ts';
import { type UnitView, unitPath } from './units.ts';

/** Done out of total, e.g. 19 of 28. */
export interface Count {
  done: number;
  total: number;
}

/** The most frequent slip this week, with its latest example (しょ for しょう). */
export interface TrainerNote {
  /** Undefined when nothing was missed this week. */
  errorType?: ErrorType;
  /** Misses of that type, and all answers this week. */
  count: number;
  answers: number;
  example?: { given: string; expected: string };
}

export interface ClassProgress {
  /** The current lesson tag, or undefined when the week stands in for it. */
  lesson?: string;
  /** Lesson words read correctly in a sentence new to them (level 4), out of all lesson words. */
  words: Count;
  /** Lesson grammar points used in an accepted sentence of your own, out of all of them. */
  grammar: Count;
  /** The first lesson grammar point not used yet, for "Write one sentence with 〜…". */
  nextGrammar?: GrammarPoint;
}

/** What Today shows before its session is known (N10): everything but the session. */
export interface TodayOverview {
  progress: ClassProgress;
  lookalike?: { pair: [string, string]; times: number };
  note?: TrainerNote;
  /** Word items tracked at all; 0 means a brand-new learner. */
  trackedWords: number;
  /** The current unit of the lesson path, when there is no class lesson (T3). */
  unit?: UnitView;
  /** "You know 82% of N5. Move to N4?" (P4), when due. */
  levelUp?: LevelUp;
  /** The latest day of practice this week (IA2): "Last time, yesterday: 9 sentences…". */
  lastTime?: LastTime;
}

/** The session ahead (R1), built after the overview and handed on to Begin reading (N10). */
export interface TodaySession {
  cards: SessionCard[];
  /** The session's rough minutes (R13, L6), from the same estimate as its progress panel. */
  minutes: number;
  /** Cards whose targets are still new to the learner (level below 3). */
  newReadings: number;
}

export interface TodaySummary extends TodayOverview, TodaySession {}

const WEEK_MS = 7 * DAY_MS;

function isNew(card: SessionCard, levels: ReadonlyMap<string, number>): boolean {
  return card.targets.some((t) => (levels.get(t.wordId) ?? 0) < 3);
}

async function lessonItems(repos: Repos, lesson: string | undefined, now: number) {
  return lesson ? repos.items.byLesson(lesson) : repos.items.byWeek(isoWeek(new Date(now)));
}

function grammarUsed(point: GrammarPoint, items: ReadonlyMap<string, Item>): boolean {
  const item = items.get(`grammar:${point.id}`);
  return item !== undefined && (item.source.kind === 'compose' || item.level >= 3);
}

/** Sources that are not class work: imported known words and words met in sessions. */
const NOT_CLASS: ReadonlySet<SourceKind> = new Set(['import', 'session']);

async function classProgress(repos: Repos, now: number): Promise<ClassProgress> {
  const { currentLesson } = await repos.settings.get();
  const lessonWords = (await lessonItems(repos, currentLesson, now)).filter(
    (i) => i.kind === 'word' && !NOT_CLASS.has(i.source.kind),
  );
  const grammarItems = new Map(
    (await repos.items.byKind('grammar')).map((i) => [i.id, i] as const),
  );
  // Catalogue points from the packs count once the learner is learning them.
  const points = (await repos.grammar.all()).filter(
    (p) =>
      (currentLesson === undefined || p.lesson === currentLesson) &&
      (!p.catalogue || grammarItems.has(`grammar:${p.id}`)),
  );
  const used = points.filter((p) => grammarUsed(p, grammarItems));
  const progress: ClassProgress = {
    words: { done: lessonWords.filter((i) => i.level >= 4).length, total: lessonWords.length },
    grammar: { done: used.length, total: points.length },
  };
  const next = points.find((p) => !grammarUsed(p, grammarItems));
  if (currentLesson !== undefined) progress.lesson = currentLesson;
  if (next) progress.nextGrammar = next;
  return progress;
}

/** Slips that count for the note; kana variants are correct answers. */
const MISSES: readonly ErrorType[] = ['long-vowel', 'sokuon', 'rendaku', 'wrong-kanji', 'other'];

function topMiss(reviews: readonly Review[]): [ErrorType, Review[]] | undefined {
  const byType = new Map<ErrorType, Review[]>();
  for (const review of reviews) {
    if (review.verdict === 'correct' || !review.errorType) continue;
    byType.set(review.errorType, [...(byType.get(review.errorType) ?? []), review]);
  }
  const ranked = MISSES.flatMap((type) => {
    const list = byType.get(type);
    return list ? [[type, list] as [ErrorType, Review[]]] : [];
  });
  return ranked.sort((a, b) => b[1].length - a[1].length)[0];
}

/** One factual note on the week's most frequent slip (R1), or undefined with no answers. */
export function trainerNote(reviews: readonly Review[]): TrainerNote | undefined {
  if (reviews.length === 0) return undefined;
  const top = topMiss(reviews);
  if (!top) return { count: 0, answers: reviews.length };
  const [errorType, list] = top;
  const latest = list.reduce((a, b) => (b.at > a.at ? b : a));
  return {
    errorType,
    count: list.length,
    answers: reviews.length,
    example: { given: latest.answer, expected: latest.expected },
  };
}

/** The lookalike pair swapped most often in these reviews (待 持 · 4 times). */
export async function topLookalike(
  repos: Repos,
  reviews: readonly Review[],
): Promise<TodaySummary['lookalike']> {
  const swaps = await Promise.all(
    reviews
      .filter((r) => r.errorType === 'wrong-kanji')
      .map(async (r) => (await swappedPair(repos, r))?.join('')),
  );
  const counts = new Map<string, number>();
  for (const pair of swaps) if (pair) counts.set(pair, (counts.get(pair) ?? 0) + 1);
  const [pair, times] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
  const [a, b] = [...(pair ?? '')];
  return a && b && times ? { pair: [a, b], times } : undefined;
}

/** The current unit of the path, when there is no class lesson (T3). */
async function currentUnit(repos: Repos, now: number): Promise<UnitView | undefined> {
  const { currentLesson } = await repos.settings.get();
  return currentLesson === undefined ? (await unitPath(repos, now)).current : undefined;
}

/**
 * Everything on Today but the session (R1, N10). Its steps read different stores, so they run
 * side by side, and none of them builds the session.
 */
export async function todayOverview(repos: Repos, now: number): Promise<TodayOverview> {
  const [words, reviews, progress, unit, levelUp] = await Promise.all([
    repos.items.byKind('word'),
    repos.reviews.since(now - WEEK_MS),
    classProgress(repos, now),
    currentUnit(repos, now),
    levelUpSuggestion(repos, now),
  ]);
  const overview: TodayOverview = { progress, trackedWords: words.length };
  const note = trainerNote(reviews);
  const lookalike = await topLookalike(repos, reviews);
  const last = lastTime(reviews, now);
  if (last) overview.lastTime = last;
  if (note) overview.note = note;
  if (lookalike) overview.lookalike = lookalike;
  if (unit) overview.unit = unit;
  if (levelUp) overview.levelUp = levelUp;
  return overview;
}

/**
 * Today's session (R1): the one the Read screen would build, so the first sentence previewed is
 * the first one read. Today shows it once built and hands it on to Begin reading (N10).
 */
export async function todaySession(
  repos: Repos,
  now: number,
  listening: boolean | Promise<boolean> = false,
): Promise<TodaySession> {
  const [cards, words] = await Promise.all([
    buildSession(repos, { now, listening }),
    repos.items.byKind('word'),
  ]);
  const levels = new Map(words.map((item) => [item.ref, item.level]));
  return {
    cards,
    minutes: sessionOutline(cards, 0).minutes,
    newReadings: cards.filter((card) => isNew(card, levels)).length,
  };
}

/** Everything the Today screen shows (R1): the overview and the session, built side by side. */
export async function todaySummary(repos: Repos, now: number): Promise<TodaySummary> {
  const [overview, session] = await Promise.all([
    todayOverview(repos, now),
    todaySession(repos, now),
  ]);
  return { ...overview, ...session };
}
