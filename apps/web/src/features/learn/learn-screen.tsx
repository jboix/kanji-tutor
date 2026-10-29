import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import {
  BarsIcon,
  BookIcon,
  BrushIcon,
  GrammarIcon,
  KanjiIcon,
  ListIcon,
  NoteIcon,
} from '../../ui/icons.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import styles from './learn.module.css';
import { LearnSearch } from './learn-search.tsx';
import { type LearnFacts, useLearnFacts } from './use-learn.ts';

interface Tile {
  to: string;
  title: PlainKey;
  icon: ReactNode;
  detail: (t: ReturnType<typeof useT>, facts: LearnFacts | undefined) => string;
}

const TILES: Tile[] = [
  {
    to: paths.units,
    title: 'learn.lessons',
    icon: <BookIcon />,
    detail: (t, facts) =>
      facts?.unit ? t('learn.lessonsAt', facts.unit) : t('learn.lessonsDetail'),
  },
  {
    to: paths.kanji,
    title: 'learn.kanji',
    icon: <KanjiIcon />,
    detail: (t, facts) =>
      facts && facts.kanjiThisWeek > 0
        ? t('learn.kanjiWeek', { n: facts.kanjiThisWeek })
        : t('learn.kanjiDetail'),
  },
  {
    to: paths.grammarIndex,
    title: 'learn.grammar',
    icon: <GrammarIcon />,
    detail: (t) => t('learn.grammarDetail'),
  },
  {
    to: paths.guides,
    title: 'guides.tile',
    icon: <ListIcon />,
    detail: (t) => t('guides.tileDetail'),
  },
  {
    to: paths.learned,
    title: 'learn.learned',
    icon: <BarsIcon />,
    detail: (t) => t('learn.learnedDetail'),
  },
  {
    to: paths.notes,
    title: 'learn.notes',
    icon: <NoteIcon />,
    detail: (t) => t('learn.notesDetail'),
  },
  {
    to: paths.handwrite,
    title: 'learn.draw',
    icon: <BrushIcon />,
    detail: (t) => t('learn.drawDetail'),
  },
];

function Tiles() {
  const t = useT();
  const facts = useLearnFacts();
  return (
    <ul className={styles.tiles}>
      {TILES.map((tile) => (
        <li key={tile.to}>
          <Link to={tile.to} className={styles.tile}>
            <span className={styles.icon} aria-hidden="true">
              {tile.icon}
            </span>
            <span className={styles.tileText}>
              <strong className={styles.tileTitle}>{t(tile.title)}</strong>
              <span className={styles.tileDetail}>{tile.detail(t, facts)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Learn hub (IA4): look up a kanji, word or grammar point, then a tile for each place to
 * study. Each sub-screen's back returns here.
 */
export function LearnScreen() {
  const t = useT();
  return (
    <Screen footer={<BottomNav />}>
      <h1 className={styles.title}>{t('learn.title')}</h1>
      <LearnSearch />
      <Tiles />
      <div>
        <ListRow to={paths.knownImport} detail={t('learn.markDetail')}>
          {t('learn.mark')}
        </ListRow>
      </div>
    </Screen>
  );
}
