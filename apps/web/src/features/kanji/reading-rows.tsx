import type { KanjiDetail, ReadingRow } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { KnowledgeDots } from '../../ui/knowledge-dots.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TapWord } from '../../ui/word-tap.tsx';
import styles from './kanji.module.css';

const MAX_UNMET = 6;

function note(t: Translate, row: ReadingRow): string | undefined {
  if (row.newThisWeek) return t('kanji.newThisWeek');
  return row.level <= 1 ? t('kanji.seenOnce') : undefined;
}

/** 学生 · 先生 · 生活: Japanese in Klee One, separators in the UI font. */
function Examples({ words, ids = [] }: { words: string[]; ids?: readonly string[] }) {
  return words.map((word, i) => (
    <span key={word}>
      {i > 0 && ' · '}
      {ids[i] ? <TapWord form={word} wordId={ids[i]} /> : <Ja>{word}</Ja>}
    </span>
  ));
}

function Row({ kanji, row }: { kanji: string; row: ReadingRow }) {
  const t = useT();
  const Hook = useSlot('readingHook');
  const extra = note(t, row);
  const label = cx(
    styles.reading,
    row.misread && styles.misread,
    row.level <= 1 && !row.misread && styles.faint,
  );
  return (
    <li className={styles.row}>
      <div className={styles.rowMain}>
        <span lang="ja" className={label}>
          {row.label}
        </span>
        <span className={styles.examples}>
          <Examples words={row.examples} ids={row.exampleIds} />
          {extra && ` · ${extra}`}
        </span>
        <KnowledgeDots level={row.level} misread={row.misread} />
      </div>
      {Hook && (row.misread || row.newThisWeek) && (
        <Hook kanji={kanji} reading={row.reading} wordIds={row.wordIds} />
      )}
    </li>
  );
}

/** With no word of yours proving a reading yet, the dictionary's readings stand in. */
function Unmet({ unmet }: { unmet: string[] }) {
  const { rich } = useI18n();
  if (unmet.length === 0) return null;
  const more = unmet.length > MAX_UNMET ? ' …' : '';
  return (
    <p className={styles.unmet}>
      {rich('kanji.unmet', { readings: <Examples words={unmet.slice(0, MAX_UNMET)} /> })}
      {more}
    </p>
  );
}

/** HOW WELL YOU READ IT: one row per reading your words prove, with dots (kanji.html, K3). */
export function ReadingRows({ detail }: { detail: KanjiDetail }) {
  const t = useT();
  return (
    <section className={styles.readings} aria-label={t('kanji.howWell')}>
      <SectionLabel>{t('kanji.howWell')}</SectionLabel>
      {detail.rows.length > 0 ? (
        <ul className={styles.rows}>
          {detail.rows.map((row) => (
            <Row key={row.reading} kanji={detail.kanji.char} row={row} />
          ))}
        </ul>
      ) : (
        <Unmet unmet={detail.unmet} />
      )}
    </section>
  );
}
