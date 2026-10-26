/**
 * The app's wait: in a practice square, a kanji writes itself stroke by stroke, then its reading
 * and meaning fade in, and the next one follows. It shows only once a wait passes 300 ms, so a
 * quick load shows nothing; with reduced motion the kanji stands finished.
 */
import { type CSSProperties, useEffect, useState } from 'react';
import { useI18n } from './i18n/i18n.tsx';
import { Ja } from './ja.tsx';
import styles from './loader.module.css';
import { LOADER_KANJI, type LoaderKanji } from './loader-kanji.ts';

/** How long a wait goes unmarked. */
const SHOW_AFTER_MS = 300;
/** Each stroke's turn, in ms (loader.module.css draws it in a little less). */
const STROKE_MS = 550;
/** The finished kanji and its caption stay, then fade, before the next one. */
const HOLD_MS = 1800;

/** The kanji to write next: each loader, and each loop of one, goes on through the set. */
let next = 0;

function takeKanji(): LoaderKanji {
  const kanji = LOADER_KANJI[next % LOADER_KANJI.length] as LoaderKanji;
  next += 1;
  return kanji;
}

function reducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** The kanji to show once the wait passes `delay`, then the next one after each loop. */
function useLoaderKanji(delay: number): LoaderKanji | undefined {
  const [kanji, setKanji] = useState<LoaderKanji>();
  useEffect(() => {
    const ms = kanji ? kanji.strokes.length * STROKE_MS + HOLD_MS : delay;
    if (kanji && reducedMotion()) return;
    const timer = setTimeout(() => setKanji(takeKanji()), ms);
    return () => clearTimeout(timer);
  }, [kanji, delay]);
  return kanji;
}

function Square({ kanji }: { kanji: LoaderKanji }) {
  return (
    <svg className={styles.square} viewBox="0 0 109 109" aria-hidden="true">
      <path className={styles.guide} d="M54.5 0V109M0 54.5H109" />
      <g className={styles.kanji}>
        {kanji.strokes.map((d, i) => (
          <path
            key={d}
            className={styles.stroke}
            d={d}
            pathLength={1}
            style={{ '--i': i } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}

/** "やま  mountain · 3 strokes", fading in once the last stroke is down. */
function Caption({ kanji }: { kanji: LoaderKanji }) {
  const { t, language } = useI18n();
  const strokes = t('ui.loaderStrokes', { n: kanji.strokes.length });
  return (
    <p className={styles.caption} aria-hidden="true">
      <span className={styles.reading}>
        <Ja>{kanji.reading}</Ja>
      </span>
      <span className={styles.meaning}>{`${kanji.meaning[language]} · ${strokes}`}</span>
    </p>
  );
}

/** A screen's wait (see the module comment). Its accessible name is "Loading". */
export function Loader({ delay = SHOW_AFTER_MS }: { delay?: number }) {
  const { t } = useI18n();
  const kanji = useLoaderKanji(delay);
  if (!kanji) return null;
  const timing = { '--n': kanji.strokes.length, '--stroke': `${STROKE_MS}ms` } as CSSProperties;
  return (
    <div className={styles.loader} role="status" aria-label={t('common.loading')} data-loader="">
      <div key={kanji.char} className={styles.cycle} style={timing}>
        <Square kanji={kanji} />
        <Caption kanji={kanji} />
      </div>
    </div>
  );
}
