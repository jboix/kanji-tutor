/** The Learn hub's look-up (IA4): kanji typed, grammar patterns that match. Static, offline. */
import { FUNCTION_WORDS, GRAMMAR_CATALOGUE } from '../../domain/grammar/index.ts';
import { hasKanji } from '../../ui/furigana.ts';

/** The kanji in a query, once each, in order. */
export function kanjiIn(text: string): string[] {
  return [...new Set([...text].filter((c) => hasKanji(c) && c !== '々'))];
}

export interface GrammarMatch {
  id: string;
  pattern: string;
}

/** A pattern as typed: no 〜, no sense in brackets ("から (from)" → "から"). */
function bare(pattern: string): string {
  return pattern.replace(/[〜～]/g, '').replace(/\s*[(（].*$/, '');
}

/** Grammar points and particles whose pattern starts with, then contains, the query. */
export function grammarMatches(query: string, limit = 4): GrammarMatch[] {
  const q = bare(query.trim());
  if (q === '') return [];
  const all = [...GRAMMAR_CATALOGUE, ...FUNCTION_WORDS].map((e) => ({
    id: e.id,
    pattern: e.pattern,
    key: bare(e.pattern),
  }));
  const starts = all.filter((e) => e.key.startsWith(q));
  const contains = all.filter((e) => !e.key.startsWith(q) && e.key.includes(q));
  return [...starts, ...contains].slice(0, limit).map(({ id, pattern }) => ({ id, pattern }));
}
