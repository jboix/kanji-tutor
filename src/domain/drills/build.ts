/**
 * Sentence building (S4): a short sentence cut into its pieces (a word with the particles and
 * endings after it, as in 文の組み立て), shuffled, to put back in order from its meaning. Pure.
 */
import { chunks } from '../questions/sentence-order.ts';
import type { ItemId, Sentence } from '../types.ts';
import { seededOrder } from './seed.ts';
import type { BuildDrill, ListeningDrill, ListeningOption } from './types.ts';

/** Pieces a sentence to build has: enough to order, few enough for a phone. */
const MIN_PIECES = 3;
const MAX_PIECES = 6;
/** A piece this long is a phrase, not a tile. */
const MAX_PIECE = 10;

/** The sentence's pieces in order; punctuation joins the piece before it, the closing one goes. */
export function piecesOf(sentence: Sentence): string[] {
  const pieces: string[] = [];
  for (const chunk of chunks(sentence.tokens)) {
    if (!chunk.symbol) pieces.push(chunk.text);
    else if (pieces.length > 0) pieces[pieces.length - 1] += chunk.text;
  }
  const last = pieces.length - 1;
  if (last >= 0) pieces[last] = (pieces[last] ?? '').replace(/[。．.！!？?]+$/u, '');
  return pieces;
}

/** The order the tiles are shown in: seeded, never the sentence's own. */
function shuffle(count: number, seed: string): number[] {
  const order = seededOrder(
    Array.from({ length: count }, (_, i) => i),
    String,
    seed,
  );
  const same = order.every((value, i) => value === i);
  return same ? [...order.slice(1), ...order.slice(0, 1)] : order;
}

export interface BuildInput {
  sentence: Sentence;
  seed: string;
  itemId?: ItemId | undefined;
}

/** The building drill for a sentence of 3–6 pieces with a translation, else undefined. */
export function buildDrill({ sentence, seed, itemId }: BuildInput): BuildDrill | undefined {
  if (!sentence.translation) return undefined;
  const pieces = piecesOf(sentence);
  if (pieces.length < MIN_PIECES || pieces.length > MAX_PIECES) return undefined;
  if (pieces.some((piece) => piece.length > MAX_PIECE)) return undefined;
  if (new Set(pieces).size < pieces.length) return undefined;
  const drill: BuildDrill = {
    kind: 'build',
    sentence,
    pieces,
    shuffled: shuffle(pieces.length, `${seed}|${sentence.id}`),
  };
  if (itemId) drill.itemId = itemId;
  return drill;
}

const OPTIONS = 4;

function optionOf(sentence: Sentence): ListeningOption {
  const option: ListeningOption = { translation: sentence.translation ?? '' };
  if (sentence.translations) option.translations = sentence.translations;
  return option;
}

export interface ListeningInput extends BuildInput {
  /** Sentences to take the other meanings from. */
  others: readonly Sentence[];
  /** Show the sentence instead of speaking it (a sentence meaning check). */
  read?: boolean;
}

/** Listening: the sentence and four meanings, its own and three others, else undefined. */
export function listeningDrill(input: ListeningInput): ListeningDrill | undefined {
  const { sentence, seed } = input;
  const own = sentence.translation;
  if (!own) return undefined;
  const seen = new Set([own]);
  const others = seededOrder(input.others, (s) => s.id, `${seed}|${sentence.id}`).filter((s) => {
    if (!s.translation || seen.has(s.translation) || s.text === sentence.text) return false;
    seen.add(s.translation);
    return true;
  });
  if (others.length < OPTIONS - 1) return undefined;
  const picked = seededOrder([sentence, ...others.slice(0, OPTIONS - 1)], (s) => s.id, seed);
  const drill: ListeningDrill = {
    kind: 'listening',
    sentence,
    options: picked.map(optionOf),
    answer: picked.indexOf(sentence),
  };
  if (input.itemId) drill.itemId = input.itemId;
  if (input.read) drill.read = true;
  return drill;
}
