/**
 * Tap-a-word in JLPT questions (U5). A stem is cut from its source sentence, so the text
 * around the marked span keeps its tokens. Before the answer that text is read from the sentence
 * with the span masked (`maskSentence`), so no sheet shows the hidden word, its kanji spelling,
 * the translation or the grammar; after it, the real sentence opens everywhere.
 */
import { type ReactNode, useEffect, useState } from 'react';
import { PATTERN_BLANK } from '../../domain/drills/index.ts';
import type { ComprehensionSet } from '../../domain/questions/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';
import { TapRun } from '../../ui/word-tap.tsx';
import { maskSentence } from '../../ui/word-tap-data.ts';

export interface StemRange {
  from: number;
  to: number;
}

/** Where a stem's marked span sits in its sentence; undefined when the stem was not cut from it. */
export function stemRange(
  sentence: Sentence | undefined,
  before: string,
  after: string,
): StemRange | undefined {
  if (!sentence || sentence.tokens.length === 0) return undefined;
  const { text } = sentence;
  const fits = text.startsWith(before) && text.endsWith(after);
  if (!fits || before.length + after.length > text.length) return undefined;
  return { from: before.length, to: text.length - after.length };
}

/**
 * The tappable text before and after the span; `fill` stands in for it until answered. `skip`
 * characters right after the span are left out of `after`, for the caller to place (U8).
 */
export function aroundSpan(
  sentence: Sentence,
  range: StemRange,
  answered: boolean,
  fill = PATTERN_BLANK,
  skip = 0,
): { before: ReactNode; after: ReactNode } {
  if (answered) {
    return {
      before: <TapRun sentence={sentence} from={0} to={range.from} />,
      after: <TapRun sentence={sentence} from={range.to + skip} to={sentence.text.length} />,
    };
  }
  const masked = maskSentence(sentence, range.from, range.to, fill);
  const shut = { locked: masked.locked, beforeAnswer: true };
  const end = masked.sentence.text.length;
  return {
    before: <TapRun sentence={masked.sentence} from={0} to={range.from} {...shut} />,
    after: (
      <TapRun
        sentence={masked.sentence}
        from={range.from + fill.length + skip}
        to={end}
        {...shut}
      />
    ),
  };
}

/** The stored passage lines of a unit's 読解 set (`unit:<id>:<line>`), with their tokens. */
export function usePassageLines(set: ComprehensionSet): (Sentence | undefined)[] {
  const { repos } = useServices();
  const [lines, setLines] = useState<(Sentence | undefined)[]>([]);
  const { id, sentences } = set;
  useEffect(() => {
    let live = true;
    const ids = sentences.map((_, i) => `${id}:${i}`);
    repos.sentences.getMany(ids).then(
      (found) => live && setLines(found),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [repos, id, sentences]);
  return lines;
}

/** A passage line, its words tappable when the packs have it with its tokens. */
export function PassageText(props: {
  text: string;
  line: Sentence | undefined;
  open: boolean;
  beforeAnswer: boolean;
}) {
  const { line, text } = props;
  if (!props.open || !line || line.text !== text || line.tokens.length === 0) return text;
  return <TapRun sentence={line} from={0} to={text.length} beforeAnswer={props.beforeAnswer} />;
}
