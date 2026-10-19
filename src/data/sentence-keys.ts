/**
 * Level keys of a sentence row (Dexie v4, D40): one multiEntry index entry per word and per
 * grammar point, tagged with the sentence level, so "sentences with this word at or below N4" is
 * one index range instead of a scan of every sentence with the word.
 *
 * A DBCore middleware adds them to every sentence written, whoever writes it (packs, repos,
 * backup import), and they never need to be in the pack files.
 */
import type { DBCore, DBCoreMutateRequest, DBCoreTable, Middleware } from 'dexie';
import type { JlptLevel } from '../domain/learner-view.ts';
import type { Sentence } from '../domain/types.ts';

/** A stored sentence: the sentence plus its derived index keys. */
export interface SentenceRow extends Sentence {
  levelKeys?: string[];
}

export function wordKey(wordId: string, level: JlptLevel): string {
  return `w${wordId}:${level}`;
}

export function grammarKey(grammarId: string, level: JlptLevel): string {
  return `g${grammarId}:${level}`;
}

/** `w<word id>:<level>` and `g<grammar id>:<level>` keys; none when the sentence has no level. */
export function levelKeys(sentence: Sentence): string[] {
  const level = sentence.level;
  if (level === undefined) return [];
  return [
    ...sentence.wordIds.map((id) => wordKey(id, level)),
    ...(sentence.grammarIds ?? []).map((id) => grammarKey(id, level)),
  ];
}

function withKeys(row: SentenceRow): SentenceRow {
  const { levelKeys: _old, ...sentence } = row;
  const keys = levelKeys(sentence);
  return keys.length > 0 ? { ...sentence, levelKeys: keys } : sentence;
}

function mapRequest(req: DBCoreMutateRequest): DBCoreMutateRequest {
  if (req.type !== 'add' && req.type !== 'put') return req;
  return { ...req, values: req.values.map((row: SentenceRow) => withKeys(row)) };
}

function keyedTable(table: DBCoreTable): DBCoreTable {
  return { ...table, mutate: (req) => table.mutate(mapRequest(req)) };
}

/** Keeps `levelKeys` in step with `level`, `wordIds` and `grammarIds` on every write. */
export const sentenceKeysMiddleware: Middleware<DBCore> = {
  stack: 'dbcore',
  name: 'sentence-level-keys',
  create: (down) => ({
    ...down,
    table: (name) => (name === 'sentences' ? keyedTable(down.table(name)) : down.table(name)),
  }),
};

/** A row as a plain `Sentence`, without its index keys. */
export function toSentence(row: SentenceRow): Sentence {
  const { levelKeys: _keys, ...sentence } = row;
  return sentence;
}
