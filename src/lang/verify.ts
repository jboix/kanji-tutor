import type { Token, Word } from '../domain/types.ts';
import { foldKana, isKana, normaliseReading } from './kana.ts';
import type { ReadingCheck, Tokenizer } from './types.ts';
import { trailingKana, type WordLookup, writtenAs } from './word-lookup.ts';

/** What `verifyReading` needs: a tokenizer and a memoised dictionary lookup. */
export interface VerifyDeps {
  tokenizer: Tokenizer;
  lookup: WordLookup;
}

const UNKNOWN: ReadingCheck = { status: 'unknown' };
const VERIFIED: ReadingCheck = { status: 'verified' };

/** A reading claim: kana, optionally with punctuation, and at least one kana. */
function isReadingText(claim: string): boolean {
  const chars = [...claim];
  const allowed = (c: string) => isKana(c) || /[\p{P}\p{S}]/u.test(c);
  return chars.some((c) => isKana(c)) && chars.every(allowed);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function check(claim: string, expected: readonly string[]): ReadingCheck {
  return expected.includes(claim) ? VERIFIED : { status: 'mismatch', expected: unique(expected) };
}

/**
 * The usual reading of `text` when `claim` is one of its less common variants (R10, D57): the
 * preferred (first) reading of an entry written `text` that lists `claim` among its `variants`.
 * Readings with a meaning of their own (今日 こんにち) are not variants, so they are not marked.
 */
export function preferredOver(words: readonly Word[], text: string, claim: string) {
  const entry = writtenAs(words, text).find((word) =>
    (word.variants ?? []).some((variant) => foldKana(variant) === claim),
  );
  const preferred = entry?.readings[0];
  return preferred === undefined ? undefined : foldKana(preferred);
}

/** The verified check of a dictionary claim, with the usual reading when it is a variant. */
function checkWord(words: readonly Word[], text: string, claim: string): ReadingCheck {
  const result = check(claim, readingsOf(words, text));
  if (result.status !== 'verified') return result;
  const preferred = preferredOver(words, text, claim);
  return preferred && preferred !== claim ? { status: 'verified', preferred } : result;
}

/** Readings of a conjugated token derived from a dictionary form: 待っ + 待つ/まつ → まっ. */
function conjugatedReadings(surface: string, base: string, baseReadings: readonly string[]) {
  const baseTail = trailingKana(base);
  const tail = trailingKana(surface);
  return baseReadings
    .filter((reading) => reading.endsWith(baseTail))
    .map((reading) => reading.slice(0, reading.length - baseTail.length) + tail);
}

/** Godan dictionary endings a euphonic te/ta stem may come from: 行っ ← 行う, 行つ, 行る, 行く. */
const ONBIN_ENDINGS: Readonly<Record<string, readonly string[]>> = {
  っ: ['う', 'つ', 'る', 'く'],
  ん: ['む', 'ぶ', 'ぬ'],
  い: ['く', 'ぐ'],
};

/**
 * Dictionary forms a conjugated verb token may come from: the tokenizer's, plus the other godan
 * verbs its stem fits, so 行った can be read いった (行く) as well as おこなった (行う).
 */
function baseForms(token: Token): string[] {
  const endings = token.pos === 'verb' ? ONBIN_ENDINGS[token.surface.slice(-1)] : undefined;
  const stem = token.surface.slice(0, -1);
  return unique([token.base, ...(endings ?? []).map((ending) => stem + ending)]);
}

async function derivedReadings(token: Token, lookup: WordLookup): Promise<string[]> {
  if (token.surface === token.base) return [];
  const lists = await Promise.all(
    baseForms(token).map(async (base) =>
      conjugatedReadings(token.surface, base, readingsOf(await lookup(base), base)),
    ),
  );
  return lists.flat();
}

function readingsOf(words: readonly Word[], text: string): string[] {
  return writtenAs(words, text).flatMap((entry) => entry.readings.map(foldKana));
}

/**
 * Every reading a token may legitimately have: the tokenizer's, plus JMdict's for its written
 * form (間 → あいだ, ま, かん) and, for conjugated tokens, readings derived from the base form.
 * Symbols may be read or dropped. A token with no kana candidate yields an empty list.
 */
async function tokenCandidates(token: Token, lookup: WordLookup): Promise<string[]> {
  if (token.pos === 'symbol') return [foldKana(token.surface), ''];
  if (isKana(token.surface)) return [foldKana(token.surface)];
  const own = readingsOf(await lookup(token.surface), token.surface);
  const derived = await derivedReadings(token, lookup);
  const all = [foldKana(token.reading), ...own, ...derived].filter((r) => r && isKana(r));
  return unique(all);
}

function advance(claim: string, positions: ReadonlySet<number>, options: readonly string[]) {
  const next = new Set<number>();
  for (const at of positions) {
    for (const option of options) if (claim.startsWith(option, at)) next.add(at + option.length);
  }
  return next;
}

/** True when `claim` is a concatenation of one candidate per token, in order. */
function segments(claim: string, candidates: readonly string[][]): boolean {
  let positions: ReadonlySet<number> = new Set([0]);
  for (const options of candidates) positions = advance(claim, positions, options);
  return positions.has(claim.length);
}

async function viaTokenizer(surface: string, claim: string, deps: VerifyDeps) {
  const tokens = await deps.tokenizer.tokenize(surface);
  const candidates = await Promise.all(tokens.map((t) => tokenCandidates(t, deps.lookup)));
  if (tokens.length === 0 || candidates.some((options) => options.length === 0)) return UNKNOWN;
  if (segments(claim, candidates)) return VERIFIED;
  const primary = tokens.map((t) => (t.pos === 'symbol' ? '' : foldKana(t.reading))).join('');
  return { status: 'mismatch', expected: [primary] } satisfies ReadingCheck;
}

/**
 * Checks an AI reading of `surface` (A8). Kana surfaces must match themselves; surfaces written
 * exactly so in JMdict must match one of its readings; anything else (conjugations, phrases) is
 * tokenized and must match the tokenizer, allowing JMdict's alternative readings per token.
 * Anything that cannot be checked is `unknown`, never `verified`.
 */
export async function verifyReading(
  surface: string,
  reading: string,
  deps: VerifyDeps,
): Promise<ReadingCheck> {
  const text = surface.trim();
  const claim = normaliseReading(reading).replace(/\s+/g, '');
  if (!text || !isReadingText(claim)) return UNKNOWN;
  if (isKana(text)) return check(claim, [foldKana(text)]);
  const words = await deps.lookup(text);
  if (readingsOf(words, text).length > 0) return checkWord(words, text, claim);
  try {
    return await viaTokenizer(text, claim, deps);
  } catch {
    return UNKNOWN;
  }
}
