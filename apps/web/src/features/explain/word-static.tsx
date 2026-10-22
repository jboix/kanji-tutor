import { localGrammar } from '../../domain/content-language.ts';
import type { FunctionWord, GrammarEntry } from '../../domain/grammar/index.ts';
import { glossesIn, translationIn } from '../../domain/localized.ts';
import type { KanjiWithParts } from '../../domain/services/index.ts';
import type { Sentence, Word } from '../../domain/types.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { ExternalLink, ExternalLinks } from '../../ui/external-link.tsx';
import { jishoKanjiUrl, jishoWordUrl } from '../../ui/external-links.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { PeekLink } from '../../ui/peek-link.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './explain.module.css';

/** The word on Jisho (R9): its dictionary form, else the text as the sentence writes it. */
function WordLink({ word, surface }: { word: Word | undefined; surface: string }) {
  const text = word?.forms[0] ?? word?.readings[0] ?? surface;
  return (
    <ExternalLinks>
      <ExternalLink site="jisho" href={jishoWordUrl(text)} subject={text} />
    </ExternalLinks>
  );
}

/** Every sense in the dictionary, numbered, in the learner's language or marked English (N9). */
export function Senses({ word, surface }: { word: Word | undefined; surface: string }) {
  const { t, language } = useI18n();
  if (!word) {
    return (
      <>
        <p className={styles.status}>{t('explain.notInDictionary')}</p>
        <WordLink word={word} surface={surface} />
      </>
    );
  }
  const glosses = glossesIn(word, language);
  return (
    <section className={styles.section} aria-label={t('explain.inDictionary')}>
      <SectionLabel>{t('explain.inDictionary')}</SectionLabel>
      <ol className={styles.glosses}>
        {glosses.value.map((gloss) => (
          <li key={gloss}>
            {gloss}
            <EnMark english={glosses.fallback} />
          </li>
        ))}
      </ol>
      <WordLink word={word} surface={surface} />
    </section>
  );
}

function Parts({ kanji }: { kanji: KanjiWithParts }) {
  const t = useT();
  if (kanji.parts.length === 0) {
    return <p className={styles.kanjiLine}>{t('explain.singleShape')}</p>;
  }
  return (
    <p className={styles.kanjiLine}>
      <span className={styles.muted}>{t('explain.parts')} </span>
      {kanji.parts.map((part, i) => (
        <span key={part.char}>
          {i > 0 && ' + '}
          <Ja>{part.char}</Ja>
          {part.meaning && ` ${part.meaning}`}
        </span>
      ))}
    </p>
  );
}

/** Each kanji with its meanings and parts, linking to its kanji page. */
export function KanjiParts({ kanji }: { kanji: readonly KanjiWithParts[] }) {
  const t = useT();
  if (kanji.length === 0) return null;
  return (
    <section className={styles.section} aria-label={t('explain.itsKanji')}>
      <SectionLabel>{t('explain.itsKanji')}</SectionLabel>
      <ul className={styles.kanjiList}>
        {kanji.map((k) => (
          <li key={k.char} className={styles.kanjiRow}>
            <PeekLink
              kind="kanji"
              id={k.char}
              label={k.char}
              lang="ja"
              className={styles.kanjiLink}
            >
              {k.char}
            </PeekLink>
            <div className={styles.kanjiText}>
              <p className={styles.kanjiLine}>{k.meanings.join(', ') || t('explain.noMeaning')}</p>
              <Parts kanji={k} />
            </div>
            <ExternalLink site="jisho" href={jishoKanjiUrl(k.char)} subject={k.char} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Catalogue points as a list: pattern, meaning, level and the short explanation. */
export function GrammarNotes({
  entries: source,
  label,
}: {
  entries: readonly GrammarEntry[];
  label: string;
}) {
  const lookup = useContentLanguage();
  if (source.length === 0) return null;
  const entries = source.map((entry) => localGrammar(lookup, entry));
  return (
    <section className={styles.section} aria-label={label}>
      <SectionLabel>{label}</SectionLabel>
      <ul className={styles.notes}>
        {entries.map(({ value: entry, english }) => (
          <li key={entry.id}>
            <p className={styles.noteHead}>
              <Ja>{entry.pattern}</Ja> · {entry.meaning} (N{entry.level})
              <EnMark english={english} />
            </p>
            <p className={styles.muted}>{entry.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The sentence's translation from the packs, in the learner's language or marked English (N9). */
export function Translation({ sentence }: { sentence: Sentence }) {
  const { t, language } = useI18n();
  const { value, fallback } = translationIn(sentence, language);
  if (!value) return null;
  return (
    <section className={styles.section} aria-label={t('explain.whatItSays')}>
      <SectionLabel>{t('explain.whatItSays')}</SectionLabel>
      <p className={styles.translation}>
        “{value}”
        <EnMark english={fallback} />
      </p>
    </section>
  );
}

/** A particle or function word: what it does and its main uses, each with an example (G5). */
export function FunctionWordNote({ word, english }: { word: FunctionWord; english: boolean }) {
  const { rich } = useI18n();
  return (
    <section className={styles.section} aria-label={`${word.pattern}: ${word.meaning}`}>
      <p className={styles.noteHead}>
        <Ja>{word.pattern}</Ja> · {word.meaning} (N{word.level})
        <EnMark english={english} />
      </p>
      <p className={styles.muted}>{word.explanation}</p>
      <ul className={styles.uses}>
        {word.uses.map((u) => (
          <li key={u.example}>
            <span className={styles.useName}>{u.use}</span>
            <Ja variant="line">{u.example}</Ja>
            <span className={styles.gloss}>{u.translation}</span>
          </li>
        ))}
      </ul>
      <PeekLink
        kind="grammar"
        id={word.id}
        label={word.pattern}
        className={`${styles.link} ${styles.more}`}
      >
        {rich('explain.moreAbout', { pattern: <Ja>{word.pattern}</Ja> })}
      </PeekLink>
    </section>
  );
}
