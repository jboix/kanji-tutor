import { Link } from 'react-router';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { readingsLine, type Segment, wordsLine } from './detail-text.ts';
import styles from './handwrite.module.css';
import { useCandidateDetail } from './use-candidate-detail.ts';

export interface CandidateRowProps {
  chars: readonly string[];
  picked: string | undefined;
  onPick: (char: string) => void;
}

/** Ranked candidates as 58px circles; the picked one is filled ink (handwrite.html). */
export function CandidateRow({ chars, picked, onPick }: CandidateRowProps) {
  const t = useT();
  return (
    <ul aria-label={t('handwrite.candidates')} className={styles.candidates}>
      {chars.map((char) => (
        <li key={char}>
          <button
            type="button"
            lang="ja"
            aria-pressed={char === picked}
            className={cx(styles.candidate, char === picked && styles.picked)}
            onClick={() => onPick(char)}
          >
            {char}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Each segment with its character offset in the whole text, a stable key. */
function withOffsets(parts: readonly Segment[]) {
  let at = 0;
  return parts.map((part) => {
    const text = typeof part === 'string' ? part : part.ja;
    const item = { part, at };
    at += text.length;
    return item;
  });
}

/** Text with Japanese runs set in Klee One. */
export function Segments({ parts }: { parts: readonly Segment[] }) {
  return withOffsets(parts).map(({ part, at }) =>
    typeof part === 'string' ? <span key={at}>{part}</span> : <Ja key={at}>{part.ja}</Ja>,
  );
}

/** The detail strip for the picked candidate: meaning, readings, your words, a link (I4). */
export function CandidateDetail({ char }: { char: string }) {
  const facts = useCandidateDetail(char);
  const { t, language } = useI18n();
  if (!facts) return <div className={styles.detail} aria-busy="true" />;
  const { kanji } = facts;
  return (
    <section className={styles.detail} aria-label={t('handwrite.about', { char })}>
      <Link to={`/kanji/${encodeURIComponent(char)}`} className={styles.detailHead}>
        <span lang="ja" className={styles.detailChar}>
          {char}
        </span>
        <span className={styles.meaning}>{kanji.meanings[0] ?? ''}</span>
        <span className={styles.readings}>
          <Segments parts={readingsLine(kanji)} />
        </span>
        <span className={styles.open}>
          <span className="visually-hidden">{t('handwrite.openKanji')}</span>
          <ChevronIcon />
        </span>
      </Link>
      <p className={styles.words}>
        <Segments parts={wordsLine(t, language, facts)} />
      </p>
    </section>
  );
}
