/** What you know, and the lessons around the current one, on Today. */
import { Link } from 'react-router';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import styles from './home.module.css';
import type { HomeFacts } from './use-home.ts';

function Count({ n, label }: { n: number; label: string }) {
  return (
    <Link to={paths.learned} className={styles.count}>
      <span className={styles.countValue}>{n}</span>
      <span className={styles.countLabel}>{label}</span>
    </Link>
  );
}

/** Three counts of what is known (level 3 and up), each opening what you've learned. */
export function KnownSection({ known }: Pick<HomeFacts, 'known'>) {
  const t = useT();
  return (
    <section className={styles.block} aria-labelledby="known-title">
      <div className={styles.blockHead}>
        <h2 id="known-title" className={styles.blockTitle}>
          {t('today.knownTitle')}
        </h2>
        <Link to={paths.learned} className={styles.more}>
          {t('today.seeAll')}
        </Link>
      </div>
      <div className={styles.counts}>
        <Count n={known.words} label={t('today.knownWords', { n: known.words })} />
        <Count n={known.kanji} label={t('today.knownKanji', { n: known.kanji })} />
        <Count n={known.grammar} label={t('today.knownGrammar', { n: known.grammar })} />
      </div>
    </section>
  );
}

/** The current unit and the next two, as cards that open each one. */
export function UnitsSection({ units, currentId }: Pick<HomeFacts, 'units' | 'currentId'>) {
  const t = useT();
  if (units.length === 0) return null;
  return (
    <section className={styles.block} aria-labelledby="units-title">
      <div className={styles.blockHead}>
        <h2 id="units-title" className={styles.blockTitle}>
          {t('today.unitsTitle')}
        </h2>
        <Link to={paths.units} className={styles.more}>
          {t('today.unitsAll')}
        </Link>
      </div>
      <ul className={styles.units}>
        {units.map((view) => (
          <li key={view.unit.id}>
            <Link
              to={paths.unit(view.unit.id)}
              className={styles.unit}
              aria-current={view.unit.id === currentId ? 'step' : undefined}
            >
              <span className={styles.unitOrder}>
                {t('today.unitOrder', { level: view.unit.level, order: view.unit.order })}
              </span>
              <Ja>{view.unit.titleJa}</Ja>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
