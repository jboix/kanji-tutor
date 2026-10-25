/**
 * Quality figures of a pack's sentences for `bun run packs:measure`: length per level, the share
 * of fragments, slang left in, and how many words have focus sentences. Pure.
 */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Sentence } from '../../src/domain/types.ts';
import { casualRule } from './casual.ts';
import { focusWords } from './coverage.ts';
import { bodyLength } from './select.ts';

/** Body lengths under which a sentence counts as short, for the share columns. */
const SHORT = [6, 8, 10] as const;
/** Focus sentences per word that the selection aims for. */
const FOCUS_TARGET = 3;

function percentile(sorted: readonly number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}

function share(part: number, whole: number): string {
  return `${((100 * part) / Math.max(whole, 1)).toFixed(1)}%`;
}

/** One line per level: count, body length p10/p50/p90 and the share under each SHORT. */
function lengthLines(sentences: readonly Sentence[]): string[] {
  const levels = [...new Set(sentences.map((s) => s.level ?? 1))].sort((a, b) => b - a);
  return levels.map((level) => {
    const lengths = sentences
      .filter((s) => (s.level ?? 1) === level)
      .map((s) => bodyLength(s.text))
      .sort((a, b) => a - b);
    const shorts = SHORT.map(
      (n) => `<${n} ${share(lengths.filter((l) => l < n).length, lengths.length)}`,
    );
    const spread = [0.1, 0.5, 0.9].map((p) => percentile(lengths, p)).join('/');
    return `  N${level}: ${lengths.length} sentences, length p10/p50/p90 ${spread}, ${shorts.join(', ')}`;
  });
}

/**
 * Focus sentences per N5–N3 word, where the word is alone at the sentence's level, or shares it
 * with up to `atLevel - 1` others: how many words reach the target. Word levels come from the
 * pack's words (the JLPT lists), so the figures run lower than the build log's.
 */
function focusLine(
  sentences: readonly Sentence[],
  wordLevel: (id: string) => JlptLevel | undefined,
  atLevel: number,
) {
  const counts = new Map<string, number>();
  for (const s of sentences) {
    for (const id of focusWords(s, wordLevel, atLevel)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const full = [...counts.values()].filter((n) => n >= FOCUS_TARGET).length;
  const label = atLevel === 1 ? 'alone' : `with up to ${atLevel - 1} more`;
  return `  focus words (${label}) ${counts.size}: ${full} with ${FOCUS_TARGET}+ sentences, ${counts.size - full} with fewer`;
}

function casualLine(sentences: readonly Sentence[]): string {
  const hits = new Map<string, number>();
  for (const s of sentences) {
    const rule = casualRule(s.text);
    if (rule) hits.set(rule, (hits.get(rule) ?? 0) + 1);
  }
  const list = [...hits].map(([rule, n]) => `${rule} ${n}`).join(', ');
  return `  casual forms: ${list || 'none'}`;
}

/** The quality report, one figure per line. */
export function sentenceStats(
  sentences: readonly Sentence[],
  wordLevel: (id: string) => JlptLevel | undefined,
): string[] {
  const packed = sentences.filter((s) => s.source !== 'unit');
  return [
    `${packed.length} pack sentences (unit passages left out):`,
    ...lengthLines(packed),
    focusLine(packed, wordLevel, 1),
    focusLine(packed, wordLevel, 2),
    casualLine(packed),
  ];
}
