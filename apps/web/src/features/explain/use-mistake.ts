import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AiClient, ExplainMistakeInput, MistakeExplanation } from '../../ai/types.ts';
import type { Repos } from '../../domain/repos.ts';
import { confusedKanji, kanjiWithParts } from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';
import type { MistakeSlotProps } from '../../ui/slots.tsx';
import { contextOf, spanSurface, wordSpan } from './sentence-context.ts';
import type { MistakeFacts } from './static-mistake.ts';
import { type AiState, useAiState } from './use-ai.ts';

interface Loaded {
  confused?: { kanji: string; lookalike: string } | undefined;
  facts: MistakeFacts;
  auto: boolean;
}

async function confusedParts(repos: Repos, pair: { kanji: string; lookalike: string }) {
  const [[kanji], [lookalike]] = await Promise.all([
    kanjiWithParts(repos, pair.kanji),
    kanjiWithParts(repos, pair.lookalike),
  ]);
  return kanji && lookalike ? { kanji, lookalike } : undefined;
}

/** The facts for the static note, the confused kanji for the cache key, and the Tutor setting. */
async function load(repos: Repos, key: Key, surface: string): Promise<Loaded> {
  const { grade, target } = key;
  const swapped = grade.errorType === 'wrong-kanji';
  const pair = swapped
    ? await confusedKanji(repos, target.wordId, target.readings, grade.given)
    : undefined;
  const parts = pair ? await confusedParts(repos, pair) : undefined;
  const settings = await repos.settings.get();
  const facts = { surface, expected: grade.expected, errorType: grade.errorType, confused: parts };
  return { confused: pair, facts, auto: settings.tutor === 'auto-mistakes' };
}

function inputOf(
  props: Omit<MistakeSlotProps, 'onOpenWord'>,
  surface: string,
  loaded: Loaded,
): ExplainMistakeInput {
  const { expected, given, errorType } = props.grade;
  return {
    sentence: contextOf(props.card.sentence),
    target: { surface, expected },
    answer: given || props.answer,
    ...(errorType ? { errorType } : {}),
    ...(loaded.confused ? { confused: loaded.confused } : {}),
  };
}

type Key = Pick<MistakeSlotProps, 'grade' | 'target'>;

function useLoaded({ grade, target }: Key, surface: string): Loaded | undefined {
  const { repos } = useServices();
  const [loaded, setLoaded] = useState<Loaded>();
  useEffect(() => {
    let live = true;
    void load(repos, { grade, target }, surface).then((l) => live && setLoaded(l));
    return () => {
      live = false;
    };
  }, [repos, grade, target, surface]);
  return loaded;
}

export interface Mistake {
  surface: string;
  facts: MistakeFacts | undefined;
  state: AiState<MistakeExplanation>;
  /** Undefined until the input is known; then one explainMistake call, from its `AiAction`. */
  ask: ((client: AiClient) => void) | undefined;
  peek: (client: AiClient) => Promise<unknown>;
  /** Settings → Tutor → "Also explain my mistakes automatically" (A13). */
  auto: boolean;
}

/**
 * A wrong answer's static facts first; `ask` runs explainMistake once (A13). With Settings →
 * Tutor → "Also explain my mistakes automatically", its `AiAction` runs it once by itself.
 */
export function useMistake(props: MistakeSlotProps): Mistake {
  const surface = spanSurface(
    props.card.sentence,
    wordSpan(props.card.sentence, props.target.tokenIndex),
  );
  const loaded = useLoaded(props, surface);
  const { card, answer, grade, target } = props;
  const input = useMemo(
    () => loaded && inputOf({ card, answer, grade, target }, surface, loaded),
    [card, answer, grade, target, surface, loaded],
  );
  const peek = useCallback(
    async (client: AiClient) => (input ? client.peek('explainMistake', input) : undefined),
    [input],
  );
  const [state, start] = useAiState<MistakeExplanation>();
  const ask = input && ((client: AiClient) => start(() => client.explainMistake(input)));
  return { surface, facts: loaded?.facts, state, ask, peek, auto: loaded?.auto ?? false };
}
