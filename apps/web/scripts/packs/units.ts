/**
 * The units pack (T1–T3): each thematic unit resolved against the dictionary, its passage as
 * `unit` sentences with level and grammar, and the pack sentences that teach each of its words
 * (D56) or use two of them.
 */

import { toHiragana } from 'wanakana';
import { GRAMMAR_CATALOGUE } from '../../src/domain/grammar/catalogue.ts';
import type { GrammarEntry } from '../../src/domain/grammar/types.ts';
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Unit } from '../../src/domain/themes/types.ts';
import type { Sentence, Token, UnitPack } from '../../src/domain/types.ts';
import { type Compound, claimUnitWords, joinCompounds } from './compounds.ts';
import { grammarIdsOf } from './grammar/detect.ts';
import type { Lookup } from './jmdict.ts';
import { kanaWordsOf, tokenizeAround } from './kana-words.ts';
import { type LevelContext, sentenceLevel } from './level.ts';
import { resolveUnitWord } from './themes/vocabulary.ts';
import type { Tokenize } from './tokenizer.ts';
import { mapTokens } from './tokens.ts';
import { reachKey } from './unit-reach.ts';

/** At most this many tagged pack sentences per unit, easiest and shortest first. */
export const SENTENCES_PER_UNIT = 30;

export interface UnitContext {
  lookup: Lookup;
  tokenize: Tokenize;
  levels: LevelContext;
  /** Sets preferred readings on a passage line's tokens (D56, `readings.ts`). */
  prefer?: (tokens: Token[]) => Token[];
  /** Unit words kuromoji splits, joined back into one token (`unitCompounds`). */
  compounds?: ReadonlyMap<string, Compound>;
  /** Each unit word's reachable sentences (`unit-reach.ts`), keyed by `reachKey`. */
  reach?: ReadonlyMap<string, readonly Sentence[]>;
}

const HAN = /\p{Script=Han}/u;
const fold = (pattern: string) => pattern.replace(/[〜~\s]/gu, '');

/**
 * Catalogue id of a unit grammar string: an id as is, or a pattern spelled as in the catalogue
 * (also one alternative of a "A／B" pattern). Unknown strings give undefined.
 */
export function grammarIdFor(
  text: string,
  catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE,
): string | undefined {
  const byId = catalogue.find((e) => e.id === text);
  if (byId) return byId.id;
  const key = fold(text);
  const exact = catalogue.find((e) => fold(e.pattern) === key);
  return (exact ?? catalogue.find((e) => fold(e.pattern).split('／').includes(key)))?.id;
}

/**
 * The unit words kuromoji splits (自己紹介 → 自己 紹介), by written form, to join back into one
 * token wherever a sentence writes them (D56, `compounds.ts`).
 */
export function unitCompounds(
  units: readonly Unit[],
  ctx: Pick<UnitContext, 'lookup' | 'tokenize'>,
): Map<string, Compound> {
  const out = new Map<string, Compound>();
  for (const word of units.flatMap((u) => u.words)) {
    const id = HAN.test(word.written) ? resolveUnitWord(ctx.lookup, word) : undefined;
    if (!id || out.has(word.written) || ctx.tokenize(word.written).length < 2) continue;
    out.set(word.written, { id, reading: toHiragana(word.reading) });
  }
  return out;
}

/** The unit's kanji words by written form, for its passage to claim (`claimUnitWords`). */
function ownWords(unit: Unit, ctx: Pick<UnitContext, 'lookup'>): Map<string, Compound> {
  const out = new Map<string, Compound>();
  for (const word of unit.words.filter((w) => HAN.test(w.written))) {
    const id = resolveUnitWord(ctx.lookup, word);
    if (id) out.set(word.written, { id, reading: toHiragana(word.reading) });
  }
  return out;
}

