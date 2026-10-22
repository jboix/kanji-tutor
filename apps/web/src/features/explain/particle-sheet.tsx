import { useMemo } from 'react';
import { localFunctionWord } from '../../domain/content-language.ts';
import { functionWordNotes, type GrammarEntry } from '../../domain/grammar/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { BottomSheet, SheetHeading } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import type { WordSheetSlotProps } from '../../ui/slots.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { AskField } from './ask-box.tsx';
import styles from './explain.module.css';
import { useContextFurigana } from './no-spoil.tsx';
import { contextOf } from './sentence-context.ts';
import { SentenceUse } from './sentence-use.tsx';
import { FunctionWordNote, GrammarNotes, Translation } from './word-static.tsx';

/** The sentence-wide part: grammar it belongs to, the translation, the tutor, the ask box. */
function AboutSentence(props: {
  sentence: Sentence;
  grammar: readonly GrammarEntry[];
  surface: string;
}) {
  const { sentence, surface } = props;
  const t = useT();
  const context = useMemo(() => contextOf(sentence), [sentence]);
  return (
    <>
      <GrammarNotes entries={props.grammar} label={t('explain.partOf')} />
      <Translation sentence={sentence} />
      <div className={styles.tutor}>
        <SentenceUse sentence={context} surface={surface} label={t('explain.askAboutHere')} />
      </div>
      <AskField context={context} sentenceId={sentence.id} surface={surface} />
    </>
  );
}

/** The sentence above the sheet, the particle picked out, furigana with ふ (R12). */
function Context({ sentence, tokenIndex }: { sentence: Sentence; tokenIndex: number }) {
  const furigana = useContextFurigana(sentence);
  return (
    <RuledSentence sentence={sentence} size="context" target={[tokenIndex]} furigana={furigana} />
  );
}

/**
 * A tapped particle or function word (G5): the app's own note on it, with its main uses and an
 * example for each, and the catalogue points it is part of. No AI unless asked.
 */
export function ParticleSheet({ sentence, tokenIndex, beforeAnswer, onClose }: WordSheetSlotProps) {
  const t = useT();
  const surface = sentence.tokens[tokenIndex]?.surface ?? '';
  const notes = useMemo(
    () => functionWordNotes(sentence.tokens, tokenIndex),
    [sentence, tokenIndex],
  );
  const lookup = useContentLanguage();
  const words = notes.words.map((word) => localFunctionWord(lookup, word));
  const first = words[0]?.value;
  return (
    <BottomSheet
      open
      onClose={onClose}
      label={t('explain.inSentence', { surface })}
      context={<Context sentence={sentence} tokenIndex={tokenIndex} />}
      header={
        <SheetHeading word={surface}>{first ? first.meaning : t('explain.particle')}</SheetHeading>
      }
    >
      {words.map(({ value, english }) => (
        <FunctionWordNote key={value.id} word={value} english={english} />
      ))}
      {notes.words.length === 0 && notes.grammar.length === 0 && (
        <p className={styles.status}>{t('explain.noParticleNote')}</p>
      )}
      {!beforeAnswer && (
        <AboutSentence sentence={sentence} grammar={notes.grammar} surface={surface} />
      )}
    </BottomSheet>
  );
}
