import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { CameraIcon, ChevronIcon, NoteIcon, PenIcon } from '../../ui/icons.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import styles from './add.module.css';

interface Choice {
  to: string;
  title: PlainKey;
  detail: PlainKey;
  icon: ReactNode;
}

const CHOICES: Choice[] = [
  { to: paths.capture, title: 'add.capture', detail: 'add.captureDetail', icon: <CameraIcon /> },
  { to: paths.compose, title: 'add.compose', detail: 'add.composeDetail', icon: <PenIcon /> },
  { to: paths.knownImport, title: 'add.class', detail: 'add.classDetail', icon: <NoteIcon /> },
];

/**
 * The Add tab (IA3): bring something in. Photograph or paste a page (Capture), write a sentence
 * of your own (Use it), or add this week's words from class. Each one's back returns here.
 */
export function AddScreen() {
  const t = useT();
  return (
    <Screen footer={<BottomNav />}>
      <h1 className={styles.title}>{t('add.title')}</h1>
      <ul className={styles.list}>
        {CHOICES.map((choice) => (
          <li key={choice.to}>
            <Link to={choice.to} className={styles.row}>
              <span className={styles.icon} aria-hidden="true">
                {choice.icon}
              </span>
              <span className={styles.text}>
                <span className={styles.name}>{t(choice.title)}</span>
                <span className={styles.detail}>{t(choice.detail)}</span>
              </span>
              <span className={styles.chevron} aria-hidden="true">
                <ChevronIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
