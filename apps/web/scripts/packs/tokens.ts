/**
 * Maps kuromoji (IPADIC) tokens onto our `Token` shape and resolves each to a JMdict id by base
 * form + reading. Pure: the kuromoji tokenizer itself is built in `tokenizer.ts`.
 */
import { isKana, toHiragana } from 'wanakana';
import type { Token } from '../../src/domain/types.ts';
import type { Lookup, LookupEntry } from './jmdict.ts';

/** The kuromoji token fields the pipeline reads. */
export interface RawToken {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  basic_form: string;
  /** IPADIC conjugation class, e.g. "一段", "五段・ラ行", "サ変・スル". */
  conjugated_type?: string | undefined;
  reading?: string | undefined;
}

const COARSE_POS: Record<string, string> = {
  名詞: 'noun',
  動詞: 'verb',
  形容詞: 'adjective',
  副詞: 'adverb',
  助詞: 'particle',
  助動詞: 'auxiliary',
  記号: 'symbol',
  接頭詞: 'prefix',
  連体詞: 'adnominal',
  接続詞: 'conjunction',
  感動詞: 'interjection',
};

/** Coarse English part of speech for an IPADIC token. */
export function coarsePos(raw: Pick<RawToken, 'pos' | 'pos_detail_1'>): string {
  if (raw.pos === '名詞' && raw.pos_detail_1 === '代名詞') return 'pronoun';
  if (raw.pos === '名詞' && raw.pos_detail_1 === '接尾') return 'suffix';
  return COARSE_POS[raw.pos] ?? 'other';
}

/** JMdict part-of-speech tags (exact, or as `tag-…` prefix) compatible with each coarse pos. */
const JM_POS: Record<string, string[]> = {
  noun: ['n', 'pn', 'adj-na', 'adj-no', 'vs', 'ctr', 'num', 'exp'],
  pronoun: ['pn', 'n'],
  suffix: ['suf', 'n-suf', 'ctr', 'n'],
  adjective: ['adj-i', 'adj-ix'],
  adverb: ['adv', 'adv-to'],
  particle: ['prt'],
  auxiliary: ['aux', 'aux-v', 'aux-adj', 'cop'],
  prefix: ['pref', 'n-pref'],
  adnominal: ['adj-pn', 'adj-f'],
  conjunction: ['conj'],
  interjection: ['int'],
};

const GODAN_ROW: Record<string, string> = {
  カ: 'k',
  ガ: 'g',
  サ: 's',
  タ: 't',
  ナ: 'n',
  バ: 'b',
  マ: 'm',
  ラ: 'r',
  ワ: 'u',
};

/** JMdict verb-class tag prefix for an IPADIC conjugation class: 一段 → v1, 五段・ラ行 → v5r. */
export function verbClass(conjugatedType: string | undefined): string | undefined {
  if (!conjugatedType) return undefined;
  if (conjugatedType.startsWith('一段')) return 'v1';
  if (conjugatedType.includes('ズル')) return 'vz';
  if (conjugatedType.startsWith('サ変')) return 'vs-';
  if (conjugatedType === '五段・ラ行特殊') return 'v5aru';
  if (conjugatedType.startsWith('カ変')) return 'vk';
  const godan = /^五段・(.)行/.exec(conjugatedType);
  return godan ? `v5${GODAN_ROW[godan[1] ?? ''] ?? ''}` : undefined;
}

function isVerbTag(tag: string): boolean {
  return tag.startsWith('v') && tag !== 'vs';
}

/** Whether the entry can be this kind of token (for verbs, of this conjugation class). */
export function posCompatible(entry: LookupEntry, pos: string, klass?: string): boolean {
  if (pos === 'verb') {
    return entry.pos.some((tag) => isVerbTag(tag) && (!klass || tag.startsWith(klass)));
  }
  const tags = JM_POS[pos] ?? [];
  return entry.pos.some((tag) => tags.some((t) => tag === t || tag.startsWith(`${t}-`)));
}

/**
 * Tokens that must resolve to a JMdict entry for a sentence to be kept: everything but symbols,
 * particles, auxiliaries, numerals and non-independent words (〜ている, nominaliser の).
 */
