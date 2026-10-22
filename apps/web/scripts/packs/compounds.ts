/**
 * Unit compounds (T3): kuromoji splits some unit words (自己紹介 → 自己 紹介, 誕生日 → 誕生 日),
 * so their word id would never be a token and the reading loop could never target them. Where a
 * sentence writes such a word exactly, its tokens are joined back into one token with the unit
 * word's id and reading. Pure.
 */
import type { Token, Word } from '../../src/domain/types.ts';
import { kanaWordOf } from '../../src/lang/kana-join.ts';
import { isCommon, type JmWord } from './jmdict.ts';

/** A unit word kuromoji splits: its JMdict id and its reading in hiragana. */
export interface Compound {
  id: string;
  reading: string;
}

/** Most tokens a compound spans (自動販売機 is three). */
const MAX_PARTS = 5;
/** A compound keeps the part of speech of its last part only when that part conjugates. */
const CONJUGATING = new Set(['verb', 'adjective']);

function joined(tokens: readonly Token[], written: string, compound: Compound): Token {
  const first = tokens[0] as Token;
  const last = tokens.at(-1) as Token;
  return {
    surface: written,
    reading: compound.reading,
    base: written,
    pos: CONJUGATING.has(last.pos) ? last.pos : 'noun',
    start: first.start,
    wordId: compound.id,
  };
}

/** The longest compound starting at token `i`: its token count, or 0. */
function matchAt(tokens: readonly Token[], i: number, compounds: ReadonlyMap<string, Compound>) {
  let surface = tokens[i]?.surface ?? '';
  let best = 0;
  for (let n = 2; n <= MAX_PARTS && i + n <= tokens.length; n++) {
    surface += tokens[i + n - 1]?.surface ?? '';
    if (compounds.has(surface)) best = n;
  }
  return best;
}

/**
 * A unit passage's tokens with each of the unit's own words claimed: a token written
 * exactly as a unit word, read as another entry by the tokenizer (分別 as ふんべつ for ぶんべつ,
 * 故郷 as こきょう for ふるさと), takes the unit word's id and reading. Only for passages, which
 * are written to use those words; a Tatoeba 分別 may well be ふんべつ.
 */
export function claimUnitWords(
  tokens: readonly Token[],
  own: ReadonlyMap<string, Compound>,
): Token[] {
  return tokens.map((token) => {
    const word = token.surface === token.base ? own.get(token.surface) : undefined;
    if (!word || token.wordId === word.id) return token;
    return { ...token, wordId: word.id, reading: word.reading };
  });
}

/** `tokens` with every exact writing of a compound joined into one token. */
export function joinCompounds(
  tokens: readonly Token[],
  compounds: ReadonlyMap<string, Compound>,
): Token[] {
  if (compounds.size === 0) return [...tokens];
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; ) {
    const n = matchAt(tokens, i, compounds);
    const span = tokens.slice(i, i + Math.max(n, 1));
    const written = span.map((t) => t.surface).join('');
    const compound = compounds.get(written);
    out.push(n > 0 && compound ? joined(span, written, compound) : (tokens[i] as Token));
    i += Math.max(n, 1);
  }
  return out;
}

const KANA_TEXT = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]{3,}$/u;

/**
 * Kana words kuromoji may split, by reading: what `joinKanaWords` joins in the pipeline,
 * chosen by the same rule as at run time (`kanaWordOf`: the one common entry, not conjugating).
 */
export function kanaWordIds(words: readonly JmWord[]): Map<string, string> {
  const byText = new Map<string, Word[]>();
  for (const w of words) {
    if (!isCommon(w)) continue;
    const pos = w.sense[0]?.partOfSpeech ?? [];
    const readings = w.kana.map((k) => k.text);
    for (const text of readings.filter((r) => KANA_TEXT.test(r))) {
      const word: Word = { id: w.id, forms: [], readings, glosses: [], common: true, pos };
      byText.set(text, [...(byText.get(text) ?? []), word]);
    }
  }
  const out = new Map<string, string>();
  for (const [text, list] of byText) {
    const word = kanaWordOf(list, text);
    if (word) out.set(text, word.id);
  }
  return out;
}
