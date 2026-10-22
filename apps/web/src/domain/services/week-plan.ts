/**
 * Next week's plan (A7), proposed from this week's real mistakes. The mix it returns is what
 * `buildSession` reads once the plan is accepted, so "the plan changes from real mistakes" is a
 * property of this function, not of any AI wording.
 */
import type { Repos } from '../repos.ts';
import type { ErrorType, PlanLine, SessionMix, WeeklyPlan } from '../types.ts';
import { nextWeekId, rankedErrorTypes, type WeekReport, weekBounds } from './week-stats.ts';

/** Share of sentences given to the week's main slip when it is one the selector can find. */
export const FOCUS_SHARE = 0.25;
/** Error types the session selector can find in a reading (long vowels, っ, voicing). */
export const FOCUSABLE: readonly ErrorType[] = ['long-vowel', 'sokuon', 'rendaku'];
/** Daily minutes when there is nothing to go on. */
export const DEFAULT_MINUTES = 15;
export const MIN_MINUTES = 10;
export const MAX_MINUTES = 30;
/** Most of a session given to drills (R8); the drills workstream reads `mix.drillShare`. */
export const PLAN_MAX_DRILL_SHARE = 0.3;

/** Fewer misses than this of one type is noise, not a pattern. */
const MIN_PATTERN = 2;
const MAX_PLAN_GRAMMAR = 2;

export interface ProposedPlan {
  lines: PlanLine[];
  mix: SessionMix;
}

const FOCUS_PHRASE: Partial<Record<ErrorType, string>> = {
  'long-vowel': 'has a long vowel',
  sokuon: 'has a small っ',
  rendaku: 'has a voicing change',
};

/** Minutes rounded to 5 and clamped to 10–30. */
export function clampMinutes(minutes: number): number {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(minutes / 5) * 5));
}

function focusFor(report: WeekReport): SessionMix['focusErrorTypes'] {
  const { byErrorType } = report.stats;
  const type = rankedErrorTypes(byErrorType).find(
    (t) => FOCUSABLE.includes(t) && (byErrorType[t] ?? 0) >= MIN_PATTERN,
  );
  return type ? { [type]: FOCUS_SHARE } : {};
}

/** 0.05 per lookalike swap this week, at most 0.3: drills where the kanji were confused. */
function drillShareFor(report: WeekReport): number {
  const swaps = report.stats.byErrorType['wrong-kanji'] ?? 0;
  return (Math.min(swaps, PLAN_MAX_DRILL_SHARE * 20) * 5) / 100;
}

function mixFor(report: WeekReport, previous: SessionMix | undefined): SessionMix {
  const grammarIds = report.unusedGrammarIds.slice(0, MAX_PLAN_GRAMMAR);
  if (report.activeDays === 0) {
    const kept = previous ?? { focusErrorTypes: {}, drillShare: 0 };
    return {
      dailyMinutes: previous?.dailyMinutes ?? DEFAULT_MINUTES,
      focusErrorTypes: { ...kept.focusErrorTypes },
      grammarIds,
      drillShare: kept.drillShare,
    };
  }
  return {
    dailyMinutes: clampMinutes(report.minutesPerDay),
    focusErrorTypes: focusFor(report),
    grammarIds,
    drillShare: drillShareFor(report),
  };
}

/**
 * A plan line as data, for the UI to word in the learner's language (N7b): reading time with its
 * focus slips, lookalike drills per 20 cards, or one or two grammar points to write with.
 */
export type PlanSpec =
  | { kind: 'reading'; minutes: number; focus: ErrorType[] }
  | { kind: 'drills'; cards: number }
  | { kind: 'grammar'; patterns: string[] };

function readingSpec(mix: SessionMix): PlanSpec {
  const focus = FOCUSABLE.filter((t) => (mix.focusErrorTypes[t] ?? 0) > 0);
  return { kind: 'reading', minutes: mix.dailyMinutes, focus };
}

