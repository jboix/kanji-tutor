/** Practise on Today: a tile per kind of round, and the app's other ways to read and write. */
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { BookIcon, CameraIcon, MixIcon, PenIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { startPath } from '../../ui/start-path.ts';
import { type StartOptions, useStartOptions } from '../../ui/use-start-options.ts';
import styles from './home.module.css';
import type { TodaySessionView } from './use-today.ts';

interface TileProps {
  to: string;
  icon: ReactNode;
  title: string;
  line: ReactNode;
  state?: unknown;
}

function Tile({ to, icon, title, line, state }: TileProps) {
  return (
    <Link to={to} state={state} className={styles.tile}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.tileTitle}>{title}</span>
      <span className={styles.tileLine}>{line}</span>
    </Link>
  );
}

/** The daily mix Today built (N10): its size once known, and the same session on tap. */
function MixTile({ session }: { session: TodaySessionView | undefined }) {
  const t = useT();
  const reading = session?.cards.filter((card) => card.reason !== 'drill').length;
  let line = t('today.choosing');
  if (reading === 0) line = t('today.tileMixNone');
  else if (session && reading) {
    line = t('today.tileMixLine', {
      sentences: t('today.sentences', { n: reading }),
      minutes: t('today.minutes', { n: session.minutes }),
    });
  }
  return (
    <Tile
      to={paths.read}
      state={session?.handoff}
      icon={<MixIcon />}
      title={t('today.tileMix')}
      line={line}
    />
  );
}

/** Grammar, on the point it would practise as the Start sheet shows, and kanji cards. */
function FocusTiles({ options }: { options: StartOptions | undefined }) {
  const { t, rich } = useI18n();
  const pattern = options?.pattern;
  const kanjiLine = t('ui.startKanjiAny');
  const grammarLine = pattern
    ? rich('ui.startGrammarLine', { pattern: <Ja>{pattern}</Ja> })
    : t('ui.startGrammarAny');
  return (
    <>
      <Tile
        to={startPath(options?.kanji ?? { kind: 'kanji' })}
        icon={<Ja>漢</Ja>}
        title={t('today.tileKanji')}
        line={kanjiLine}
      />
      <Tile
        to={startPath(options?.grammar ?? { kind: 'grammar' })}
        icon={<Ja>文</Ja>}
        title={t('today.tileGrammar')}
        line={grammarLine}
      />
    </>
  );
}

/** Six tiles (IA2): the mix, reading, kanji, grammar, writing a sentence and reading a photo. */
export function Practice({ session }: { session: TodaySessionView | undefined }) {
  const t = useT();
  const options = useStartOptions(true);
  return (
    <section className={styles.block} aria-labelledby="practise-title">
      <h2 id="practise-title" className={styles.blockTitle}>
        {t('today.practiseTitle')}
      </h2>
      <div className={styles.tiles}>
        <MixTile session={session} />
        <Tile
          to={startPath({ kind: 'reading' })}
          icon={<BookIcon />}
          title={t('today.tileRead')}
          line={t('today.tileReadLine')}
        />
        <FocusTiles options={options} />
        <Tile
          to={paths.compose}
          icon={<PenIcon />}
          title={t('today.tileWrite')}
          line={t('today.tileWriteLine')}
        />
        <Tile
          to={paths.capture}
          icon={<CameraIcon />}
          title={t('today.tilePhoto')}
          line={t('today.tilePhotoLine')}
        />
      </div>
    </section>
  );
}
