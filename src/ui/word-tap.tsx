/**
 * Tap a word anywhere (U5, D63): the one way a screen makes Japanese from its data open the word
 * sheet slot (or the particle note). Each piece owns its sheet. Exercises pass the tokens that
 * stay shut (`locked`) and, before the answer, a masked sentence with `beforeAnswer`.
 */
import { type ReactNode, useState } from 'react';
import type { Sentence } from '../domain/types.ts';
import { knownFurigana, useAllFurigana } from './furigana-mode.tsx';
import { RuledSentence, type RuledSentenceProps } from './ruled-sentence.tsx';
import { useSlot } from './slots.tsx';
import { useTokens } from './use-tokens.ts';
import { looseSentence, opensSheet, sliceTokens, wordSentence } from './word-tap-data.ts';

export type OpenWord = (sentence: Sentence, tokenIndex: number) => void;

interface Opened {
  sentence: Sentence;
  tokenIndex: number;
}

/**
 * The word sheet for whatever this screen part shows: `open` is undefined when no feature fills
 * the slot (nothing is tappable then); render `sheet` next to the text.
 */
export function useWordSheet(beforeAnswer = false): { open?: OpenWord; sheet: ReactNode } {
  const Sheet = useSlot('wordSheet');
  const [opened, setOpened] = useState<Opened>();
  if (!Sheet) return { sheet: null };
  const open: OpenWord = (sentence, tokenIndex) => setOpened({ sentence, tokenIndex });
  const sheet = opened && (
    <Sheet
      sentence={opened.sentence}
      tokenIndex={opened.tokenIndex}
      {...(beforeAnswer ? { beforeAnswer } : {})}
      onClose={() => setOpened(undefined)}
    />
  );
  return { open, sheet };
}

export interface TapProps {
  /** Token indices that do not open: the target, the blank, the cut pieces around it. */
  locked?: readonly number[];
  /** Not answered yet: the sentence is masked and the sheet shows the word alone (D63). */
  beforeAnswer?: boolean;
}

type SentenceProps = Omit<RuledSentenceProps, 'onTokenTap' | 'tappable' | 'sentence'> &
  TapProps & { sentence: Sentence };

const opens = (locked: readonly number[]) => (token: Sentence['tokens'][number], i: number) =>
  opensSheet(token) && !locked.includes(i);

/** The furigana to show: the caller's, and with ふ on every kanji word that is not shut (R12). */
function useFurigana(
  tokens: readonly Sentence['tokens'][number][],
  shut: (index: number) => boolean,
  own: readonly number[] = [],
): readonly number[] {
  const all = useAllFurigana();
  if (!all) return own;
  return [...new Set([...own, ...knownFurigana(tokens, shut)])];
}

/** A `RuledSentence` whose words open the word sheet. */
export function TapSentence({ locked = [], beforeAnswer = false, ...props }: SentenceProps) {
  const { open, sheet } = useWordSheet(beforeAnswer);
  const furigana = useFurigana(props.sentence.tokens, (i) => locked.includes(i), props.furigana);
  const tap = open && {
    onTokenTap: (i: number) => open(props.sentence, i),
    tappable: opens(locked),
  };
  return (
    <>
      <RuledSentence {...props} furigana={furigana} {...tap} />
      {sheet}
    </>
  );
}

/**
 * The part [from, to) of a sentence, inline, its whole words tappable (a question stem around
 * its blank). A word the range cuts shows as plain text.
 */
export function TapRun(props: TapProps & { sentence: Sentence; from: number; to: number }) {
  const { sentence, locked = [], beforeAnswer = false } = props;
  const { open, sheet } = useWordSheet(beforeAnswer);
  const { run, origin } = sliceTokens(sentence, props.from, props.to);
  const at = (i: number) => origin[i] ?? -1;
  const furigana = useFurigana(run.tokens, (i) => locked.includes(at(i)));
  const tap = open && {
    onTokenTap: (i: number) => open(sentence, at(i)),
    tappable: (token: Sentence['tokens'][number], i: number) => opens(locked)(token, at(i)),
  };
  return (
    <>
      <RuledSentence sentence={run} inline furigana={furigana} {...tap} />
      {sheet}
    </>
  );
}

interface WordProps {
  form: string;
  wordId?: string | undefined;
  reading?: string | undefined;
}

/** One dictionary word (a kanji page example, a Learned row), tappable when its id is known. */
export function TapWord({ form, wordId, reading }: WordProps) {
  if (!wordId) return <span lang="ja">{form}</span>;
  return <TapSentence sentence={wordSentence(form, wordId, reading)} inline />;
}

/**
 * Japanese with no tokens of its own (an authored example, an option): looked up as one word in
 * the packs, else tokenized by the worker, which loads only now (D63). Plain text until then.
 * `word`: a word list entry, never tokenized.
 */
export function TapText({ text, id, word = false }: { text: string; id: string; word?: boolean }) {
  const wired = useSlot('wordSheet') !== undefined;
  const tokens = useTokens(text, wired, !word);
  if (!tokens) return <span lang="ja">{text}</span>;
  return <TapSentence sentence={looseSentence(id, text, tokens)} inline />;
}
