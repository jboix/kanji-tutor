/**
 * Sentence selection with coverage targets (U3). Pure and deterministic.
 *
 * 1. Pinned: each pinned key (a unit word, see `unit-reach.ts`) gets up to `perPinned` of its
 *    ranked sentences.
 * 2. Focus: every N5, N4 and N3 kanji word gets up to `focusPerWord` sentences at its own level
 *    in which it is the only word of that level (the others are easier, or kana), shortest first.
 *    With `focusAtLevel` above 1, a word short of such sentences also takes ones that share its
 *    level with up to that many words, after every sentence where it stands alone.
 * 3. Grammar: every catalogue point gets up to `perGrammar` sentences, easiest and shortest first.
 * 4. Fill: each level up to its `quota` first, then up to `max` in all; easiest level first,
 *    then fewer non-common words, then shorter. A sentence is skipped when every content word
 *    already has `perWord` sentences.
 *
 * Within each step, `preferred` sentences (by native speakers, or with audio) come before the
 * others of the same rank, ahead of the length tie-break.
 */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Sentence } from '../../src/domain/types.ts';
import { kanjiWordIds } from './level.ts';
import { contentWordIds } from './select.ts';

export interface CoverageOptions {
  /** Words that count as common (JMdict common or on a JLPT list). */
  core: ReadonlySet<string>;
  wordLevel: (id: string) => JlptLevel | undefined;
  focusPerWord: number;
  perGrammar: number;
  perWord: number;
  max: number;
  /** Sentences per level the fill reaches first, in this order, before the rest. */
  quota?: readonly (readonly [JlptLevel, number])[];
  /** Ranked sentences per key that must be kept first (unit words). */
  pinned?: ReadonlyMap<string, readonly Sentence[]>;
  perPinned?: number;
  /** Most words of the sentence's level a focus sentence may have (default 1). */
  focusAtLevel?: number;
  /** Sentence ids ranked first among equals: by native speakers or with audio. */
  preferred?: ReadonlySet<string>;
}

/** Kanji words of the sentence at the sentence's own level, from N3 down; none above N3. */
function wordsAtLevel(sentence: Sentence, wordLevel: CoverageOptions['wordLevel']): string[] {
  const level = sentence.level;
  if (level === undefined || level < 3) return [];
  return kanjiWordIds(sentence.tokens).filter((id) => wordLevel(id) === level);
}

/** Word ids this sentence is a focus sentence for (step 2), with up to `atLevel` such words. */
export function focusWords(
  sentence: Sentence,
  wordLevel: CoverageOptions['wordLevel'],
  atLevel = 1,
): string[] {
  const words = wordsAtLevel(sentence, wordLevel);
  return words.length <= atLevel ? words : [];
}

type Compare = (a: Sentence, b: Sentence) => number;

const byRef: Compare = (a, b) => Number(a.sourceRef) - Number(b.sourceRef);

/** Orders: preferred first, then shorter, then by Tatoeba id. */
function shortestWith(preferred: ReadonlySet<string> = new Set()): Compare {
  const rank = (s: Sentence) => (preferred.has(s.id) ? 0 : 1);
  return (a, b) => rank(a) - rank(b) || a.text.length - b.text.length || byRef(a, b);
}

class Picker {
  readonly kept = new Set<Sentence>();
  readonly words = new Map<string, number>();
  readonly focus = new Map<string, number>();
  readonly grammar = new Map<string, number>();
  constructor(private readonly options: CoverageOptions) {}

  take(sentence: Sentence): void {
    if (this.kept.has(sentence)) return;
    this.kept.add(sentence);
    bump(this.words, contentWordIds(sentence.tokens));
    bump(this.focus, focusWords(sentence, this.options.wordLevel, this.options.focusAtLevel));
    bump(this.grammar, sentence.grammarIds ?? []);
  }

  /** Takes sentences from `ranked` until `counts` has `target` for `key`. */
  fill(key: string, ranked: Sentence[], counts: Map<string, number>, target: number): void {
    for (const sentence of ranked) {
      if ((counts.get(key) ?? 0) >= target) return;
      this.take(sentence);
    }
  }

  levelCount(level: JlptLevel | undefined): number {
    let n = 0;
    for (const s of this.kept) if (s.level === level) n += 1;
    return n;
  }
}

function bump(counts: Map<string, number>, keys: readonly string[]): void {
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
}

function groupBy(candidates: Sentence[], keys: (s: Sentence) => readonly string[]) {
  const groups = new Map<string, Sentence[]>();
  for (const sentence of candidates) {
    for (const key of keys(sentence)) {
      const list = groups.get(key);
      if (list) list.push(sentence);
      else groups.set(key, [sentence]);
    }
  }
  return groups;
}

