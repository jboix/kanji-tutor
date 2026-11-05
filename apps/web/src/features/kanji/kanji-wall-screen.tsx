/**
 * `/kanji/wall` (also `/kanji`, Learn's Kanji): every kanji of a JLPT level as a tile, the
 * learner's own level first, with how many they read. A search above finds kanji by a reading
 * (kana or romaji) or as typed, across N5–N3, and chips keep the tiles to one state.
 * `?at=休&level=4` opens on that level with the kanji ringed (from its page); otherwise the ring
 * is on the kanji the current unit is teaching.
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { filterTiles, type KanjiWall, type WallFilter } from '../../domain/services/index.ts';
import type { LearnerLevel } from '../../domain/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useKanaField } from '../../ui/use-kana-field.ts';
import styles from './kanji.module.css';
import wallStyles from './kanji-wall.module.css';
import { useKanjiWall, WallGrid, WallLegend } from './kanji-wall.tsx';
import { useWallSearch, WallFilters, WallFound, WallSearch } from './wall-find.tsx';

const LEVELS = ['5', '4', '3'] as const;

/** The level asked for in the link (from a kanji's page), if it is one. */
function levelParam(value: string | null): LearnerLevel | undefined {
  const level = Number(value);
  return level === 5 || level === 4 || level === 3 ? level : undefined;
}

interface WallProps {
  wall: KanjiWall;
  at: string | null;
  filter: WallFilter;
}

function Wall({ wall, at, filter }: WallProps) {
  const t = useT();
  if (wall.tiles.length === 0) return <p className={styles.meta}>{t('kanji.wallEmpty')}</p>;
  const tiles = filterTiles(wall.tiles, filter);
  return (
    <>
      <h2 className={wallStyles.title}>
        {t('kanji.wallHead')}{' '}
        <span className={wallStyles.count}>· {t('kanji.wallRead', { n: wall.known })}</span>
      </h2>
      <WallLegend />
      {tiles.length > 0 ? (
        <WallGrid tiles={tiles} current={at ?? wall.current} />
      ) : (
        <p className={styles.meta}>{t('kanji.wallNoneInState')}</p>
      )}
    </>
  );
}

interface LevelWallProps {
  level: LearnerLevel | undefined;
  setLevel: (level: LearnerLevel) => void;
  filter: WallFilter;
}

/** The level's wall, with its level switch. */
function LevelWall({ level, setLevel, filter }: LevelWallProps) {
  const t = useT();
  const [params] = useSearchParams();
  const wall = useKanjiWall(level);
  const shown = level ?? wall?.level;
  return (
    <>
      {shown && (
        <SegmentedControl
          label={t('kanji.wallLevel')}
          options={LEVELS.map((value) => ({ value, label: `N${value}` }))}
          value={String(shown) as (typeof LEVELS)[number]}
          onChange={(value) => setLevel(Number(value) as LearnerLevel)}
        />
      )}
      {wall && <Wall wall={wall} at={params.get('at')} filter={filter} />}
    </>
  );
}

/** The wall screen (see the module comment); offline, like the kanji pages. */
export function KanjiWallScreen() {
  const t = useT();
  const [params] = useSearchParams();
  const [level, setLevel] = useState(() => levelParam(params.get('level')));
  const field = useKanaField(true);
  const query = field.final();
  const found = useWallSearch(query);
  const [filter, setFilter] = useState<WallFilter>('all');
  const back = <BackButton parent={paths.learn} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('kanji.wall')} />}>
      <WallSearch field={field} found={found ?? []} />
      <WallFilters value={filter} onChange={setFilter} />
      {query ? (
        <WallFound query={query} tiles={found} filter={filter} />
      ) : (
        <LevelWall level={level} setLevel={setLevel} filter={filter} />
      )}
    </Screen>
  );
}
