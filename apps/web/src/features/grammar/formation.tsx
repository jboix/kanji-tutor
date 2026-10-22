import { Fragment } from 'react';
import styles from './grammar.module.css';
import { formationParts } from './grammar-data.ts';
import { JaRuns } from './ja-runs.tsx';

/** "V-て + もいい": the slots the learner fills in a dashed box, the fixed grammar in ink. */
export function Formation({ formation }: { formation: string }) {
  const parts = formationParts(formation);
  return (
    <p className={styles.formation}>
      {parts.map((part) => (
        <Fragment key={part.at}>
          {part.at > 0 && <span className={styles.plus}> + </span>}
          {part.slot ? (
            <span className={styles.slot}>
              <JaRuns text={part.text} />
            </span>
          ) : (
            <span lang="ja" className={styles.fixed}>
              {part.text}
            </span>
          )}
        </Fragment>
      ))}
    </p>
  );
}
