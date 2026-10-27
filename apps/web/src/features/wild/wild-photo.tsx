/**
 * The photo with its kanji outlined: a solid accent box round each kanji the learner knows, a
 * dashed persimmon one round each new kanji, placed where the tutor saw them.
 */
import type { WildBox } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useObjectUrl } from '../../ui/photo-sheet.tsx';
import styles from './wild.module.css';

const percent = (n: number) => `${Math.min(100, Math.max(0, n / 10))}%`;

function Box({ box }: { box: WildBox }) {
  const [top, left, bottom, right] = box.box;
  return (
    <span
      className={styles.box}
      data-known={box.known ? '' : undefined}
      style={{
        top: percent(top),
        left: percent(left),
        height: percent(bottom - top),
        width: percent(right - left),
      }}
    />
  );
}

export function WildPhoto({ photo, boxes }: { photo: Blob; boxes: readonly WildBox[] }) {
  const t = useT();
  const url = useObjectUrl(photo);
  return (
    <figure className={styles.photo} aria-label={t('wild.photoLabel')}>
      <span className={styles.frame}>
        {url && <img src={url} alt="" className={styles.image} />}
        {boxes.map((box) => (
          <Box key={`${box.char}:${box.box.join(',')}`} box={box} />
        ))}
      </span>
    </figure>
  );
}
