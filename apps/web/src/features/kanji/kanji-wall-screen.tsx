/**
 * `/kanji/wall`: every kanji of a JLPT level as a tile, the learner's own level first, with how
 * many they read. `?at=休&level=4` opens on that level with the kanji ringed (from its page);
 * otherwise the ring is on the kanji the current unit is teaching.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { KanjiWall } from '../../domain/services/index.ts';
import type { LearnerLevel } from '../../domain/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './kanji.module.css';
import wallStyles from './kanji-wall.module.css';
import { useKanjiWall, WallGrid, WallLegend } from './kanji-wall.tsx';

const LEVELS = ['5', '4', '3'] as const;

/** The level asked for in the link (from a kanji's page), if it is one. */
function levelParam(value: string | null): LearnerLevel | undefined {
  const level = Number(value);
  return level === 5 || level === 4 || level === 3 ? level : undefined;
}

function Wall({ wall, at }: { wall: KanjiWall; at: string | null }) {
  const t = useT();
  if (wall.tiles.length === 0) return <p className={styles.meta}>{t('kanji.wallEmpty')}</p>;
  return (
    <>
      <h2 className={wallStyles.title}>
        {t('kanji.wallHead')}{' '}
        <span className={wallStyles.count}>· {t('kanji.wallRead', { n: wall.known })}</span>
      </h2>
      <WallLegend />
      <WallGrid tiles={wall.tiles} current={at ?? wall.current} />
    </>
  );
}

/** The wall screen (see the module comment); offline, like the kanji pages. */
export function KanjiWallScreen() {
  const t = useT();
  const [params] = useSearchParams();
  const [level, setLevel] = useState(() => levelParam(params.get('level')));
  const wall = useKanjiWall(level);
  const shown = level ?? wall?.level;
  const back = <BackButton parent={paths.today} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('kanji.wall')} />}>
      {shown && (
        <SegmentedControl
          label={t('kanji.wallLevel')}
          options={LEVELS.map((value) => ({ value, label: `N${value}` }))}
          value={String(shown) as (typeof LEVELS)[number]}
          onChange={(value) => setLevel(Number(value) as LearnerLevel)}
        />
      )}
      {wall && <Wall wall={wall} at={params.get('at')} />}
    </Screen>
  );
}
