/** Pieces every guide uses: a titled section, Japanese with its reading, a table of forms. */
import type { ReactNode } from 'react';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './guides.module.css';

export function GuideSection({
  title,
  text,
  children,
}: {
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <SectionLabel as="h2">{title}</SectionLabel>
      {text !== undefined && (
        <p className={styles.prose}>
          <JaRuns text={text} />
        </p>
      )}
      {children}
    </section>
  );
}

/** The stem, then the ending in the accent; a narrow cell breaks the line only between them. */
function Split({ written, stem }: { written: string; stem: string }) {
  if (stem === '' || !written.startsWith(stem) || written === stem) return <span>{written}</span>;
  return (
    <span className={styles.split}>
      <span className={styles.part}>{stem}</span>
      <wbr />
      <span className={`${styles.part} ${styles.ending}`}>{written.slice(stem.length)}</span>
    </span>
  );
}

/**
 * Japanese as written, its reading under it when the two differ. With `stem`, the ending after
 * it shows in the accent.
 */
export function JaCell({
  written,
  reading,
  stem = '',
}: {
  written: string;
  reading?: string | undefined;
  stem?: string;
}) {
  return (
    <span lang="ja" className={styles.ja}>
      <Split written={written} stem={stem} />
      {reading !== undefined && reading !== written && (
        <span className={styles.reading}>{reading}</span>
      )}
    </span>
  );
}

/** A table under a header row; the first cell of each row heads it. */
export function FormTable({
  head,
  rows,
  label,
}: {
  head: readonly ReactNode[];
  rows: readonly { key: string; cells: readonly ReactNode[] }[];
  label: string;
}) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table} aria-label={label}>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={`head-${String(i)}`} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th key="head" scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={`cell-${String(i)}`}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