export function isContent(pos: string, raw: Pick<RawToken, 'pos_detail_1'>): boolean {
  if (['symbol', 'particle', 'auxiliary'].includes(pos)) return false;
  if (raw.pos_detail_1 === '非自立') return false;
  return raw.pos_detail_1 !== '数';
}

function hiragana(text: string): string {
  return toHiragana(text, { passRomaji: true });
}

/** Reading of the dictionary form, derived from the surface reading (待っ/まっ → 待つ/まつ). */
export function baseReading(surface: string, base: string, reading: string): string | undefined {
  if (isKana(base)) return hiragana(base);
  if (surface === base) return reading;
  let prefix = 0;
  while (prefix < surface.length && surface[prefix] === base[prefix]) prefix++;
  const surfaceTail = hiragana(surface.slice(prefix));
  if (prefix === 0 || !reading.endsWith(surfaceTail) || !isKana(base.slice(prefix))) {
    return undefined;
  }
  return reading.slice(0, reading.length - surfaceTail.length) + hiragana(base.slice(prefix));
}

export interface Query {
  base: string;
  /** Hiragana reading of the base form, when it could be derived. */
  reading: string | undefined;
  pos: string;
  /** JMdict verb-class prefix, for verbs. */
  klass?: string | undefined;
  /** Content tokens must resolve; others only take a primary-form, pos-compatible match. */
  required: boolean;
}

function score(entry: LookupEntry, query: Query): number {
  let value = 0;
  if (query.reading && entry.kana.has(query.reading)) value += 8;
  if (posCompatible(entry, query.pos, query.klass)) value += 4;
  if (entry.common) value += 2;
  if (isKana(query.base) && entry.kanaWord) value += 2;
  if (entry.rank.get(query.base) === 0) value += 1;
  return value;
}

function candidates(lookup: Lookup, query: Query): LookupEntry[] {
  const all = lookup.get(query.base) ?? [];
  if (query.required) return all;
  const kana = isKana(query.base);
  return all.filter(
    (entry) =>
      entry.rank.get(query.base) === 0 &&
      (!kana || entry.kanaWord) &&
      posCompatible(entry, query.pos, query.klass),
  );
}

/** Best JMdict entry for a token, or undefined. Ties break on the lowest JMdict id. */
export function resolveWord(lookup: Lookup, query: Query): string | undefined {
  let best: LookupEntry | undefined;
  let bestScore = -1;
  for (const entry of candidates(lookup, query)) {
    const value = score(entry, query);
    if (value > bestScore || (value === bestScore && best && Number(entry.id) < Number(best.id))) {
      best = entry;
      bestScore = value;
    }
  }
  return best?.id;
}

export interface MappedSentence {
  tokens: Token[];
  /** False when some content token did not resolve to a JMdict id. */
  resolved: boolean;
}

function mapToken(raw: RawToken, start: number, lookup: Lookup): { token: Token; ok: boolean } {
  const pos = coarsePos(raw);
  const reading = hiragana(raw.reading ?? raw.surface_form);
  const base = raw.basic_form === '*' ? raw.surface_form : raw.basic_form;
  const token: Token = { surface: raw.surface_form, reading, base, pos, start };
  const required = isContent(pos, raw);
  if (pos !== 'symbol') {
    const wordId = resolveWord(lookup, {
      base,
      reading: baseReading(raw.surface_form, base, reading),
      pos,
      klass: pos === 'verb' ? verbClass(raw.conjugated_type) : undefined,
      required,
    });
    if (wordId) token.wordId = wordId;
  }
  return { token, ok: !required || token.wordId !== undefined };
}

/** Maps kuromoji output for `text` onto `Token`s with UTF-16 start offsets and word ids. */
export function mapTokens(text: string, raws: RawToken[], lookup: Lookup): MappedSentence {
  const tokens: Token[] = [];
  let cursor = 0;
  let resolved = true;
  for (const raw of raws) {
    const start = text.indexOf(raw.surface_form, cursor);
    cursor = start + raw.surface_form.length;
    const { token, ok } = mapToken(raw, start, lookup);
    if (!ok) resolved = false;
    tokens.push(token);
  }
  return { tokens, resolved };
}
