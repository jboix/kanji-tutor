import type { CheckedReading } from '../../ai/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Reading } from '../../ui/reading.tsx';
import styles from './handwrite.module.css';

/** The readings in an AI reason the dictionary could not confirm, each marked (A8). */
export function UncheckedLine({ readings }: { readings: readonly CheckedReading[] }) {
  const t = useT();
  if (readings.length === 0) return null;
  return (
    <p className={styles.unchecked}>
      {t('handwrite.unchecked')}{' '}
      {readings.map((reading, i) => (
        <span key={`${reading.surface}:${reading.reading}`} className={styles.claim}>
          {i > 0 && ' · '}
          <Ja>{reading.surface}</Ja> <Reading kana={reading.reading} verified={false} />
        </span>
      ))}
    </p>
  );
}
