/** The grammar pack (G1, G4): every catalogue point with up to eight example sentences. Pure. */
import { GRAMMAR_CATALOGUE } from '../../src/domain/grammar/catalogue.ts';
import { toGrammarPoint } from '../../src/domain/grammar/detect.ts';
import type { GrammarEntry } from '../../src/domain/grammar/types.ts';
import type { GrammarPoint, Sentence } from '../../src/domain/types.ts';

export const EXAMPLES_PER_POINT = 8;

const easiest = (a: Sentence, b: Sentence) =>
  (b.level ?? 0) - (a.level ?? 0) ||
  a.text.length - b.text.length ||
  Number(a.sourceRef) - Number(b.sourceRef);

/** Catalogue points as `GrammarPoint`s, marked `catalogue`, with their easiest examples first. */
export function buildGrammarPack(
  sentences: readonly Sentence[],
  catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE,
): GrammarPoint[] {
  const byPoint = new Map<string, Sentence[]>();
  for (const s of sentences) {
    for (const id of s.grammarIds ?? []) {
      const list = byPoint.get(id);
      if (list) list.push(s);
      else byPoint.set(id, [s]);
    }
  }
  return catalogue.map((entry) => ({
    ...toGrammarPoint(entry),
    exampleSentenceIds: (byPoint.get(entry.id) ?? [])
      .sort(easiest)
      .slice(0, EXAMPLES_PER_POINT)
      .map((s) => s.id),
    catalogue: true as const,
  }));
}
