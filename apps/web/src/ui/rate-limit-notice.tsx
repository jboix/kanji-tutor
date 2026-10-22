/**
 * The shared rate-limit state (A14), in every view that shows an AI result: "The tutor
 * needs a minute", a countdown to the wait Google returned, and Retry, which only works once the
 * wait has passed. Nothing retries by itself.
 */
import { useEffect, useState } from 'react';
import type { AiError } from '../ai/types.ts';
import { AiAction, type AiRun } from './ai-action.tsx';
import { useT } from './i18n/i18n.tsx';
import styles from './rate-limit-notice.module.css';

/** The wait when a 429 names none: Google's per-minute quota resets within a minute. */
const DEFAULT_WAIT_MS = 60_000;

/** Whole seconds left until `until` (epoch ms), never below zero. */
export function secondsLeft(until: number, now: number): number {
  return Math.max(0, Math.ceil((until - now) / 1000));
}

function useSecondsLeft(until: number): number {
  const [left, setLeft] = useState(() => secondsLeft(until, Date.now()));
  useEffect(() => {
    const tick = () => setLeft(secondsLeft(until, Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [until]);
  return left;
}

export interface RateLimitNoticeProps {
  retryAfterMs: number;
  /** Asks again (one request, A18); the button is disabled until the wait has passed. */
  onRetry?: AiRun | undefined;
}

/** After a 429: the line, the countdown and Retry. */
export function RateLimitNotice({ retryAfterMs, onRetry }: RateLimitNoticeProps) {
  const t = useT();
  const [until] = useState(() => Date.now() + retryAfterMs);
  const left = useSecondsLeft(until);
  return (
    <div className={styles.row} role="status">
      <p className={styles.text}>
        {t('ai.needsMinute')} {left > 0 ? t('ai.askAgainIn', { n: left }) : t('ai.askAgainNow')}
      </p>
      {onRetry && <AiAction label={t('common.retry')} run={onRetry} disabled={left > 0} />}
    </div>
  );
}

/** True for an error that should show the countdown. */
export function isRateLimited(error: AiError | undefined): error is AiError {
  return error?.kind === 'rate-limit';
}

/** The notice for a rate-limit error (its wait, or a minute); nothing for any other error. */
export function RateLimitWait(props: { error: AiError | undefined; onRetry?: AiRun | undefined }) {
  if (!isRateLimited(props.error)) return null;
  const wait = props.error.retryAfterMs ?? DEFAULT_WAIT_MS;
  return <RateLimitNotice retryAfterMs={wait} onRetry={props.onRetry} />;
}
