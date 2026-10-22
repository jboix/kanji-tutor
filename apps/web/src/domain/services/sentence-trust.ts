/**
 * The reading checks every session sentence passes (D13, D18): each content token's reading is a
 * JMdict reading of its word, and a lone kanji the learner may be asked about has its most
 * likely reading (間 → あいだ, not ま). Sessions and drills share them.
 */
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import { FUNCTION_POS, KNOWN_LEVEL } from '../selector.ts';
import type { KnowledgeLevel, Sentence, Token, Word } from '../types.ts';
import { isLoneKanji, preferredReading, readingFits } from './reading-check.ts';

const isContent = (token: Token) => !FUNCTION_POS.has(token.pos) && hasKanji(token.surface);

/** What the reading filter needs: dictionary entries and the preferred lone-kanji readings. */
interface Checks {
  words: Map<string, Word>;
  preferred: Map<string, string | undefined>;
  levels: ReadonlyMap<string, KnowledgeLevel>;
}

function contentTokens(sentences: readonly Sentence[]): Token[] {
  return sentences.flatMap((sentence) => sentence.tokens.filter(isContent));
}

async function loadChecks(
  repos: Repos,
  sentences: readonly Sentence[],
  levels: ReadonlyMap<string, KnowledgeLevel>,
): Promise<Checks> {
  const tokens = contentTokens(sentences);
  const ids = [...new Set(tokens.flatMap((token) => token.wordId ?? []))];
  const entries = await repos.dictionary.words(ids);
  const words = new Map(
    entries.flatMap((word): [string, Word][] => (word ? [[word.id, word]] : [])),
  );
  const lone = [...new Set(tokens.filter(isLoneKanji).map((token) => token.surface))];
  const preferred = new Map(
    await Promise.all(
      lone.map(
        async (char) =>
          [char, preferredReading(char, await repos.dictionary.wordsByText(char))] as const,
      ),
    ),
  );
  return { words, preferred, levels };
}

/**
 * A token's reading may be shown and graded: it is one of its word's JMdict readings, and a lone
 * kanji that could become a target (not yet known) has its most likely reading (間 → あいだ).
 */
function trusted(token: Token, checks: Checks): boolean {
  if (token.wordId === undefined) return true;
  const word = checks.words.get(token.wordId);
  if (!word || !readingFits(token, word)) return false;
  const targetable = (checks.levels.get(token.wordId) ?? 0) < KNOWN_LEVEL;
  if (!targetable || !isLoneKanji(token)) return true;
  return checks.preferred.get(token.surface) === toKanaFold(token.reading);
}

/**
 * The sentences whose every content token has a reading that may be shown and graded (D13,
 * D18): a JMdict reading of its word, and the most likely one for a lone kanji not yet known.
 */
export async function trustedSentences(
  repos: Repos,
  sentences: readonly Sentence[],
  levels: ReadonlyMap<string, KnowledgeLevel>,
): Promise<Sentence[]> {
  const checks = await loadChecks(repos, sentences, levels);
  return sentences.filter((s) => s.tokens.every((t) => !isContent(t) || trusted(t, checks)));
}
