/**
 * "Where you are" on Today (IA2): level bars for kanji, words and grammar, the way to the kanji
 * wall, and last time.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { type LastTime, type LevelProgress, levelProgress } from '../../domain/services/index.ts';
import { foldKana, toKana } from '../../lang/index.ts';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { WallIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './today.module.css';
import { missLead, whenLine } from './today-copy.ts';
import wall from './today-extras.module.css';

/** The level's counts, read after the overview so they never hold up the first paint (N10). */
function useLevelProgress(): LevelProgress | undefined {
  const { repos } = useServices();
  const [progress, setProgress] = useState<LevelProgress>();
  useEffect(() => {
    let live = true;
    levelProgress(repos)
      .then((next) => live && setProgress(next))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [repos]);
  return progress;
}

const BARS = [
  ['kanji', 'today.barKanji'],
  ['words', 'today.barWords'],
  ['grammar', 'today.barGrammar'],
] as const satisfies readonly (readonly [keyof Omit<LevelProgress, 'level'>, PlainKey])[];

const EMPTY: LevelProgress = {
  level: 5,
  kanji: { known: 0, total: 0 },
  words: { known: 0, total: 0 },
  grammar: { known: 0, total: 0 },
};

/**
 * The three bars. Until the counts are read, an invisible copy holds their place, so the panel
 * does not grow under the learner; the real bars then fade in.
 */
function Bars({ progress }: { progress: LevelProgress | undefined }) {
  if (!progress) {
    return (
      <div className={styles.barsWaiting} aria-hidden="true">
        <BarRows progress={EMPTY} />
      </div>
    );
  }
  return (
    <div className={cx(styles.bars, 'enter')}>
      <BarRows progress={progress} />
    </div>
  );
}

function BarRows({ progress }: { progress: LevelProgress }) {
  const { t, rich } = useI18n();
  return (
    <>
      {BARS.map(([kind, label]) => {
        const { known, total } = progress[kind];
        const what = t(label);
        return (
          <div key={kind} className={styles.bar}>
            <span className={styles.barLabel}>{what}</span>
            <span className={styles.barValue}>
              {rich('today.knownOf', {
                known: <span className={styles.barKnown}>{known}</span>,
                total,
              })}
            </span>
            <ProgressLine
              value={total > 0 ? known / total : 0}
              label={t('today.knownOfLabel', { what, known, total })}
            />
          </div>
        );
      })}
    </>
  );
}

/** "Last time, yesterday: 9 sentences, 7 read right. Most misses were long vowels, like …" */
function LastTimeLine({ last }: { last: LastTime }) {
  const { t, rich } = useI18n();
  const line = t('today.lastTime', {
    when: whenLine(t, last.daysAgo),
    sentences: t('today.sentences', { n: last.sentences }),
    right: t('today.readRight', { n: last.right }),
  });
  const { miss } = last;
  return (
    <p className={styles.muted}>
      {line}
      {miss && ' '}
      {miss &&
        rich('today.missExample', {
          lead: missLead(t, miss.type, miss.count),
          given: <Ja>{foldKana(toKana(miss.given, true))}</Ja>,
          expected: <Ja>{miss.expected}</Ja>,
        })}
    </p>
  );
}

/** The summary panel: the learner's level, its bars, and what they did last time. */
/** Remounted with a new key when Today reloads (a level change), so the counts are read again. */
export function WhereYouAre({ last }: { last: LastTime | undefined }) {
  const t = useT();
  const progress = useLevelProgress();
  return (
    <section className={styles.panel} aria-label={t('today.whereLabel')}>
      <div className={styles.panelHead}>
        <h2 className={styles.panelTitle}>
          {progress ? t('today.whereLevel', { level: progress.level }) : t('today.whereLabel')}
        </h2>
        <Link to={paths.learned} className={styles.small}>
          <span>{t('today.details')}</span>
        </Link>
      </div>
      <div className={wall.panelBody}>
        <Bars key={progress ? 'counts' : 'waiting'} progress={progress} />
        <Link to={paths.kanjiWall()} className={wall.wallLink}>
          <WallIcon />
          {t('today.kanjiWall')}
        </Link>
      </div>
      {last && <LastTimeLine last={last} />}
    </section>
  );
}
