import { useEffect, useState } from 'react';
import { glossesIn } from '../../domain/localized.ts';
import type { Word } from '../../domain/types.ts';
import { BottomSheet, SheetHeading } from '../../ui/bottom-sheet.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { hasKanji } from '../../ui/furigana.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { PeekLink } from '../../ui/peek-link.tsx';
import { Reading } from '../../ui/reading.tsx';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import { useServices } from '../../ui/services.tsx';
import { useSlot, type WordSheetSlotProps } from '../../ui/slots.tsx';
import styles from './read.module.css';

type SheetProps = WordSheetSlotProps;

function useWord(wordId: string | undefined): Word | undefined {
  const { repos } = useServices();
  const [word, setWord] = useState<Word>();
  useEffect(() => {
    if (wordId === undefined) return;
    void repos.dictionary.word(wordId).then(setWord);
  }, [repos, wordId]);
  return word;
}

function KanjiLinks({ surface }: { surface: string }) {
  const chars = [...new Set([...surface].filter((c) => hasKanji(c) && c !== '々'))];
  if (chars.length === 0) return null;
  return (
    <p className={styles.kanjiLinks}>
      {chars.map((char) => (
        <PeekLink
          key={char}
          kind="kanji"
          id={char}
          label={char}
          lang="ja"
          className={styles.kanjiLink}
        >
          {char}
        </PeekLink>
      ))}
    </p>
  );
}

/** The word, its reading and first gloss, marked "(en)" when the pack lacks the language (N9). */
function Heading({ word, surface, first, fallback }: HeadingProps) {
  return (
    <SheetHeading word={word?.forms[0] ?? surface}>
      {word?.readings[0] && <Reading kana={word.readings[0]} />} {first && `· ${first}`}
      {first && <EnMark english={fallback} />}
    </SheetHeading>
  );
}

interface HeadingProps {
  word: Word | undefined;
  surface: string;
  first: string | undefined;
  fallback: boolean;
}

/** The offline dictionary sheet for a tapped word, used when no explain feature is wired. */
function DictionarySheet({ sentence, tokenIndex, onClose }: SheetProps) {
  const token = sentence.tokens[tokenIndex];
  const word = useWord(token?.wordId);
  const surface = token?.surface ?? '';
  const { t, language } = useI18n();
  const glosses = word ? glossesIn(word, language) : { value: [], fallback: false };
  const [first, ...rest] = glosses.value;
  return (
    <BottomSheet
      open
      onClose={onClose}
      label={t('read.inDictionary', { word: surface })}
      context={<RuledSentence sentence={sentence} size="context" target={[tokenIndex]} />}
      header={<Heading word={word} surface={surface} first={first} fallback={glosses.fallback} />}
    >
      {rest.length > 0 && (
        <ol className={styles.glosses}>
          {rest.map((gloss) => (
            <li key={gloss}>{gloss}</li>
          ))}
        </ol>
      )}
      {!word && <p className={styles.muted}>{t('read.notInDictionary')}</p>}
      <KanjiLinks surface={word?.forms[0] ?? surface} />
    </BottomSheet>
  );
}

/** The word sheet slot (explain feature, A2) when wired, else the offline dictionary sheet. */
export function WordSheet(props: SheetProps) {
  const Slot = useSlot('wordSheet');
  return Slot ? <Slot {...props} /> : <DictionarySheet {...props} />;
}
