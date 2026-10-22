import { Link } from 'react-router';
import type { AiError, CheckedReading, ImmersionNote } from '../../ai/types.ts';
import { AiBlockStatus } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { GlossedRun, ImmersionSummary, placedWords } from '../../ui/immersion-text.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import { Reading } from '../../ui/reading.tsx';
import styles from './teach.module.css';

const JAPANESE =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆〇、。「」『』（）・〜？！]+/gu;

/**
 * Prose mixing English and Japanese, with every Japanese run in Klee One (N7). In immersion
 * (M2), words above the learner get furigana and a tap-to-gloss.
 */
export function JaProse({
  text,
  immersion,
}: {
  text: string;
  immersion?: ImmersionNote | undefined;
}) {
  const placed = immersion ? placedWords(immersion, text) : [];
  const parts: { text: string; ja: boolean; at: number }[] = [];
  let at = 0;
  for (const match of text.matchAll(JAPANESE)) {
    if (match.index > at) parts.push({ text: text.slice(at, match.index), ja: false, at });
    parts.push({ text: match[0], ja: true, at: match.index });
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), ja: false, at });
  return parts.map((part) =>
    part.ja ? (
      <Ja key={part.at}>
        {placed.length > 0 ? (
          <GlossedRun text={part.text} offset={part.at} placed={placed} />
        ) : (
          part.text
        )}
      </Ja>
    ) : (
      <span key={part.at}>{part.text}</span>
    ),
  );
}

/** The summary in the learner's language under a mixed or Japanese reply (M2). */
export function ImmersionFooter({ immersion }: { immersion?: ImmersionNote | undefined }) {
  return immersion ? <ImmersionSummary view={immersion} /> : null;
}

/** AI readings the dictionary could not confirm, each marked unverified (A8). */
export function Unconfirmed({ readings }: { readings: readonly CheckedReading[] }) {
  const t = useT();
  const failed = readings.filter((reading) => !reading.verified);
  if (failed.length === 0) return null;
  return (
    <p className={styles.muted}>
      {t('teach.unconfirmed')}{' '}
      {failed.map((reading, i) => (
        <span key={`${reading.surface}:${reading.reading}`}>
          {i > 0 && ' · '}
          <Ja>{reading.surface}</Ja> <Reading kana={reading.reading} verified={false} />
        </span>
      ))}
    </p>
  );
}

/** The mark on an AI reply that came back in another language than asked (D35). */
export function OffLanguage({ off }: { off: boolean | undefined }) {
  const t = useT();
  if (!off) return null;
  return <p className={styles.muted}>{t('teach.offLanguage')}</p>;
}

/**
 * Why the tutor gave no answer; everything static on the screen still works. After a rate limit:
 * the shared countdown and Retry (A14).
 */
export function TutorProblem(props: { error: AiError; onRetry?: () => void }) {
  return (
    <AiBlockStatus>
      <ProblemLine {...props} />
    </AiBlockStatus>
  );
}

function ProblemLine({ error, onRetry }: { error: AiError; onRetry?: (() => void) | undefined }) {
  const { t, rich } = useI18n();
  if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
  if (error.kind === 'no-key') {
    const settings = (
      <Link to={paths.settingsSection('tutor')} className={styles.muted}>
        {t('teach.settingsLink')}
      </Link>
    );
    return (
      <p className={styles.muted} role="status">
        {rich('teach.noKey', { settings })}
      </p>
    );
  }
  const text =
    error.kind === 'offline'
      ? t('teach.offline')
      : t('teach.failed', { reason: aiErrorText(t, error) });
  return (
    <p className={styles.muted} role="status">
      {text}
    </p>
  );
}
