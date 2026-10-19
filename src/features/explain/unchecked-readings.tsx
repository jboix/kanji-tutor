import type { CheckedReading } from '../../ai/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Reading } from '../../ui/reading.tsx';
import styles from './explain.module.css';

/** The claims that failed verification (A8). */
export function unverified(readings: readonly CheckedReading[]): CheckedReading[] {
  return readings.filter((reading) => !reading.verified);
}

/**
 * Lists the readings in an explanation that the dictionary could not confirm, each visibly
 * marked unverified, so none of them reads as fact. Renders nothing when all were confirmed.
 */
export function UncheckedReadings({ readings }: { readings: readonly CheckedReading[] }) {
  const t = useT();
  const failed = unverified(readings);
  if (failed.length === 0) return null;
  return (
    <p className={styles.unchecked}>
      {t('explain.unconfirmed')}{' '}
      {failed.map((reading, i) => (
        <span key={`${reading.surface}:${reading.reading}`} className={styles.claim}>
          {i > 0 && ' · '}
          <Ja>{reading.surface}</Ja> <Reading kana={reading.reading} verified={false} />
        </span>
      ))}
    </p>
  );
}
