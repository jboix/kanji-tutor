/**
 * Tokenizes every passage sentence, question prompt and option of the units with the pack
 * tokenizer and checks the words (T2, T6): unit words resolve to JMdict with their reading, every
 * content token resolves, and every resolved word is at or below the unit's level unless a unit
 * so far on the path introduces it.
 */
import { toHiragana } from 'wanakana';
import type { Unit, UnitWord } from '../../../src/domain/themes/types.ts';
import type { Token, Word } from '../../../src/domain/types.ts';
import type { Lookup } from '../jmdict.ts';
import { kanaWordsOf, tokenizeAround } from '../kana-words.ts';
import type { Tokenize } from '../tokenizer.ts';
import { baseReading, coarsePos, isContent, mapTokens, type RawToken } from '../tokens.ts';
import {
  HONORIFIC_PREFIX,
  isVerbEnding,
  LEVEL_FREE_POS,
  NUMERAL_COUNTER,
  PROPER_NAMES,
  PROPER_NOUN,
} from './exceptions.ts';
import { tokenKey } from './pack-words.ts';
import type { Violation } from './rules.ts';

export interface VocabularyContext {
  tokenize: Tokenize;
  lookup: Lookup;
  /** Pack words by JMdict id. */
  words: Map<string, Word>;
  /** Token key (`tokenKey`) → word id, preferred over `lookup` when present. */
  preferred?: Map<string, string>;
}

/** Words a unit may use above its level: its own and earlier units' words, by id and by form. */
interface Allowed {
  ids: Set<string>;
  forms: Set<string>;
}

function byReading(lookup: Lookup, written: string, reading: string): string | undefined {
  const kana = toHiragana(reading);
  const matches = (lookup.get(written) ?? []).filter(
    (entry) => entry.texts.has(written) && entry.kana.has(kana),
  );
  matches.sort((a, b) => Number(b.common) - Number(a.common) || Number(a.id) - Number(b.id));
  return matches[0]?.id;
}

/** The same word without a fused polite prefix: お正月/おしょうがつ → 正月/しょうがつ. */
function withoutPrefix(lookup: Lookup, written: string, reading: string): string | undefined {
  if (!HONORIFIC_PREFIX.test(written) || written.length < 2) return undefined;
  const rest = reading.replace(/^(お|ご|おん)/u, '');
  return byReading(lookup, written.slice(1), rest);
}

/**
 * JMdict id of a unit word: an entry with that writing and that reading, common first, or the
 * word without its polite prefix (`HONORIFIC_PREFIX`).
 */
export function resolveUnitWord(lookup: Lookup, word: UnitWord): string | undefined {
  return (
    byReading(lookup, word.written, word.reading) ??
    withoutPrefix(lookup, word.written, toHiragana(word.reading))
  );
}

/** Every Japanese text of a unit with its location. */
export function unitTexts(unit: Unit): { where: string; text: string }[] {
  return [
    ...unit.passage.sentences.map((s, i) => ({ where: `passage[${i}]`, text: s.ja })),
    ...unit.questions.flatMap((q, i) => [
      { where: `questions[${i}].prompt`, text: q.prompt },
      ...q.options.map((text, j) => ({ where: `questions[${i}].options[${j}]`, text })),
    ]),
  ];
}

function levelOk(word: Word | undefined, level: Unit['level']): boolean {
  return word?.jlpt !== undefined && word.jlpt >= level;
}

function describe(word: Word | undefined): string {
  if (!word) return 'not in the pack';
  return word.jlpt ? `N${word.jlpt}` : 'no JLPT level';
}

function exempt(raw: RawToken, token: Token): boolean {
  return (
    LEVEL_FREE_POS.has(token.pos) ||
    raw.pos_detail_1 === PROPER_NOUN ||
    NUMERAL_COUNTER.test(token.surface)
  );
}