function sortedKeys(groups: Map<string, Sentence[]>): string[] {
  return [...groups.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function fillRank(candidates: Sentence[], options: CoverageOptions): Sentence[] {
  const rare = (s: Sentence) => s.wordIds.filter((id) => !options.core.has(id)).length;
  const band = (s: Sentence) => 5 - (s.level ?? 1);
  const shortest = shortestWith(options.preferred);
  return candidates
    .map((sentence) => ({ sentence, band: band(sentence), rare: rare(sentence) }))
    .sort((a, b) => a.band - b.band || a.rare - b.rare || shortest(a.sentence, b.sentence))
    .map((entry) => entry.sentence);
}

/** Fill (step 4) over `ranked` until `limit` more are kept or the cap is reached. */
function fillUpTo(picker: Picker, ranked: Sentence[], options: CoverageOptions, limit: number) {
  let left = limit;
  for (const sentence of ranked) {
    if (left <= 0 || picker.kept.size >= options.max) return;
    if (picker.kept.has(sentence)) continue;
    const ids = contentWordIds(sentence.tokens);
    if (ids.some((id) => (picker.words.get(id) ?? 0) < options.perWord)) {
      picker.take(sentence);
      left -= 1;
    }
  }
}

function fillRest(picker: Picker, candidates: Sentence[], options: CoverageOptions): void {
  const ranked = fillRank(candidates, options);
  for (const [level, quota] of options.quota ?? []) {
    const band = ranked.filter((s) => s.level === level);
    fillUpTo(picker, band, options, quota - picker.levelCount(level));
  }
  fillUpTo(picker, ranked, options, Number.POSITIVE_INFINITY);
}

/** Focus order: fewer words at the sentence's level first (alone before shared), then shortest. */
function focusOrder(options: CoverageOptions): Compare {
  const shortest = shortestWith(options.preferred);
  const shared = (s: Sentence) => wordsAtLevel(s, options.wordLevel).length;
  return (a, b) => shared(a) - shared(b) || shortest(a, b);
}

/** Selects the pack sentences from all candidates; the result is in Tatoeba id order. */
export function selectWithCoverage(candidates: Sentence[], options: CoverageOptions): Sentence[] {
  const picker = new Picker(options);
  for (const ranked of options.pinned?.values() ?? []) {
    for (const sentence of ranked.slice(0, options.perPinned ?? 1)) picker.take(sentence);
  }
  const focus = groupBy(candidates, (s) => focusWords(s, options.wordLevel, options.focusAtLevel));
  const focusRank = focusOrder(options);
  for (const id of sortedKeys(focus)) {
    picker.fill(id, (focus.get(id) ?? []).sort(focusRank), picker.focus, options.focusPerWord);
  }
  const grammar = groupBy(candidates, (s) => s.grammarIds ?? []);
  const shortest = shortestWith(options.preferred);
  const easiest: Compare = (a, b) => (b.level ?? 0) - (a.level ?? 0) || shortest(a, b);
  for (const id of sortedKeys(grammar)) {
    picker.fill(id, (grammar.get(id) ?? []).sort(easiest), picker.grammar, options.perGrammar);
  }
  fillRest(picker, candidates, options);
  return [...picker.kept].sort(byRef);
}

function countKeys(rows: readonly Sentence[], keys: (s: Sentence) => readonly string[]) {
  const out = new Map<string, number>();
  for (const s of rows) bump(out, keys(s));
  return out;
}

/** Words with fewer than `target` focus candidates when a focus sentence must stand alone. */
function starvedWords(candidates: readonly Sentence[], options: ReportOptions): number {
  const alone = countKeys(candidates, (s) => focusWords(s, options.wordLevel));
  return [...alone.values()].filter((n) => n < options.focusPerWord).length;
}

type ReportOptions = Pick<
  CoverageOptions,
  'wordLevel' | 'focusPerWord' | 'perGrammar' | 'focusAtLevel'
>;

/** How many N5–N3 focus words and grammar points reached their targets, for the build log. */
export function coverageReport(
  kept: readonly Sentence[],
  candidates: readonly Sentence[],
  options: ReportOptions,
): string {
  const focus = (s: Sentence) => focusWords(s, options.wordLevel, options.focusAtLevel);
  const want = countKeys(candidates, focus);
  const got = countKeys(kept, focus);
  const full = [...want].filter(
    ([id, n]) => (got.get(id) ?? 0) >= Math.min(n, options.focusPerWord),
  );
  const target = [...got.values()].filter((n) => n >= options.focusPerWord).length;
  const grammar = countKeys(kept, (s) => s.grammarIds ?? []);
  const rich = [...grammar.values()].filter((n) => n >= options.perGrammar).length;
  return (
    `${want.size} words have a focus sentence, ${starvedWords(candidates, options)} with fewer ` +
    `than ${options.focusPerWord} standing alone; ${full.length} got min(k, available), ` +
    `${target} got ${options.focusPerWord}; ` +
    `${grammar.size} grammar points used, ${rich} with at least ${options.perGrammar}`
  );
}

/** Counts per level, for the build log. */
export function countByLevel(sentences: readonly Sentence[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sentences) out[`N${s.level ?? '?'}`] = (out[`N${s.level ?? '?'}`] ?? 0) + 1;
  return out;
}
