/**
 * The cheapest way to cut a kana run into words (C6), as an input method's lattice: every span
 * that the dictionary, the kana function words or an inflection can spell is an edge, each
 * segment costs a fixed price plus its spelling's own cost, and a kana nothing spells costs a
 * lot, so a few known words beat many guesses. Pure.
 */

/** One way to write a span of the run. */
export interface Spelling {
  form: string;
  /** Lower is likelier. */
  cost: number;
  /** The learner tracks the word (level 1 or more). */
  known: boolean;
  wordId?: string;
}

/** A word of the best cut: its kana, where it starts in the run, its spellings, best first. */
export interface Segment {
  kana: string;
  start: number;
  spellings: readonly Spelling[];
}

/** What every segment costs on top of its spelling: fewer, longer words win. */
const SEGMENT_COST = 10;
/** A single kana nothing spells, kept as it is. */
const UNKNOWN_COST = 20;
/** The longest span tried as one word (食べませんでした is 8). */
export const MAX_WORD = 10;

/** Spellings of a span, cheapest first; an empty list when nothing spells it. */
export type Speller = (kana: string) => readonly Spelling[];

interface Node {
  cost: number;
  from: number;
  spellings: readonly Spelling[];
}

/** A span's spellings, with the kana itself, dear, for a single kana nothing spells. */
function spellingsAt(kana: string, spell: Speller): readonly Spelling[] {
  const found = spell(kana);
  if (found.length > 0 || kana.length > 1) return found;
  return [{ form: kana, cost: UNKNOWN_COST, known: false }];
}

/** The cheapest way to reach `to`, ties going to the longest last word. */
function cheapestInto(kana: string, to: number, nodes: readonly Node[], spell: Speller): Node {
  let best: Node = { cost: Number.POSITIVE_INFINITY, from: to - 1, spellings: [] };
  for (let from = Math.max(0, to - MAX_WORD); from < to; from++) {
    const spellings = spellingsAt(kana.slice(from, to), spell);
    const head = spellings[0];
    const before = nodes[from]?.cost ?? Number.POSITIVE_INFINITY;
    if (!head) continue;
    const cost = before + SEGMENT_COST + head.cost;
    if (cost < best.cost) best = { cost, from, spellings };
  }
  return best;
}

/** The run cut into its likeliest words, first to last. */
export function bestPath(kana: string, spell: Speller): Segment[] {
  const nodes: Node[] = [{ cost: 0, from: -1, spellings: [] }];
  for (let to = 1; to <= kana.length; to++) nodes.push(cheapestInto(kana, to, nodes, spell));
  const segments: Segment[] = [];
  for (let to = kana.length; to > 0; ) {
    const node = nodes[to];
    if (!node) break;
    segments.unshift({
      kana: kana.slice(node.from, to),
      start: node.from,
      spellings: node.spellings,
    });
    to = node.from;
  }
  return segments;
}
