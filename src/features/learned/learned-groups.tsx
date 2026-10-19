import { useState } from 'react';
import { Link } from 'react-router';
import type { LearnedEntry, LearnedGroup, LearnedKind } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { TapWord } from '../../ui/word-tap.tsx';
import styles from './learned.module.css';
import { coverageLine, groupName, STATE_LABEL } from './learned-copy.ts';

/** Rows rendered at a time; "Show more" adds this many again. */
export const PAGE = 200;

function KanjiCells({ entries }: { entries: readonly LearnedEntry[] }) {
  const { t, language } = useI18n();
  const state = (entry: LearnedEntry) => t(STATE_LABEL[entry.state]).toLocaleLowerCase(language);
  return (
    <ul className={styles.grid}>
      {entries.map((entry) => (
        <li key={entry.key}>
          <Link
            to={paths.kanjiDetail(entry.key)}
            className={cx(styles.cell, styles[entry.state])}
            aria-label={t('learned.cellLabel', { text: entry.text, state: state(entry) })}
            title={entry.meaning}
          >
            <span lang="ja">{entry.text}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface EntriesProps {
  kind: LearnedKind;
  entries: readonly LearnedEntry[];
}

function RowMain({ entry, to }: { entry: LearnedEntry; to: string | undefined }) {
  // A word row opens its word sheet from the word (U5); a grammar row is a link to its page.
  const text = to ? (
    <Ja variant="emph">{entry.text}</Ja>
  ) : (
    <span className={styles.wordTap}>
      <TapWord form={entry.text} wordId={entry.key} reading={entry.reading} />
    </span>
  );
  const body = (
    <>
      {text}
      {entry.reading && <Ja>{entry.reading}</Ja>}
      {entry.meaning && <span className={styles.meaning}>{entry.meaning}</span>}
    </>
  );
  if (!to) return <span className={styles.rowMain}>{body}</span>;
  return (
    <Link to={to} className={cx(styles.rowMain, styles.rowLink)}>
      {body}
    </Link>
  );
}

/** Word and grammar rows; a grammar row opens the point's page (G4). */
function Rows({ kind, entries }: EntriesProps) {
  const t = useT();
  return (
    <ul className={styles.rows}>
      {entries.map((entry) => (
        <li key={entry.key} className={styles.row}>
          <RowMain entry={entry} to={kind === 'grammar' ? paths.grammar(entry.key) : undefined} />
          <span className={cx(styles.state, styles[entry.state])}>
            {t(STATE_LABEL[entry.state])}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** At most {@link PAGE} entries at once, with "Show more" for the rest. */
function Entries({ kind, entries }: EntriesProps) {
  const t = useT();
  const [shown, setShown] = useState(PAGE);
  if (entries.length === 0) return <p className={styles.muted}>{t('learned.nothingStarted')}</p>;
  const page = entries.slice(0, shown);
  const rest = entries.length - page.length;
  return (
    <>
      {kind === 'kanji' ? <KanjiCells entries={page} /> : <Rows kind={kind} entries={page} />}
      {rest > 0 && (
        <button type="button" className={styles.more} onClick={() => setShown((n) => n + PAGE)}>
          {t('learned.showMore', { shown: Math.min(rest, PAGE), rest })}
        </button>
      )}
    </>
  );
}

interface GroupProps {
  kind: LearnedKind;
  group: LearnedGroup;
  showAll: boolean;
  open: boolean;
  onToggle: () => void;
}

/** One level: its coverage line, and its entries when opened. */
export function GroupSection({ kind, group, showAll, open, onToggle }: GroupProps) {
  const t = useT();
  const id = `learned-${kind}-${group.level}`;
  const entries = showAll ? group.entries : group.entries.filter((e) => e.state !== 'not-started');
  const line = coverageLine(t, group, kind);
  return (
    <section className={styles.group} aria-label={groupName(t, group.level, kind)}>
      <button
        type="button"
        className={styles.groupHead}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span>{line}</span>
        <span className={cx(styles.chevron, open && styles.chevronOpen)}>
          <ChevronIcon />
        </span>
      </button>
      {group.level !== 'other' && group.total > 0 && (
        <ProgressLine value={group.known / group.total} label={line} />
      )}
      {open && (
        <div id={id} className={styles.entries}>
          <Entries kind={kind} entries={entries} />
        </div>
      )}
    </section>
  );
}
