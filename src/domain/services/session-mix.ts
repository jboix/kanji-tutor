/**
 * The variety mixer (V2, D49): a session mixes typed reading cards, JLPT-shaped questions, drills
 * and, in a unit, its passage. Exercises are spread evenly between reading cards, never first
 * and never next to each other, so no type comes more than twice in a row once there are
 * enough exercises: at least {@link exerciseSlots} for the reading cards. Pure and deterministic.
 */
import type { SessionCard } from '../session-types.ts';

/** The type a card counts as for the "never more than two in a row" rule. */
export function cardType(card: SessionCard): string {
  if (card.grammarIntro) return 'grammar-intro';
  if (card.passage) return 'passage';
  if (card.question) return `question:${card.question.kind}`;
  if (card.drill) return `drill:${card.drill.kind}`;
  return 'reading';
}

/** The longest run of cards of one type (introductions are part of the exercise they precede). */
export function longestRun(cards: readonly SessionCard[]): number {
  let best = 0;
  let run = 0;
  let last = '';
  for (const type of cards.map(cardType).filter((t) => t !== 'grammar-intro')) {
    run = type === last ? run + 1 : 1;
    last = type;
    best = Math.max(best, run);
  }
  return best;
}

/** Exercises needed between `readings` reading cards so none come three in a row. */
export function exerciseSlots(readings: number): number {
  return Math.max(0, Math.ceil(readings / 2) - 1);
}

/** Two lists taken in turn (a b a b …), the rest of the longer one after. */
export function alternate<T>(a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i];
    const y = b[i];
    if (x !== undefined) out.push(x);
    if (y !== undefined) out.push(y);
  }
  return out;
}

/**
 * Slot → exercise. Slots (reading cards before them) are taken in order, and each takes the
 * first exercise left whose `after` it meets. Returns the exercises left over too.
 */
function assignSlots(
  slots: readonly number[],
  exercises: readonly SessionCard[],
  after: ReadonlyMap<SessionCard, number> | undefined,
) {
  const left = [...exercises];
  const placed = new Map<number, SessionCard>();
  for (const slot of slots) {
    const i = left.findIndex((exercise) => (after?.get(exercise) ?? 0) <= slot);
    const exercise = left[i];
    if (exercise === undefined) continue;
    placed.set(slot, exercise);
    left.splice(i, 1);
  }
  return { placed, left };
}

/**
 * Places `exercises` among `readings`: exercise k after ⌊(k+1)·n/(E+1)⌋ reading cards, so they
 * are spread evenly, never first, never last and never adjacent. Exercises beyond n − 1 are left
 * out (keep the ones that matter most first). `after` holds, for an exercise on the session's
 * own words, how many reading cards must come before it (D56): a slot too early takes the next
 * exercise; when slots stay empty, the reading cards after the last exercise are cut to two, and
 * an exercise left over breaks the longest run it may go in. `tail` (a unit's passage) goes last.
 * With `fit`, too few exercises for the reading cards cut the session first (see
 * {@link fitReadings}).
 */
export function mixCards(
  given: readonly SessionCard[],
  offered: readonly SessionCard[],
  tail?: SessionCard,
  after?: ReadonlyMap<SessionCard, number>,
  fit = false,
): SessionCard[] {
  const { readings, exercises } = fit
    ? fitReadings(given, offered, after)
    : { readings: given, exercises: offered };
  const n = readings.length;
  const count = Math.min(exercises.length, Math.max(0, n - 1));
  const slots = Array.from({ length: count }, (_, k) => Math.floor(((k + 1) * n) / (count + 1)));
  const { placed, left } = assignSlots(slots, exercises.slice(0, count), after);
  let out = readings.flatMap((card, i) => {
    const next = placed.get(i + 1);
    return next ? [card, next] : [card];
  });
  if (placed.size > 0) out = trimTail(out);
  for (const exercise of left) out = breakLongestRun(out, exercise, after?.get(exercise));
  return tail ? [...out, tail] : out;
}

/**
 * The reading cards the exercises can keep to runs of two (V2, D56): with E exercises that can
 * go before the last card, at most 2·(E + 1), cut from the end. An exercise on the session's own
 * words that needs a cut card is dropped too, which may cut further. With no exercise at all
 * nothing is cut: the session has no exercise material.
 */
export function fitReadings(
  readings: readonly SessionCard[],
  exercises: readonly SessionCard[],
  after?: ReadonlyMap<SessionCard, number>,
) {
  let n = readings.length;
  let usable = [...exercises];
  for (;;) {
    const size = n;
    usable = exercises.filter((e) => (after?.get(e) ?? 0) < size);
    const cap = 2 * (Math.min(usable.length, n - 1) + 1);
    if (usable.length === 0 || n <= cap) break;
    n = cap;
  }
  return { readings: readings.slice(0, n), exercises: usable };
}

/**
 * Drops the reading cards after the last exercise beyond two (V2, D56): when the exercises run
 * short, the session gets shorter rather than ending in a long run. Nothing after them depends
 * on those cards.
 */
export function trimTail(cards: readonly SessionCard[]): SessionCard[] {
  const last = readingRuns(cards).at(-1);
  const end = last?.at.at(-1) ?? -1;
  const atEnd = cards.slice(end + 1).every((c) => cardType(c) === 'grammar-intro');
  if (!last || !atEnd || last.at.length <= 2) return [...cards];
  const drop = new Set(last.at.slice(2));
  return cards.filter((_, i) => !drop.has(i));
}

interface Run {
  /** Card indices of the run's reading cards. */
  at: number[];
  /** Reading cards before the run. */
  before: number;
}

/** Runs of reading cards (grammar introductions do not break a run). */
function readingRuns(cards: readonly SessionCard[]): Run[] {
  const runs: Run[] = [];
  let run: Run | undefined;
  let readings = 0;
  cards.forEach((card, i) => {
    const type = cardType(card);
    if (type === 'grammar-intro') return;
    if (type !== 'reading') run = undefined;
    else {
      if (!run) {
        run = { at: [], before: readings };
        runs.push(run);
      }
      run.at.push(i);
      readings += 1;
    }
  });
  return runs;
}

/** Where to split a run: about its middle, with at least `after` reading cards before. */
function splitOf(run: Run, after: number): number | undefined {
  const k = Math.max(Math.floor(run.at.length / 2), 1, after - run.before);
  return k < run.at.length ? k : undefined;
}

/**
 * Puts `card` inside the longest run of more than two reading cards it may go in (with at
 * least `after` reading cards before it), about its middle (V2, D56). Without such a run, the
 * cards are returned unchanged and `card` is left out.
 */
export function breakLongestRun(
  cards: readonly SessionCard[],
  card: SessionCard,
  after = 0,
): SessionCard[] {
  const fits = readingRuns(cards).filter(
    (run) => run.at.length > 2 && splitOf(run, after) !== undefined,
  );
  const best = fits.sort((a, b) => b.at.length - a.at.length)[0];
  const k = best && splitOf(best, after);
  if (!best || k === undefined) return [...cards];
  const at = (best.at[k - 1] ?? 0) + 1;
  return [...cards.slice(0, at), card, ...cards.slice(at)];
}
