import { FUNCTION_WORDS, matchesAt } from '../../domain/grammar/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { BottomSheet, SheetHeading } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import type { WordSheetSlotProps } from '../../ui/slots.tsx';
import { useRubyParts, WordRuby } from '../../ui/word-ruby.tsx';
import { AskField } from './ask-box.tsx';
import type { ChipContext } from './chip-actions.ts';
import styles from './explain.module.css';
import { NoSpoilProvider, useContextFurigana, useNoSpoil } from './no-spoil.tsx';
import { ParticleSheet } from './particle-sheet.tsx';
import { spanReading, spanSurface, wordSpan } from './sentence-context.ts';
import { SentenceUse } from './sentence-use.tsx';
import { useWordData, type WordData } from './use-word-data.ts';
import { BreakdownView, HeadingGloss, NuanceView, SheetFooter } from './word-sheet-parts.tsx';
import { GrammarNotes, KanjiParts, Senses, Translation } from './word-static.tsx';

function Heading(props: { sentence: Sentence; span: number[]; data: WordData }) {
  const surface = spanSurface(props.sentence, props.span);
  const reading = spanReading(props.sentence, props.span);
  const { hides } = useNoSpoil();
  const shown = hides(reading) ? '' : reading;
  // Furigana over each kanji (R11), never for a reading still to be answered (L3).
  const ruby = useRubyParts(surface, shown);
  return (
    <SheetHeading word={ruby ? <WordRuby parts={ruby} /> : surface}>
      <HeadingGloss
        explain={props.data.explain}
        surface={surface}
        word={props.data.word}
        reading={ruby ? '' : shown}
      />
    </SheetHeading>
  );
}

/** The tutor's part: two buttons, each one call, never both from one tap (A13). */
function Tutor({ data, surface, chips }: { data: WordData; surface: string; chips: ChipContext }) {
  const t = useT();
  return (
    <div className={styles.tutor}>
      <NuanceView
        state={data.explain}
        context={chips}
        onAsk={data.askExplain}
        peek={data.peekExplain}
      />
      {data.explain.status === 'done' && (
        <SentenceUse sentence={data.context} surface={surface} label={t('explain.whatItDoes')} />
      )}
      <BreakdownView state={data.breakdown} onAsk={data.askBreakdown} peek={data.peekBreakdown} />
    </div>
  );
}

/** Before the answer (U5): the word alone, nothing about the sentence it is tested in. */
function WordOnly({ data, surface }: { data: WordData; surface: string }) {
  return (
    <>
      <Senses word={data.word} surface={surface} />
      <KanjiParts kanji={data.kanji} />
    </>
  );
}

function SentenceParts(props: {
  sentence: Sentence;
  data: WordData;
  surface: string;
  wordId?: string | undefined;
}) {
  const { sentence, data, surface, wordId } = props;
  const t = useT();
  const previous = data.explain.status === 'done' ? data.explain.value.nuance : '';
  const chips: ChipContext = {
    sentence: data.context,
    sentenceId: sentence.id,
    surface,
    wordId,
    previous,
  };
  return (
    <>
      <GrammarNotes entries={data.grammar} label={t('explain.grammarHere')} />
      <Translation sentence={sentence} />
      <Tutor data={data} surface={surface} chips={chips} />
      <SheetFooter explain={data.explain} breakdown={data.breakdown} lesson={data.lesson} />
      <AskField context={data.context} sentenceId={sentence.id} surface={surface} wordId={wordId} />
    </>
  );
}

function WordSheetView({ sentence, tokenIndex, beforeAnswer, onClose }: WordSheetSlotProps) {
  const t = useT();
  const span = wordSpan(sentence, tokenIndex);
  const surface = spanSurface(sentence, span);
  const wordId = sentence.tokens[tokenIndex]?.wordId;
  const data = useWordData(sentence, surface, wordId);
  const furigana = useContextFurigana(sentence);
  return (
    <BottomSheet
      open
      onClose={onClose}
      label={t('explain.inSentence', { surface })}
      context={
        <RuledSentence sentence={sentence} size="context" target={span} furigana={furigana} />
      }
      header={<Heading sentence={sentence} span={span} data={data} />}
    >
      <WordOnly data={data} surface={surface} />
      {!beforeAnswer && (
        <SentenceParts sentence={sentence} data={data} surface={surface} wordId={wordId} />
      )}
    </BottomSheet>
  );
}

/** A particle the app has its own note on (G5), even when the pack resolved it to a word. */
function hasNote({ sentence, tokenIndex }: WordSheetSlotProps): boolean {
  return FUNCTION_WORDS.some((word) => matchesAt(word, sentence.tokens, tokenIndex));
}

/**
 * Tap a word (A2, A13, explain.html): what the app already knows first, with no AI: every
 * dictionary sense, each kanji with its parts, the sentence's catalogue grammar and translation.
 * The tutor runs only from its buttons (or a question). A particle opens its static note (G5).
 * In a session, nothing in it shows a reading of a target still to be answered (L3).
 */
export function ExplainWordSheet(props: WordSheetSlotProps) {
  const token = props.sentence.tokens[props.tokenIndex];
  const particle = token?.pos === 'particle' && (token.wordId === undefined || hasNote(props));
  return (
    <NoSpoilProvider card={props.noSpoil?.card} from={props.noSpoil?.from ?? 0}>
      {particle ? <ParticleSheet {...props} /> : <WordSheetView {...props} />}
    </NoSpoilProvider>
  );
}
