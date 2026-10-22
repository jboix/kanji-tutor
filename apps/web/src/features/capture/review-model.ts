/** Pure pieces of the capture review: candidate grammar points and which items are ticked. */
import type { AnalysedLine, CandidateWord } from '../../domain/services/index.ts';
import type { LineNote } from './use-line-notes.ts';

/** A grammar point the learner may add: quoted by an AI explanation, or typed by the learner. */
export interface GrammarCandidate {
  /** Pattern without 〜, e.g. わけではない. */
  id: string;
  fromAi: boolean;
}

/** Ticked state per candidate key; missing keys use the default (words and own grammar on). */
export type Picks = ReadonlyMap<string, boolean>;

export const wordKey = (word: CandidateWord) => `word:${word.wordId}`;
export const grammarKey = (grammar: GrammarCandidate) => `grammar:${grammar.id}`;

/** AI-quoted phrases from every loaded explanation, then the learner's own, minus tracked ones. */
export function grammarCandidates(
  notes: ReadonlyMap<number, LineNote>,
  manual: readonly GrammarCandidate[],
  tracked: ReadonlySet<string>,
): GrammarCandidate[] {
  const cited = [...notes.values()].flatMap((note) =>
    note.status === 'ready' ? note.cited.map((id) => ({ id, fromAi: true })) : [],
  );
  const byId = new Map<string, GrammarCandidate>();
  for (const candidate of [...manual, ...cited]) {
    if (!tracked.has(candidate.id) && !byId.has(candidate.id)) byId.set(candidate.id, candidate);
  }
  return [...byId.values()];
}

export function isWordPicked(picks: Picks, word: CandidateWord): boolean {
  return picks.get(wordKey(word)) ?? true;
}

/** Grammar quoted by AI starts unticked: the learner confirms it is this week's point. */
export function isGrammarPicked(picks: Picks, grammar: GrammarCandidate): boolean {
  return picks.get(grammarKey(grammar)) ?? !grammar.fromAi;
}

/** Candidate word ids that occur in one line, for "Turn into an exercise". */
export function lineWordIds(line: AnalysedLine | undefined, words: readonly CandidateWord[]) {
  const ids = new Set(line?.unknown.map((i) => line.tokens[i]?.wordId));
  return words.filter((word) => ids.has(word.wordId)).map((word) => word.wordId);
}
