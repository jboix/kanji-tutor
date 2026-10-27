/**
 * The cast's portraits, drawn in sumi on their own discs: Yuki with a bob and a hair clip, Ken
 * with round glasses, Mori-san with a grey bun and apron straps. Always decorative: the name sits
 * beside them in text.
 */
import type { CastId } from '../domain/cast.ts';
import styles from './cast-portrait.module.css';

const SHOULDERS = 'M7 33c1.5-5 5-7.5 9-7.5s7.5 2.5 9 7.5';

function Yuki() {
  return (
    <>
      <circle cx="16" cy="16" r="6.6" className={styles.face} />
      <path
        d="M8.6 21c-1.6-8 2-13.4 7.4-13.4S25 13 23.4 21c-.6-3-1.2-5-2-6.2-2.6 1.6-6.6 2-9.8 1-.9 1.4-2.2 3-3 5.2z"
        className={styles.ink}
      />
      <rect
        x="20"
        y="9.5"
        width="4.6"
        height="2.4"
        rx="1.2"
        transform="rotate(-24 22 10.7)"
        className={styles.clip}
      />
      <path d="M13.4 18.6h.01M18.6 18.6h.01" className={styles.eyes} />
    </>
  );
}

function Ken() {
  return (
    <>
      <circle cx="16" cy="16.5" r="6.8" className={styles.face} />
      <path
        d="M9.2 15c.2-4.6 3-7.2 6.8-7.2 3.9 0 6.6 2.4 6.8 6.6-2.6-1.6-5.4-2.2-8.4-1.6-2 .4-3.6 1.2-5.2 2.2z"
        className={styles.ink}
      />
      <circle cx="13.2" cy="17.4" r="2.2" className={styles.glasses} />
      <circle cx="18.8" cy="17.4" r="2.2" className={styles.glasses} />
      <path d="M15.4 17.2h1.2" className={styles.glasses} />
    </>
  );
}

function Mori() {
  return (
    <>
      <path d="M12.6 26.4L15 30.5M19.4 26.4L17 30.5" className={styles.straps} />
      <circle cx="16" cy="7.4" r="3" className={styles.hair} />
      <circle cx="16" cy="16.6" r="6.6" className={styles.face} />
      <path
        d="M9.5 15.6c.1-4.4 2.9-6.6 6.5-6.6s6.4 2.2 6.5 6.6c-1.5-1.9-3.8-2.9-6.5-2.9s-5 1-6.5 2.9z"
        className={styles.hair}
      />
      <path d="M13.6 18.8h.01M18.4 18.8h.01" className={styles.eyes} />
    </>
  );
}

const ART = { yuki: Yuki, ken: Ken, mori: Mori } as const;

/** One portrait on its disc, `size` px across. */
export function Portrait({ who, size = 32 }: { who: CastId; size?: number }) {
  const Art = ART[who];
  return (
    <span
      className={styles.disc}
      data-who={who}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox="3 3.5 26 26" aria-hidden="true">
        <path d={SHOULDERS} className={styles.line} />
        <Art />
      </svg>
    </span>
  );
}

/** Portraits overlapping, each after the first ringed in the ground colour. */
export function CastStack({ who, size = 26 }: { who: readonly CastId[]; size?: number }) {
  return (
    <span className={styles.stack} aria-hidden="true">
      {who.map((id) => (
        <Portrait key={id} who={id} size={size} />
      ))}
    </span>
  );
}
