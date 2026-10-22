import type { FunctionWord } from '../../domain/grammar/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { TapText } from '../../ui/word-tap.tsx';
import styles from './grammar.module.css';
import { JaRuns } from './ja-runs.tsx';

/** A particle's or function word's uses, each with its example (G5). Static. */
export function Uses({ word, limit }: { word: FunctionWord; limit?: number }) {
  const t = useT();
  return (
    <ul className={styles.examples}>
      {word.uses.slice(0, limit).map((use) => (
        <li key={use.use} className={styles.example}>
          <p className={styles.useLabel}>
            <JaRuns text={use.use} />
          </p>
          <p lang="ja" className={styles.useExample}>
            <TapText text={use.example} id={`use:${word.id}:${use.use}`} />
          </p>
          <p className={styles.translation}>{t('grammar.quoted', { text: use.translation })}</p>
        </li>
      ))}
    </ul>
  );
}
