/**
 * Sentence selection with coverage targets (U3). Pure and deterministic.
 *
 * 1. Pinned: each pinned key (a unit word, see `unit-reach.ts`) gets up to `perPinned` of its
 *    ranked sentences.
 * 2. Focus: every N5, N4 and N3 kanji word gets up to `focusPerWord` sentences at its own level
 *    in which it is the only word of that level (the others are easier, or kana), shortest first.
 * 3. Grammar: every catalogue point gets up to `perGrammar` sentences, easiest and shortest first.
 * 4. Fill: each level up to its `quota` first, then up to `max` in all; easiest level first,
 *    then fewer non-common words, then shorter. A sentence is skipped when every content word
 *    already has `perWord` sentences.
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
}

/** Word ids this sentence is a focus sentence for (step 1). */
export function focusWords(sentence: Sentence, wordLevel: CoverageOptions['wordLevel']): string[] {
  const level = sentence.level;
  if (level === undefined || level < 3) return [];
  const atLevel = kanjiWordIds(sentence.tokens).filter((id) => wordLevel(id) === level);
  return atLevel.length === 1 ? atLevel : [];
}

const byRef = (a: Sentence, b: Sentence) => Number(a.sourceRef) - Number(b.sourceRef);
const shortest = (a: Sentence, b: Sentence) => a.text.length - b.text.length || byRef(a, b);
const easiest = (a: Sentence, b: Sentence) => (b.level ?? 0) - (a.level ?? 0) || shortest(a, b);

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
    bump(this.focus, focusWords(sentence, this.options.wordLevel));
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

function fillRank(candidates: Sentence[], core: ReadonlySet<string>): Sentence[] {
  const rare = (s: Sentence) => s.wordIds.filter((id) => !core.has(id)).length;
  const band = (s: Sentence) => 5 - (s.level ?? 1);
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
  const ranked = fillRank(candidates, options.core);
  for (const [level, quota] of options.quota ?? []) {
    const band = ranked.filter((s) => s.level === level);
    fillUpTo(picker, band, options, quota - picker.levelCount(level));
  }
  fillUpTo(picker, ranked, options, Number.POSITIVE_INFINITY);
}

/** Selects the pack sentences from all candidates; the result is in Tatoeba id order. */
export function selectWithCoverage(candidates: Sentence[], options: CoverageOptions): Sentence[] {
  const picker = new Picker(options);
  for (const ranked of options.pinned?.values() ?? []) {
    for (const sentence of ranked.slice(0, options.perPinned ?? 1)) picker.take(sentence);
  }
  const focus = groupBy(candidates, (s) => focusWords(s, options.wordLevel));
  for (const id of sortedKeys(focus)) {
    picker.fill(id, (focus.get(id) ?? []).sort(shortest), picker.focus, options.focusPerWord);
  }
  const grammar = groupBy(candidates, (s) => s.grammarIds ?? []);
  for (const id of sortedKeys(grammar)) {
    picker.fill(id, (grammar.get(id) ?? []).sort(easiest), picker.grammar, options.perGrammar);
  }
  fillRest(picker, candidates, options);
  return [...picker.kept].sort(byRef);
}

/** How many N5–N3 focus words and grammar points reached their targets, for the build log. */
export function coverageReport(
  kept: readonly Sentence[],
  candidates: readonly Sentence[],
  options: Pick<CoverageOptions, 'wordLevel' | 'focusPerWord' | 'perGrammar'>,
): string {
  const count = (rows: readonly Sentence[], keys: (s: Sentence) => readonly string[]) => {
    const out = new Map<string, number>();
    for (const s of rows) bump(out, keys(s));
    return out;
  };
  const focus = (s: Sentence) => focusWords(s, options.wordLevel);
  const want = count(candidates, focus);
  const got = count(kept, focus);
  const full = [...want].filter(
    ([id, n]) => (got.get(id) ?? 0) >= Math.min(n, options.focusPerWord),
  );
  const grammar = count(kept, (s) => s.grammarIds ?? []);
  const rich = [...grammar.values()].filter((n) => n >= options.perGrammar).length;
  return (
    `${want.size} words have a focus sentence, ${full.length} got min(k, available); ` +
    `${grammar.size} grammar points used, ${rich} with at least ${options.perGrammar}`
  );
}

/** Counts per level, for the build log. */
export function countByLevel(sentences: readonly Sentence[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sentences) out[`N${s.level ?? '?'}`] = (out[`N${s.level ?? '?'}`] ?? 0) + 1;
  return out;
}
