import { useEffect, useRef, useState } from 'react';
import styles from './voice.module.css';

const BARS = 10;
const SAMPLE_MS = 80;
const IDS = Array.from({ length: BARS }, (_, i) => `bar${i}`);
/** The resting shape from voice.html, drawn faint until the microphone is live. */
const RESTING = [8, 14, 22, 28, 18, 24, 12, 20, 10, 6];
/** Below this level a bar counts as silence and stays faint. */
const VOICED = 0.08;

const height = (level: number) => Math.round(4 + Math.min(1, level) * 24);

/** The last `BARS` levels, sampled while `active`. */
function useLevels(active: boolean, level: () => number): number[] {
  const source = useRef(level);
  source.current = level;
  const [levels, setLevels] = useState<number[]>([]);
  useEffect(() => {
    setLevels([]);
    if (!active) return;
    const timer = setInterval(() => {
      setLevels((previous) => [...previous, source.current()].slice(-BARS));
    }, SAMPLE_MS);
    return () => clearInterval(timer);
  }, [active]);
  return levels;
}

/** Ten bars of microphone level (voice.html): newest on the right. */
export function Waveform({ active, level }: { active: boolean; level: () => number }) {
  const levels = useLevels(active, level);
  const padded = [...new Array<number>(BARS - levels.length).fill(0), ...levels];
  return (
    <div className={styles.wave} aria-hidden="true" data-active={active}>
      {IDS.map((id, i) => {
        const value = padded[i] ?? 0;
        return (
          <span
            key={id}
            className={active && value > VOICED ? styles.voiced : styles.bar}
            style={{ height: active ? height(value) : RESTING[i] }}
          />
        );
      })}
    </div>
  );
}