function tokenViolation(
  raw: RawToken,
  token: Token,
  unit: Unit,
  ctx: VocabularyContext,
  allowed: Allowed,
): string | undefined {
  const label = `${token.surface} (${token.base}, ${token.reading}, ${token.pos})`;
  const reading = baseReading(token.surface, token.base, token.reading) ?? token.reading;
  const id =
    ctx.preferred?.get(tokenKey(token)) ??
    token.wordId ??
    withoutPrefix(ctx.lookup, token.base, reading);
  if (!id) {
    const named = raw.pos_detail_1 === PROPER_NOUN && PROPER_NAMES.has(token.surface);
    return named ? undefined : `${label} does not resolve to JMdict`;
  }
  if (exempt(raw, token) || allowed.ids.has(id) || allowed.forms.has(token.base)) return undefined;
  const word = ctx.words.get(id);
  if (levelOk(word, unit.level)) return undefined;
  const form = word ? `${word.forms[0] ?? word.readings[0]} ${id}` : id;
  return `${label} → ${form}: ${describe(word)}, above N${unit.level}`;
}

function checkText(
  unit: Unit,
  where: string,
  text: string,
  ctx: VocabularyContext,
  allowed: Allowed,
): Violation[] {
  const raws = ctx.tokenize(text);
  const { tokens } = mapTokens(text, raws, ctx.lookup);
  const out: Violation[] = [];
  for (const [i, raw] of raws.entries()) {
    const token = tokens[i];
    if (!token || !isContent(coarsePos(raw), raw) || isVerbEnding(raw)) continue;
    const message = tokenViolation(raw, token, unit, ctx, allowed);
    if (message) out.push({ unit: unit.id, where, message });
  }
  return out;
}

/** Allows a unit word and, when kuromoji splits it (自動販売機 → 自動 販売 機), its parts. */
function allow(word: UnitWord, ctx: VocabularyContext, allowed: Allowed): void {
  allowed.forms.add(word.written);
  const raws = ctx.tokenize(word.written);
  if (raws.length < 2) return;
  for (const token of mapTokens(word.written, raws, ctx.lookup).tokens) {
    allowed.forms.add(token.base);
    if (token.wordId) allowed.ids.add(token.wordId);
  }
}

function unitWordIds(unit: Unit, ctx: VocabularyContext, allowed: Allowed): Violation[] {
  const out: Violation[] = [];
  for (const [i, word] of unit.words.entries()) {
    const id = resolveUnitWord(ctx.lookup, word);
    allow(word, ctx, allowed);
    if (id) allowed.ids.add(id);
    else {
      out.push({
        unit: unit.id,
        where: `words[${i}]`,
        message: `${word.written} (${word.reading}) has no JMdict entry with that reading`,
      });
    }
  }
  return out;
}

/** A unit should use what it introduces: at least half its words appear in the passage. */
function usage(unit: Unit, ctx: VocabularyContext): Violation[] {
  const text = unit.passage.sentences.map((s) => s.ja).join('');
  const bases = new Set(mapTokens(text, ctx.tokenize(text), ctx.lookup).tokens.map((t) => t.base));
  const unused = unit.words.filter((w) => !text.includes(w.written) && !bases.has(w.written));
  if (unused.length * 2 <= unit.words.length) return [];
  const list = unused.map((w) => w.written).join(' ');
  return [
    {
      unit: unit.id,
      where: 'words',
      message: `passage uses under half the words; unused: ${list}`,
    },
  ];
}

/** Vocabulary violations over the whole path, walked in path order. */
export function checkVocabulary(units: readonly Unit[], ctx: VocabularyContext): Violation[] {
  const allowed: Allowed = { ids: new Set(), forms: new Set() };
  const out: Violation[] = [];
  for (const unit of [...units].sort((a, b) => a.order - b.order)) {
    const own = { ...ctx, tokenize: tokenizeAround(ctx.tokenize, kanaWordsOf(unit, ctx.tokenize)) };
    out.push(...unitWordIds(unit, ctx, allowed), ...usage(unit, own));
    for (const { where, text } of unitTexts(unit)) {
      out.push(...checkText(unit, where, text, own, allowed));
    }
  }
  return out;
}
