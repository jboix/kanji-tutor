/**
 * Your photos: every photo the tutor read, newest first, each with its thumbnail, what it shows
 * and when it was taken; one opens again with its reading, asking the tutor nothing.
 */
import { Link } from 'react-router';
import type { WildPhoto } from '../../domain/services/index.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { useObjectUrl } from '../../ui/photo-sheet.tsx';
import { useWildPhotos } from './use-wild.ts';
import styles from './wild.module.css';

function Row({ photo }: { photo: WildPhoto }) {
  const { t, format } = useI18n();
  const url = useObjectUrl(photo.photo);
  const date = format.date(photo.createdAt, { day: 'numeric', month: 'short' });
  const kanji = new Set(photo.reading.kanji.map((k) => k.char)).size;
  return (
    <li>
      <Link to={paths.wildPhoto(photo.id)} className={styles.saved}>
        <span className={styles.thumb}>{url && <img src={url} alt="" />}</span>
        <span className={styles.savedText}>
          <span className={styles.savedPlace}>{photo.reading.place || t('wild.untitled')}</span>
          <span className={styles.savedMeta}>{t('wild.savedMeta', { date, n: kanji })}</span>
        </span>
      </Link>
    </li>
  );
}

/** The list (see the module comment); nothing until a photo has been read. */
export function WildList() {
  const t = useT();
  const photos = useWildPhotos();
  if (!photos?.length) return null;
  return (
    <section className={styles.group} aria-labelledby="wild-saved">
      <h2 id="wild-saved" className={styles.groupTitle}>
        {t('wild.saved')}
      </h2>
      <ul className={styles.savedList}>
        {photos.map((photo) => (
          <Row key={photo.id} photo={photo} />
        ))}
      </ul>
    </section>
  );
}
