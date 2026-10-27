/**
 * What a photo holds for the learner: how many of its kanji they read, the ones already theirs
 * (dictionary meanings, each to its page), and, in the tutor's box, the words with a new kanji,
 * each to add to their words, its reading marked when the dictionary did not confirm it.
 */
import { Link } from 'react-router';
import type { WildView } from '../../domain/services/index.ts';
import { AiBlock } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PlusIcon, TickIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import styles from './wild.module.css';

type Add = (wordIds: readonly string[]) => Promise<void>;

function Summary({ view }: { view: WildView }) {
  const t = useT();
  const known = view.kanji.filter((k) => k.known).length;
  return (
    <div className={styles.summary}>
      <h1 className={styles.headline}>
        {view.kanji.length > 0
          ? t('wild.summary', { known, total: view.kanji.length })
          : t('wild.summaryNone')}
      </h1>
      <p className={styles.legend}>
        <span className={styles.key}>
          <span className={styles.swatch} data-known="" aria-hidden="true" />
          {t('wild.keyKnown')}
        </span>
        <span className={styles.key}>
          <span className={styles.swatch} aria-hidden="true" />
          {t('wild.keyNew')}
        </span>
      </p>
    </div>
  );
}

function Yours({ view }: { view: WildView }) {
  const t = useT();
  const known = view.kanji.filter((k) => k.known);
  if (known.length === 0) return null;
  return (
    <section className={styles.group} aria-label={t('wild.yours')}>
      <h2 className={styles.groupTitle}>{t('wild.yours')}</h2>
      <ul className={styles.chips}>
        {known.map((k) => (
          <li key={k.char}>
            <Link to={paths.kanjiDetail(k.char)} className={styles.chip}>
              <Ja>{k.char}</Ja>
              {k.meaning && <span className={styles.chipMeaning}>{k.meaning}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NewWord(props: {
  word: WildView['words'][number];
  known: ReadonlySet<string>;
  onAdd: Add;
}) {
  const t = useT();
  const { word, known, onAdd } = props;
  const first =
    [...word.surface].find((c) => !known.has(c) && /\p{Script=Han}/u.test(c)) ?? word.surface;
  return (
    <li className={styles.word}>
      <span lang="ja" className={styles.tile} aria-hidden="true">
        {first}
      </span>
      <span className={styles.wordText}>
        <span className={styles.wordHead}>
          <Ja>{word.surface}</Ja>{' '}
          <span className={styles.kana} lang="ja">
            {word.reading}
          </span>
        </span>
        <span className={styles.meaning}>{word.meaning}</span>
        <span className={word.verified ? styles.checked : styles.unchecked}>
          {word.verified && <TickIcon />}
          {t(word.verified ? 'wild.checked' : 'wild.unchecked')}
        </span>
        {!word.wordId && <span className={styles.checked}>{t('wild.notWord')}</span>}
      </span>
      <AddButton word={word} onAdd={onAdd} />
    </li>
  );
}

function AddButton({ word, onAdd }: { word: WildView['words'][number]; onAdd: Add }) {
  const t = useT();
  const { wordId } = word;
  if (word.added) return <span className={styles.added}>{t('wild.added')}</span>;
  if (!wordId) return null;
  return (
    <PillButton
      variant="secondary"
      aria-label={t('wild.addLabel', { word: word.surface })}
      onClick={() => void onAdd([wordId])}
    >
      <PlusIcon />
      {t('wild.add')}
    </PillButton>
  );
}

function Fresh({ view, onAdd }: { view: WildView; onAdd: Add }) {
  const t = useT();
  const open = view.words.flatMap((w) => (w.wordId && !w.added ? [w.wordId] : []));
  const inWords = new Set(view.words.flatMap((w) => [...w.surface]));
  const known = new Set(view.kanji.filter((k) => k.known).map((k) => k.char));
  const others = view.kanji.filter((k) => !k.known && !inWords.has(k.char)).map((k) => k.char);
  if (view.words.length === 0 && others.length === 0) return null;
  return (
    <AiBlock label={t('wild.tutorLabel')} size="sm" readings={[]}>
      <p className={styles.place}>{view.place}</p>
      <h2 className={styles.groupTitle}>{t('wild.fresh')}</h2>
      <ul className={styles.words}>
        {view.words.map((word) => (
          <NewWord
            key={`${word.surface}:${word.reading}`}
            word={word}
            known={known}
            onAdd={onAdd}
          />
        ))}
      </ul>
      {others.length > 0 && (
        <p className={styles.more}>
          {t('wild.more')}
          <Ja>{others.join('、')}</Ja>
        </p>
      )}
      {open.length > 1 && (
        <PillButton variant="text" onClick={() => void onAdd(open)}>
          {t('wild.addAll', { n: open.length })}
        </PillButton>
      )}
    </AiBlock>
  );
}

/** The result (see the module comment). */
export function WildResult({ view, onAdd }: { view: WildView; onAdd: Add }) {
  return (
    <>
      <Summary view={view} />
      <Yours view={view} />
      <Fresh view={view} onAdd={onAdd} />
    </>
  );
}
