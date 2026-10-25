/**
 * Loads the raw sources into the pipeline's working set: JLPT levels per JMdict id, kanji levels,
 * and every Tatoeba candidate sentence, tokenized, with its grammar ids, then levelled (G2).
 */
import { GRAMMAR_CATALOGUE } from '../../src/domain/grammar/catalogue.ts';
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Kanji, Sentence, Token } from '../../src/domain/types.ts';
import { EXTRA_WORDS } from './assemble.ts';
import { casualRule } from './casual.ts';
import { readBz2Text, readText } from './fetch.ts';
import { grammarIdsInParallel } from './grammar-pool.ts';
import { applyOverrides, inheritPolitePrefix } from './jlpt-overrides.ts';
import { isCommon, type JmWord, type Lookup } from './jmdict.ts';
import { type LevelContext, sentenceLevel } from './level.ts';
import { dedupe, fitsLevelLength, keepText, toSentence } from './select.ts';
import { SOURCES, type Source } from './sources.ts';
import { type Pair, pairSentences, preferredIds } from './tatoeba.ts';
import type { Tokenize } from './tokenizer.ts';
import { mapTokens } from './tokens.ts';

export type SourcePath = (source: Source) => Promise<string>;

/** JMdict id → JLPT level; a word on several lists keeps the easiest level, then overrides. */
export async function loadJlpt(
  path: SourcePath,
  words: readonly JmWord[],
): Promise<Map<string, JlptLevel | undefined>> {
  const levels = new Map<string, JlptLevel | undefined>();
  const lists = [SOURCES.jlpt5, SOURCES.jlpt4, SOURCES.jlpt3, SOURCES.jlpt2, SOURCES.jlpt1];
  for (const [index, source] of lists.entries()) {
    const level = (5 - index) as JlptLevel;
    for (const line of readText(await path(source))
      .split('\n')
      .slice(1)) {
      const id = line.split(',')[0]?.trim();
      if (id && /^\d+$/.test(id) && !levels.has(id)) levels.set(id, level);
    }
  }
  const missing = applyOverrides(words, levels);
  if (missing.length > 0) {
    throw new Error(`JLPT overrides without entry: ${missing.map((o) => o.written)}`);
  }
  inheritPolitePrefix(words, levels, EXTRA_WORDS);
  return levels;
}

const GRAMMAR_LEVEL = new Map(GRAMMAR_CATALOGUE.map((e) => [e.id, e.level as JlptLevel]));
const KANJI = /(?![々〆〇])\p{Script=Han}/gu;

/**
 * Level of a JMdict-common word that is on no JLPT list (父, 東京, 日本語, 行ける): the level of its
 * hardest kanji. The lists map many everyday words and derived forms to other entries, and
 * counting them as N1 would make half the corpus N1. Uncommon untagged words stay N1.
 */
export function untaggedLevels(
  words: readonly JmWord[],
  jlpt: ReadonlyMap<string, JlptLevel | undefined>,
  kanji: ReadonlyMap<string, Kanji>,
): Map<string, JlptLevel> {
  const out = new Map<string, JlptLevel>();
  for (const w of words) {
    const form = w.kanji[0]?.text;
    if (!form || jlpt.has(w.id) || !isCommon(w)) continue;
    const levels = (form.match(KANJI) ?? []).map((c) => kanji.get(c)?.jlpt ?? 1);
    out.set(w.id, Math.min(5, ...levels) as JlptLevel);
  }
  return out;
}

/** The easier of two levels; undefined only when both are. */
function easier(a: JlptLevel | undefined, b: JlptLevel | undefined): JlptLevel | undefined {
  if (a === undefined) return b;
  return b === undefined ? a : (Math.max(a, b) as JlptLevel);
}

/**
 * The level lookups used by `sentenceLevel`: list level, else the untagged-common fallback.
 * `taught` holds the level of the unit that teaches a word: a unit word counts at the
 * easier of its list level and its unit's, since the path teaches it there (保険 in an N4 unit).
 */
export function levelContext(
  jlpt: ReadonlyMap<string, JlptLevel | undefined>,
  kanji: ReadonlyMap<string, Kanji>,
  untagged: ReadonlyMap<string, JlptLevel>,
  taught: ReadonlyMap<string, JlptLevel> = new Map(),
): LevelContext {
  return {
    wordLevel: (id) => easier(jlpt.get(id) ?? untagged.get(id), taught.get(id)),
    kanjiLevel: (char) => kanji.get(char)?.jlpt,
    grammarLevel: (id) => GRAMMAR_LEVEL.get(id),
  };
}

export interface CorpusInput {
  path: SourcePath;
  lookup: Lookup;
  tokenize: Tokenize;
}

/** A Tatoeba pair that fully resolves, with its tokens and grammar ids, before levelling. */
export interface Resolved {
  pair: Pair;
  tokens: Token[];
  grammarIds: string[];
}

/** Pairs without slang or casual-wrong forms, logging how many each rule drops. */
function withoutCasual(pairs: readonly Pair[]): Pair[] {
  const dropped = new Map<string, number>();
  const kept = pairs.filter((pair) => {
    const rule = casualRule(pair.text);
    if (rule) dropped.set(rule, (dropped.get(rule) ?? 0) + 1);
    return !rule;
  });
  const list = [...dropped].map(([rule, n]) => `${rule} ${n}`).join(', ');
  console.log(`  casual forms dropped: ${list || 'none'}`);
  return kept;
}

/** Tatoeba sentence ids (`tatoeba:<id>`) by native speakers or with audio, ranked first. */
export async function loadPreferred(path: SourcePath): Promise<Set<string>> {
  const ids = preferredIds(
    readBz2Text(await path(SOURCES.jpnDetailed)),
    readBz2Text(await path(SOURCES.jpnUserLanguages)),
    readBz2Text(await path(SOURCES.jpnAudio)),
  );
  return new Set([...ids].map((id) => `tatoeba:${id}`));
}

/** Every Tatoeba jpn–eng pair that passes the text filters and fully resolves, with grammar. */
export async function loadResolved(input: CorpusInput): Promise<Resolved[]> {
  const pairs = pairSentences(
    readBz2Text(await input.path(SOURCES.jpnSentences)),
    readBz2Text(await input.path(SOURCES.engSentences)),
    readBz2Text(await input.path(SOURCES.links)),
  );
  const short = dedupe(withoutCasual(pairs.filter((p) => keepText(p.text))));
  const resolved = short.flatMap((pair) => {
    const mapped = mapTokens(pair.text, input.tokenize(pair.text), input.lookup);
    return mapped.resolved ? [{ pair, tokens: mapped.tokens }] : [];
  });
  const grammar = await grammarIdsInParallel(resolved.map((r) => r.tokens));
  console.log(
    `  ${pairs.length} jpn–eng pairs, ${short.length} short and unique, ${resolved.length} resolved`,
  );
  return resolved.map((r, i) => ({ ...r, grammarIds: grammar[i] ?? [] }));
}

/**
 * The candidates: each resolved pair levelled (G2), kept when within its level's length range
 * (`fitsLevelLength`: the minimum applies from N4 up).
 */
export function levelled(resolved: readonly Resolved[], levels: LevelContext): Sentence[] {
  const out = resolved.flatMap(({ pair, tokens, grammarIds }) => {
    const level = sentenceLevel(pair.text, tokens, grammarIds, levels);
    const sentence = toSentence(pair, tokens, { grammarIds, level });
    return fitsLevelLength(sentence) ? [sentence] : [];
  });
  console.log(`  ${out.length} within the length of their level`);
  return out;
}