/** The structured lines of a mix: reading time and focus, drills, grammar to write. */
export function planSpecs(mix: SessionMix, report: WeekReport): PlanSpec[] {
  const specs = [readingSpec(mix)];
  if (mix.drillShare > 0) specs.push({ kind: 'drills', cards: Math.round(mix.drillShare * 20) });
  const patterns = report.stats.unusedGrammar.slice(0, mix.grammarIds.length);
  if (patterns.length > 0) specs.push({ kind: 'grammar', patterns: patterns.slice(0, 2) });
  return specs;
}

function grammarLine([first, second]: readonly string[]): PlanLine {
  return second === undefined
    ? { when: 'Tue', what: `Write one sentence with ${first}.` }
    : { when: 'Tue, Thu', what: `Write one sentence each with ${first} and ${second}.` };
}

/** A spec in English, the base wording saved with plans made before the UI was localized. */
function englishLine(spec: PlanSpec): PlanLine {
  if (spec.kind === 'grammar') return grammarLine(spec.patterns);
  if (spec.kind === 'drills') {
    const cards = `${spec.cards} ${spec.cards === 1 ? 'card' : 'cards'}`;
    return {
      when: 'Daily',
      what: `Lookalike kanji drills, about ${cards} in 20, for the kanji you mixed up.`,
    };
  }
  const focus = spec.focus.map((t) => ` One in four sentences ${FOCUS_PHRASE[t]}.`).join('');
  return { when: 'Daily', what: `${spec.minutes} minutes of reading.${focus}` };
}

/** The plan lines that describe a mix, in English (`planSpecs` for the UI's own wording). */
export function planLines(mix: SessionMix, report: WeekReport): PlanLine[] {
  return planSpecs(mix, report).map(englishLine);
}

/**
 * Proposes next week's plan from this week's report (A7). Deterministic:
 * - daily minutes follow this week's reading per active day, rounded to 5, clamped 10–30;
 * - the most frequent slip the selector can find (long vowel, っ, voicing; at least 2 misses)
 *   gets one sentence in four;
 * - lookalike swaps (`wrong-kanji`) raise `drillShare` by 0.05 each, up to 0.3;
 * - up to two unused grammar points of the lesson are preferred in sessions and written Tue, Thu.
 * An empty week keeps the previous mix's minutes, focus and drills (nothing new to go on).
 */
export function proposePlan(report: WeekReport, previous?: SessionMix): ProposedPlan {
  const mix = mixFor(report, previous);
  return { mix, lines: planLines(mix, report) };
}

/** The accepted mix sessions use this week (what `buildSession` reads), if any. */
export async function currentMix(repos: Repos, now: number): Promise<SessionMix | undefined> {
  const plan = await repos.plans.get(weekBounds(now).week);
  return plan?.status === 'accepted' ? plan.mix : undefined;
}

/** The plan already saved for next week, if any. */
export function nextWeekPlan(repos: Repos, now: number): Promise<WeeklyPlan | undefined> {
  return repos.plans.get(nextWeekId(now));
}

/** This week's plan, accepted or not, if any (IA6: Today shows it). */
export function thisWeekPlan(repos: Repos, now: number): Promise<WeeklyPlan | undefined> {
  return repos.plans.get(weekBounds(now).week);
}

export interface AcceptPlanInput {
  now: number;
  letter: string[];
  lines: PlanLine[];
  mix: SessionMix;
  /** Save it for this week, so sessions follow it at once (IA6, Today's "Change"). */
  thisWeek?: boolean;
}

/**
 * Saves the plan as accepted for next week's ISO week (or this week's, with `thisWeek`):
 * `buildSession` looks up the plan of the week it runs in, so sessions follow it from then.
 */
export async function acceptPlan(repos: Repos, input: AcceptPlanInput): Promise<WeeklyPlan> {
  const plan: WeeklyPlan = {
    id: input.thisWeek ? weekBounds(input.now).week : nextWeekId(input.now),
    createdAt: input.now,
    letter: [...input.letter],
    lines: input.lines.map((line) => ({ ...line })),
    mix: structuredClone(input.mix),
    status: 'accepted',
  };
  await repos.plans.put(plan);
  return plan;
}
