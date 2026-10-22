/**
 * What the session end shows of the session: its three counts, what to look at again, the
 * retry round of only those, its length, and what it met first. Pure, apart from the types.
 */
import type { MetFirst, MetFirstInput } from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { Answered, DrillResult } from './session-state.ts';

/** A reading answered not quite right, or an exercise not right, with the card it was on. */
export type Missed =
  | { kind: 'reading'; card: SessionCard; index: number; answered: Answered }
  | { kind: 'exercise'; card: SessionCard; index: number; result: DrillResult };

export interface SessionTally {
  cards: readonly SessionCard[];
  results: readonly Answered[];
  drills: readonly DrillResult[];
}

/** The card an answer was given on; answers saved by older versions carry no index. */
function withCard<T extends { card?: number }>(cards: readonly SessionCard[], entry: T) {
  const index = entry.card;
  const card = index === undefined ? undefined : cards[index];
  return card && index !== undefined ? { card, index } : undefined;
}

/** Everything to look at again, in session order: near-misses, misses, skips, missed exercises. */
export function missedOf({ cards, results, drills }: SessionTally): Missed[] {
  const readings = results.flatMap((answered): Missed[] => {
    const at = answered.grade.verdict === 'correct' ? undefined : withCard(cards, answered);
    return at ? [{ kind: 'reading', ...at, answered }] : [];
  });
  const exercises = drills.flatMap((result): Missed[] => {
    const at = result.right ? undefined : withCard(cards, result);
    return at ? [{ kind: 'exercise', ...at, result }] : [];
  });
  return [...readings, ...exercises].sort((a, b) => a.index - b.index);
}

/** A reading card cut to its missed targets, and no longer new (its intro was given). */
function retryReading(card: SessionCard, misses: readonly Missed[]): SessionCard {
  const missedTokens = new Set(
    misses.flatMap((m) => (m.kind === 'reading' ? [m.answered.target.tokenIndex] : [])),
  );
  const targets = card.targets.filter((target) => missedTokens.has(target.tokenIndex));
  const { newGrammar: _, ...rest } = card;
  return { ...rest, targets, reason: card.reason === 'drill' ? 'drill' : 'due' };
}

/** The retry round: only the missed sentences and exercises, once each, in order. */
export function retryCards(missed: readonly Missed[]): SessionCard[] {
  const indices = [...new Set(missed.map((m) => m.index))];
  return indices.flatMap((index) => {
    const misses = missed.filter((m) => m.index === index);
    const card = misses[0]?.card;
    if (!card || card.grammarIntro) return [];
    const retry = retryReading(card, misses);
    return retry.targets.length > 0 || card.reason === 'drill' ? [retry] : [];
  });
}

/** What the first count names: sentences, exercises, or both. */
export type CountLabel = 'sentences' | 'exercises' | 'both';

export interface EndCounts {
  label: CountLabel;
  done: number;
  right: number;
  again: number;
}

/**
 * The three counts: the sentences (and exercises) done, the answers right, and the ones to
 * look at again. Near-misses are to look at again; an exercise counts once, as one answer.
 */
export function endCounts(sentences: number, tally: SessionTally): EndCounts {
  const { results, drills } = tally;
  const right =
    results.filter((a) => a.grade.verdict === 'correct').length +
    drills.filter((d) => d.right).length;
  const again = results.length + drills.length - right;
  const label: CountLabel =
    drills.length === 0 ? 'sentences' : sentences === 0 ? 'exercises' : 'both';
  return { label, done: sentences + drills.length, right, again };
}

const MINUTE = 60_000;

/** Rough length when the real one is unknown or a resumed session stretched it. */
export function sessionMinutes(startedAt: number | undefined, now: number, estimate: number) {
  const elapsed = startedAt === undefined ? Number.NaN : now - startedAt;
  const minutes = elapsed >= 0 && elapsed <= 60 * MINUTE ? elapsed / MINUTE : estimate / 60;
  return Math.max(1, Math.round(minutes));
}

/** The words read and grammar points met in the session, for "New today". */
export function metInput(tally: SessionTally, since: number): MetFirstInput {
  const wordIds = tally.results.map((a) => a.target.wordId);
  const grammarIds = tally.cards.flatMap((card) => [
    ...(card.grammarIntro ? [card.grammarIntro] : []),
    ...(card.newGrammar ?? []),
  ]);
  return { wordIds, grammarIds, since };
}

/** The "New today" cards: one of each kind first, up to `max`, and the rest for a line. */
export function splitMet(met: readonly MetFirst[], max = 3) {
  const firsts = (['kanji', 'word', 'grammar'] as const).flatMap((kind) => {
    const first = met.find((m) => m.kind === kind);
    return first ? [first] : [];
  });
  const picked = new Set(firsts.slice(0, max));
  for (const m of met) if (picked.size < max) picked.add(m);
  const shown = met.filter((m) => picked.has(m));
  return { shown, rest: met.filter((m) => !picked.has(m)) };
}
