import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AiClient,
  BreakdownInput,
  ExplainWordInput,
  SentenceBreakdown,
  SentenceContext,
  WordExplanation,
} from '../../ai/types.ts';
import { type GrammarEntry, sentenceGrammar } from '../../domain/grammar/index.ts';
import { itemId } from '../../domain/ids.ts';
import type { Repos } from '../../domain/repos.ts';
import { type KanjiWithParts, kanjiWithParts } from '../../domain/services/index.ts';
import type { Sentence, Word } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';
import { contextOf } from './sentence-context.ts';
import { type AiState, useAiState } from './use-ai.ts';

/** Where the word or the sentence's grammar point comes from, for the sheet's footer. */
export interface SourceLesson {
  what: 'grammar' | 'word';
  lesson: string;
}

async function sourceLesson(
  repos: Repos,
  sentence: Sentence,
  wordId: string | undefined,
): Promise<SourceLesson | undefined> {
  const grammarId = sentence.grammarIds?.[0];
  const grammar = grammarId ? await repos.grammar.get(grammarId) : undefined;
  if (grammar?.lesson) return { what: 'grammar', lesson: grammar.lesson };
  const item = wordId ? await repos.items.get(itemId('word', wordId)) : undefined;
  return item?.source.lesson ? { what: 'word', lesson: item.source.lesson } : undefined;
}

interface Offline {
  word?: Word | undefined;
  kanji: KanjiWithParts[];
  lesson?: SourceLesson | undefined;
}

async function loadOffline(repos: Repos, sentence: Sentence, surface: string, wordId?: string) {
  const word = wordId ? await repos.dictionary.word(wordId) : undefined;
  const [kanji, lesson] = await Promise.all([
    kanjiWithParts(repos, word?.forms[0] ?? surface),
    sourceLesson(repos, sentence, wordId),
  ]);
  return { word, kanji, lesson };
}

/** The dictionary entry, kanji parts and lesson of the tapped word: no AI (A13). */
const NOTHING_YET: Offline = { kanji: [] };

/** The dictionary entry and the kanji, and whether they have loaded. */
function useOffline(
  sentence: Sentence,
  surface: string,
  wordId: string | undefined,
): [Offline, boolean] {
  const { repos } = useServices();
  const [offline, setOffline] = useState<Offline | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setOffline(undefined);
    void loadOffline(repos, sentence, surface, wordId).then((o) => live && setOffline(o));
    return () => {
      live = false;
    };
  }, [repos, sentence, surface, wordId]);
  return [offline ?? NOTHING_YET, offline !== undefined];
}

/** The general explanation's input: keyed on the word, not the sentence (A15). */
export function wordInput(
  context: SentenceContext,
  surface: string,
  wordId: string | undefined,
  word: Word | undefined,
): ExplainWordInput {
  const entry = word && {
    form: word.forms[0] ?? word.readings[0] ?? surface,
    meanings: word.glosses.slice(0, 5),
    ...(word.readings[0] ? { reading: word.readings[0] } : {}),
  };
  return {
    sentence: context,
    surface,
    ...(wordId ? { wordId } : {}),
    ...(entry ? { word: entry } : {}),
  };
}

export interface WordData extends Offline {
  context: SentenceContext;
  grammar: GrammarEntry[];
  explain: AiState<WordExplanation>;
  breakdown: AiState<SentenceBreakdown>;
  /** "Ask the tutor about this word": one explainWord call, from its `AiAction`. */
  askExplain: (client: AiClient) => void;
  peekExplain: (client: AiClient) => Promise<unknown>;
  /** "Break down with the tutor": one breakdownSentence call, from its `AiAction`. */
  askBreakdown: (client: AiClient) => void;
  peekBreakdown: (client: AiClient) => Promise<unknown>;
}

/**
 * The saved answers' lookups. The explanation's input includes the dictionary entry: it looks
 * once the entry is in, so "Saved" never shows for the incomplete input and then goes.
 */
function usePeeks(input: ExplainWordInput, parts: BreakdownInput, loaded: boolean) {
  const peekExplain = useCallback(
    (client: AiClient) => (loaded ? client.peek('explainWord', input) : Promise.resolve(undefined)),
    [input, loaded],
  );
  const peekBreakdown = useCallback(
    (client: AiClient) => client.peek('breakdownSentence', parts),
    [parts],
  );
  return { peekExplain, peekBreakdown };
}

/**
 * Everything the word sheet shows. The dictionary entry, kanji parts and catalogue grammar load
 * at once; the tutor's explanation and breakdown only when asked, each by its own `AiAction`,
 * which says "Saved" when the tutor already answered (A13, A15, A18).
 */
export function useWordData(sentence: Sentence, surface: string, wordId?: string): WordData {
  const context = useMemo(() => contextOf(sentence), [sentence]);
  const grammar = useMemo(() => sentenceGrammar(sentence), [sentence]);
  const [offline, loaded] = useOffline(sentence, surface, wordId);
  const input = useMemo(
    () => wordInput(context, surface, wordId, offline.word),
    [context, surface, wordId, offline.word],
  );
  const parts = useMemo(() => ({ sentence: context, focus: surface }), [context, surface]);
  const { peekExplain, peekBreakdown } = usePeeks(input, parts, loaded);
  const [explain, startExplain] = useAiState<WordExplanation>();
  const [breakdown, startBreakdown] = useAiState<SentenceBreakdown>();
  return {
    context,
    grammar,
    ...offline,
    explain,
    breakdown,
    askExplain: (client) => startExplain(() => client.explainWord(input)),
    peekExplain,
    askBreakdown: (client) => startBreakdown(() => client.breakdownSentence(parts)),
    peekBreakdown,
  };
}
