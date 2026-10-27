/**
 * A conversation read aloud line by line (R7), to follow along or go back over: Play speaks from
 * the current line on, Pause stops where it is (Play then starts that line again: the browser's
 * voice cannot resume mid-sentence), and the track moves to any line, playing from there when it
 * was playing. The screen highlights the current line and scrolls it into view. Hidden controls
 * when the app may not speak; leaving the screen stops it.
 */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { canSpeak, speak, stopSpeaking } from '../lang/speech.ts';
import { useT } from './i18n/i18n.tsx';
import { PauseIcon, PlayIcon, TranslateIcon } from './icons.tsx';
import styles from './line-player.module.css';

export interface LinePlayer {
  /** The current line; undefined before anything was played or moved to. */
  current: number | undefined;
  playing: boolean;
  play: () => void;
  pause: () => void;
  seek: (index: number) => void;
}

interface PlayerState {
  current: number | undefined;
  playing: boolean;
  /** The last line was spoken to its end: Play starts over. */
  ended: boolean;
}

const IDLE: PlayerState = { current: undefined, playing: false, ended: false };

/** A run counter that newer runs bump; leaving the screen bumps it and silences the voice. */
function useStopOnLeave() {
  const run = useRef(0);
  useEffect(
    () => () => {
      run.current += 1;
      stopSpeaking();
    },
    [],
  );
  return run;
}

/** The player for these lines (see the module comment). */
export function useLinePlayer(lines: readonly string[]): LinePlayer {
  const run = useStopOnLeave();
  const [state, setState] = useState<PlayerState>(IDLE);
  const from = async (start: number) => {
    run.current += 1;
    const mine = run.current;
    for (let i = start; i < lines.length; i++) {
      if (run.current !== mine) return;
      setState({ current: i, playing: true, ended: false });
      await speak(lines[i] ?? '');
    }
    if (run.current === mine) setState((s) => ({ ...s, playing: false, ended: true }));
  };
  const pause = () => {
    run.current += 1;
    stopSpeaking();
    setState((s) => ({ ...s, playing: false }));
  };
  const play = () => void from(state.ended ? 0 : (state.current ?? 0));
  const seek = (index: number) => {
    if (state.playing) void from(index);
    else setState({ current: index, playing: false, ended: false });
  };
  return { current: state.current, playing: state.playing, play, pause, seek };
}

/** The current line's element brought into view as it changes, gently unless motion is reduced. */
export function useFollowLine(list: HTMLElement | null, current: number | undefined) {
  useEffect(() => {
    if (!list || current === undefined) return;
    const line = list.querySelectorAll<HTMLElement>('[data-line]')[current];
    const calm = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    line?.scrollIntoView?.({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
  }, [list, current]);
}

export interface PlayerBarProps {
  player: LinePlayer;
  total: number;
  translated: boolean;
  onTranslate: () => void;
  /** The tutor's Ask, at the row's start. */
  start?: ReactNode;
}

/** The track: one step per line, "3 / 8" beside it. */
function Track({ player, total }: Pick<PlayerBarProps, 'player' | 'total'>) {
  const t = useT();
  const at = player.current ?? 0;
  return (
    <div className={styles.track}>
      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        step={1}
        value={at}
        className={styles.range}
        style={{ '--done': `${total > 1 ? (at / (total - 1)) * 100 : 0}%` } as React.CSSProperties}
        aria-label={t('ui.playerTrack')}
        aria-valuetext={t('ui.playerLine', { n: at + 1, total })}
        onChange={(event) => player.seek(Number(event.target.value))}
      />
      <span className={styles.count}>{`${at + 1} / ${total}`}</span>
    </div>
  );
}

/** The sticky footer: the track over Ask, the translations and Play or Pause. */
export function PlayerBar({ player, total, translated, onTranslate, start }: PlayerBarProps) {
  const t = useT();
  const speaks = canSpeak();
  return (
    <div className={styles.bar}>
      {speaks && <Track player={player} total={total} />}
      <div className={styles.row}>
        {start}
        <button
          type="button"
          className={styles.translate}
          aria-pressed={translated}
          aria-label={t('ui.playerTranslation')}
          onClick={onTranslate}
        >
          <TranslateIcon />
        </button>
        {speaks && (
          <button
            type="button"
            className={styles.play}
            aria-label={t(player.playing ? 'ui.playerPause' : 'ui.playerPlay')}
            onClick={player.playing ? player.pause : player.play}
          >
            {player.playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
            <span>{t(player.playing ? 'ui.playerPauseShort' : 'ui.playerPlayShort')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
