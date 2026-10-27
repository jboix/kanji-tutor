import type { ReactNode } from 'react';
import { EnMark } from '../../ui/en-mark.tsx';
import { KanjiLinks } from '../../ui/external-link.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { WordRuby } from '../../ui/word-ruby.tsx';
import type { Part } from './parts-hook.ts';
import styles from './teach.module.css';
import type { KanjiCard, WordTeaching } from './word-teaching.ts';

function PartsLine({ parts }: { parts: readonly Part[] }) {
  const t = useT();
  if (parts.length === 0) return <p className={styles.kanjiLine}>{t('teach.singleShape')}</p>;
  return (
    <p className={styles.kanjiLine}>
      <span className={styles.muted}>{t('teach.parts')} </span>
      {parts.map((part, i) => (
        <span key={part.char}>
          {i > 0 && ' + '}
          <Ja>{part.char}</Ja>
          {part.meaning && ` ${part.meaning}`}
        </span>
      ))}
    </p>
  );
}

/** A kanji with its meanings and parts; with readings, links to Jisho and Wiktionary too (R9). The hint (L2) has
 * none, since an outside dictionary shows the readings it hides. */
function KanjiRow({ kanji, readings }: { kanji: KanjiCard; readings: boolean }) {
  const t = useT();
  return (
    <li className={styles.kanjiRow}>
      <span className={styles.kanjiHead}>
        <span lang="ja" className={styles.kanjiChar}>
          {kanji.char}
        </span>
      </span>
      <p className={styles.kanjiLine}>{kanji.meanings.join(', ') || t('teach.noMeaning')}</p>
      <PartsLine parts={kanji.parts} />
      {readings && kanji.usedReading && (
        <p className={styles.kanjiLine}>
          <span className={styles.muted}>{t('teach.inThisWord')} </span>
          <Ja variant="emph">{kanji.usedReading}</Ja>
        </p>
      )}
      {readings && kanji.otherReadings.length > 0 && (
        <p className={styles.kanjiLine}>
          <span className={styles.muted}>{t('teach.otherReadings')} </span>
          <Ja>{kanji.otherReadings.join('、')}</Ja>
        </p>
      )}
      {readings && (
        <div className={styles.kanjiLinks}>
          <KanjiLinks char={kanji.char} />
        </div>
      )}
    </li>
  );
}

/** "Here: にち · usually: ひ" when this sentence reads the word another way (R15). */
function HereUsually({ teaching }: { teaching: WordTeaching }) {
  const { rich } = useI18n();
  if (!teaching.usual || !teaching.reading) return null;
  const here = <Ja>{teaching.reading}</Ja>;
  const usual = <Ja>{teaching.usual}</Ja>;
  return (
    <p className={styles.muted} data-here-usually="">
      {rich('teach.hereUsually', { here, usual })}
    </p>
  );
}

export interface TeachingContentProps {
  teaching: WordTeaching;
  /** False in the no-spoil hint (L2): no reading, no other readings. */
  readings: boolean;
  /** "Why it's here" lines; left out by the hint. */
  why?: boolean;
  /** The memory hook block. */
  hook: ReactNode;
}

/** The word, its meaning, each kanji with its parts, why it is here and a hook (L1, L2). */
export function TeachingContent({ teaching, readings, why = true, hook }: TeachingContentProps) {
  const t = useT();
  return (
    <>
      <div className={styles.head}>
        <p lang="ja" className={styles.word}>
          {readings && teaching.ruby ? <WordRuby parts={teaching.ruby} /> : teaching.surface}
        </p>
        {readings && <HereUsually teaching={teaching} />}
        <p className={styles.meaning}>
          {teaching.meanings.join('; ') || t('teach.notInDictionary')}
          <EnMark english={teaching.meaningsInEnglish} />
        </p>
        {teaching.pos && <p className={styles.muted}>{teaching.pos}</p>}
      </div>
      {teaching.kanji.length > 0 && (
        <section className={styles.section} aria-label={t('teach.itsKanji')}>
          <SectionLabel>{t('teach.itsKanji')}</SectionLabel>
          <ul className={styles.kanjiList}>
            {teaching.kanji.map((kanji) => (
              <KanjiRow key={kanji.char} kanji={kanji} readings={readings} />
            ))}
          </ul>
        </section>
      )}
      {why && (
        <section className={styles.section} aria-label={t('teach.whyHere')}>
          <SectionLabel>{t('teach.whyHere')}</SectionLabel>
          <ul className={styles.lines}>
            {teaching.why.map((line) => (
              <li key={line}>
                <JaLine text={line} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className={styles.section} aria-label={t('teach.hookLabel')}>
        <SectionLabel>{t('teach.hookLabel')}</SectionLabel>
        {hook}
      </section>
    </>
  );
}

const JA_RUN = /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+)/u;

/** A line of app copy that may carry a lesson tag in Japanese (Tobira 第4課). */
function JaLine({ text }: { text: string }) {
  let at = 0;
  return text.split(JA_RUN).map((part, i) => {
    const key = at;
    at += part.length;
    return i % 2 === 1 ? <Ja key={key}>{part}</Ja> : <span key={key}>{part}</span>;
  });
}
