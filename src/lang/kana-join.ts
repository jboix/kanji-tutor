/**
 * Kana words the tokenizer splits (D92): kuromoji cuts some dictionary words written in kana into
 * pieces it knows (わが|まま for わがまま, チーズ|ケーキ, お|つり), which then resolve to the wrong
 * entries (まま as 儘) and come apart in J5 pieces and the word sheet. Where two or three
 * adjacent kana content tokens spell exactly one common dictionary word, they become one token
 * with that word's id. Pure; the lookups are the caller's.
 */
import type { Token, Word } from '../domain/types.ts';
import { isKana, toHiragana } from './kana.ts';

/** Parts of speech a split piece of a kana word comes back as. Never particles or endings. */
const PIECES = new Set(['noun', 'adnominal', 'adverb', 'prefix', 'interjection']);
/** この, その, あんな…: they join a noun productively (そのよう, このまま), so never a piece. */
const DEMONSTRATIVE = /^[こそあど](?:の|んな)$/u;
/** A shorter join is too often two words (おい|し, いい|え). */
const MIN_LENGTH = 3;
const MAX_PARTS = 3;
/** Verbs and い-adjectives conjugate, so kuromoji already reads them as one word. */
const INFLECTING = /^(?:v|adj-i)/u;

const isPiece = (token: Token | undefined): token is Token =>
  token !== undefined &&
  PIECES.has(token.pos) &&
  isKana(token.surface) &&
  !DEMONSTRATIVE.test(token.surface);

/** Kana words right before a span: the span would start inside a misparsed word (どうし|たん). */
const RUNS_ON = new Set(['noun', 'suffix', 'verb']);
const runsOn = (prev: Token | undefined) =>
  prev !== undefined && RUNS_ON.has(prev.pos) && isKana(prev.surface);

/** The joined text of the span of `n` tokens from `i`, or undefined when it cannot join. */
function spanText(tokens: readonly Token[], i: number, n: number): string | undefined {
  const span = tokens.slice(i, i + n);
  if (span.length < n || !span.every(isPiece) || runsOn(tokens[i - 1])) return undefined;
  const text = span.map((t) => t.surface).join('');
  return text.length >= MIN_LENGTH ? text : undefined;
}

/** Every text two or three adjacent kana pieces spell: what to look up before joining. */
export function kanaSpans(tokens: readonly Token[]): string[] {
  const out = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    for (let n = 2; n <= MAX_PARTS; n++) {
      const text = spanText(tokens, i, n);
      if (text) out.add(text);
    }
  }
  return [...out];
}

/**
 * The one common entry read exactly as `text` (as written: ケーキ, not けーき) that does not
 * conjugate; undefined when there is none or more than one (こうこう: 高校 or 孝行).
 */
export function kanaWordOf(words: readonly Word[], text: string): Word | undefined {
  const matches = words.filter((w) => w.common && w.readings.includes(text));
  const only = matches.length === 1 ? matches[0] : undefined;
  return only && !(only.pos ?? []).some((tag) => INFLECTING.test(tag)) ? only : undefined;
}

/** The longest span from `i` that spells a found word: its token count, or 0. */
function joinAt(tokens: readonly Token[], i: number, found: ReadonlyMap<string, string>) {
  for (let n = MAX_PARTS; n >= 2; n--) {
    const text = spanText(tokens, i, n);
    if (text && found.has(text)) return n;
  }
  return 0;
}

function joined(span: readonly Token[], wordId: string): Token {
  const surface = span.map((t) => t.surface).join('');
  const start = span[0]?.start ?? 0;
  return { surface, reading: toHiragana(surface), base: surface, pos: 'noun', start, wordId };
}

/** `tokens` with each span that spells a found kana word (text → word id) joined into one. */
export function joinKanaWords(
  tokens: readonly Token[],
  found: ReadonlyMap<string, string>,
): Token[] {
  if (found.size === 0) return [...tokens];
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; ) {
    const n = joinAt(tokens, i, found);
    const span = tokens.slice(i, i + Math.max(n, 1));
    const text = span.map((t) => t.surface).join('');
    const wordId = n > 0 ? found.get(text) : undefined;
    out.push(wordId ? joined(span, wordId) : (tokens[i] as Token));
    i += Math.max(n, 1);
  }
  return out;
}