/** The unit's passage as `unit` sentences, tokenized like the Tatoeba ones. */
export function passageSentences(unit: Unit, ctx: UnitContext): Sentence[] {
  const tokenize = tokenizeAround(ctx.tokenize, kanaWordsOf(unit, ctx.tokenize));
  return unit.passage.sentences.map((line, i) => {
    const raw = mapTokens(line.ja, tokenize(line.ja), ctx.lookup).tokens;
    const grammarIds = grammarIdsOf(raw);
    const joined = claimUnitWords(
      joinCompounds(raw, ctx.compounds ?? new Map()),
      ownWords(unit, ctx),
    );
    const tokens = ctx.prefer ? ctx.prefer(joined) : joined;
    return {
      id: `unit:${unit.id}:${i}`,
      text: line.ja,
      translation: line.en,
      source: 'unit',
      sourceRef: unit.id,
      tokens,
      wordIds: [...new Set(tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))],
      grammarIds,
      level: sentenceLevel(line.ja, tokens, grammarIds, ctx.levels),
      verified: true,
    };
  });
}

/** JMdict ids of the unit's words, in unit order, skipping any that do not resolve. */
export function unitWordIds(unit: Unit, lookup: Lookup): string[] {
  return [...new Set(unit.words.flatMap((w) => resolveUnitWord(lookup, w) ?? []))];
}

/** The unit's words written with kanji, as the path counts them (T3; kana words never are). */
export function unitKanjiWordIds(unit: Unit, lookup: Lookup): string[] {
  const written = unit.words.filter((w) => HAN.test(w.written));
  return [...new Set(written.flatMap((w) => resolveUnitWord(lookup, w) ?? []))];
}

/**
 * Word id → the level a unit teaches it at (D56): the easiest unit with the word. Sentence
 * levels count a unit word at the easier of this and its list level.
 */
export function unitWordLevels(units: readonly Unit[], lookup: Lookup): Map<string, JlptLevel> {
  const out = new Map<string, JlptLevel>();
  for (const unit of units) {
    for (const id of unitWordIds(unit, lookup)) {
      out.set(id, Math.max(unit.level, out.get(id) ?? 1) as JlptLevel);
    }
  }
  return out;
}

const easiestFirst = (a: Sentence, b: Sentence) =>
  (b.level ?? 0) - (a.level ?? 0) ||
  a.text.length - b.text.length ||
  Number(a.sourceRef) - Number(b.sourceRef);

/** Sentences per unit word, from its reach list, listed before the two-word ones (D56). */
const REACH_PER_WORD = 2;

function reachIds(unit: Unit, wordIds: string[], ctx: UnitContext, kept: ReadonlySet<string>) {
  return wordIds.flatMap((id) =>
    (ctx.reach?.get(reachKey(unit.id, id)) ?? [])
      .filter((s) => kept.has(s.id))
      .slice(0, REACH_PER_WORD)
      .map((s) => s.id),
  );
}

function taggedSentences(unit: Unit, wordIds: string[], pool: readonly Sentence[]): string[] {
  const own = new Set(wordIds);
  return pool
    .filter(
      (s) => (s.level ?? 0) >= unit.level && s.wordIds.filter((id) => own.has(id)).length >= 2,
    )
    .sort(easiestFirst)
    .slice(0, SENTENCES_PER_UNIT)
    .map((s) => s.id);
}

export interface UnitsPack {
  units: UnitPack[];
  sentences: Sentence[];
  /** Unit grammar strings with no catalogue id, as "unit: text" (reported, not fatal). */
  unknownGrammar: string[];
}

/** Resolves every unit; `pool` is the selected pack sentences. */
export function buildUnits(
  units: readonly Unit[],
  pool: readonly Sentence[],
  ctx: UnitContext,
): UnitsPack {
  const out: UnitsPack = { units: [], sentences: [], unknownGrammar: [] };
  const kept = new Set(pool.map((s) => s.id));
  for (const unit of [...units].sort((a, b) => a.order - b.order)) {
    const wordIds = unitWordIds(unit, ctx.lookup);
    const grammar = unit.grammar.map((text) => ({ text, id: grammarIdFor(text) }));
    const passage = passageSentences(unit, ctx);
    out.sentences.push(...passage);
    out.unknownGrammar.push(...grammar.filter((g) => !g.id).map((g) => `${unit.id}: ${g.text}`));
    out.units.push({
      id: unit.id,
      order: unit.order,
      level: unit.level,
      wordIds,
      grammarIds: [...new Set(grammar.flatMap((g) => g.id ?? []))],
      passageIds: passage.map((s) => s.id),
      sentenceIds: [
        ...new Set([
          ...reachIds(unit, wordIds, ctx, kept),
          ...taggedSentences(unit, wordIds, pool),
        ]),
      ],
    });
  }
  return out;
}
