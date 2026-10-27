/**
 * The kanji wall's tiles: filled tonal when the learner reads the kanji, dashed while learning,
 * a plain outline when not yet met, and a ring around the one they are on. Each tile opens its
 * kanji's page. Shown whole on the wall screen and as a glimpse on a kanji's page.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  type KanjiWall,
  kanjiWall,
  type WallTile,
  wallAround,
} from '../../domain/services/index.ts';
import type { LearnedState } from '../../domain/services/learned.ts';
import type { Kanji, LearnerLevel } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './kanji-wall.module.css';

const STATE_KEYS: Record<LearnedState, PlainKey> = {
  known: 'kanji.wallKnown',
  learning: 'kanji.wallLearning',
  'not-started': 'kanji.wallNotYet',
};

/** The wall of `level` (the learner's own when absent); undefined while it is read. */
export function useKanjiWall(level?: LearnerLevel): KanjiWall | undefined {
  const { repos } = useServices();
  const [wall, setWall] = useState<KanjiWall>();
  useEffect(() => {
    let live = true;
    void kanjiWall(repos, level).then((next) => live && setWall(next));
    return () => {
      live = false;
    };
  }, [repos, level]);
  return wall;
}

function Tile({ tile, current }: { tile: WallTile; current: boolean }) {
  const t = useT();
  const state = t(STATE_KEYS[tile.state]);
  const label = t(current ? 'kanji.wallTileNow' : 'kanji.wallTile', { char: tile.char, state });
  return (
    <Link
      to={paths.kanjiDetail(tile.char)}
      className={styles.tile}
      data-state={tile.state}
      aria-label={label}
      aria-current={current ? 'true' : undefined}
    >
      <span lang="ja" aria-hidden="true">
        {tile.char}
      </span>
    </Link>
  );
}

interface WallGridProps {
  tiles: readonly WallTile[];
  current?: string | undefined;
  /** Seven to a row, the tiles a little smaller on a narrow phone, so a glimpse fills its rows. */
  rows?: boolean;
}

/** The tiles in a grid of 44px squares, as many to a row as fit. */
export function WallGrid(props: WallGridProps) {
  const { tiles, current, rows = false } = props;
  return (
    <ul className={rows ? styles.rows : styles.grid}>
      {tiles.map((tile) => (
        <li key={tile.char}>
          <Tile tile={tile} current={tile.char === current} />
        </li>
      ))}
    </ul>
  );
}

/** "■ You read it  ⬚ Learning  □ Not yet". */
export function WallLegend() {
  const t = useT();
  return (
    <p className={styles.legend}>
      {(['known', 'learning', 'not-started'] as const).map((state) => (
        <span key={state} className={styles.key}>
          <span className={styles.swatch} data-state={state} aria-hidden="true" />
          {t(STATE_KEYS[state])}
        </span>
      ))}
    </p>
  );
}

/** Three rows of seven: the wall around a kanji. */
const GLIMPSE = 21;

function GlimpseOf({ wall, char }: { wall: KanjiWall; char: string }) {
  const t = useT();
  const tiles = wallAround(wall.tiles, char, GLIMPSE);
  if (tiles.length === 0) return null;
  return (
    <section className={styles.glimpse} aria-label={t('kanji.wallHead')}>
      <div className={styles.glimpseHead}>
        <h2 className={styles.title}>
          {t('kanji.wallHead')}{' '}
          <span className={styles.count}>· {t('kanji.wallRead', { n: wall.known })}</span>
        </h2>
        <PillLink variant="text" to={paths.kanjiWall({ char, level: wall.level })}>
          {t('kanji.wallAll', { n: wall.tiles.length })}
        </PillLink>
      </div>
      <WallGrid tiles={tiles} current={char} rows />
      <WallLegend />
    </section>
  );
}

function Glimpse({ char, level }: { char: string; level: LearnerLevel }) {
  const wall = useKanjiWall(level);
  return wall ? <GlimpseOf wall={wall} char={char} /> : null;
}

/** The wall around a kanji of the N5–N3 lists, for its page; nothing for other kanji. */
export function WallGlimpse({ kanji }: { kanji: Kanji }) {
  const { jlpt } = kanji;
  if (jlpt !== 5 && jlpt !== 4 && jlpt !== 3) return null;
  return <Glimpse char={kanji.char} level={jlpt} />;
}
