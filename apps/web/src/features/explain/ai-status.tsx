import { Link } from 'react-router';
import type { AiError } from '../../ai/types.ts';
import type { AiRun } from '../../ui/ai-action.tsx';
import { AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import styles from './explain.module.css';

/** A calm line in the AI box while the tutor is writing. */
export function Pending({ children }: { children?: string }) {
  const t = useT();
  return <AiWriting>{children ?? t('explain.pending')}</AiWriting>;
}

interface AiProblemProps {
  error: AiError;
  /** What still works, e.g. "the session continues" (already in the learner's language). */
  rest?: string;
  /** Asks again; offered after a rate limit, once its wait has passed (A14). */
  onRetry?: AiRun | undefined;
}

/** Why there is no explanation, in the AI box, without blocking anything else on the screen. */
export function AiProblem(props: AiProblemProps) {
  return (
    <AiBlockStatus>
      <ProblemLine {...props} />
    </AiBlockStatus>
  );
}

function ProblemLine({ error, rest, onRetry }: AiProblemProps) {
  const { t, rich } = useI18n();
  if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
  if (error.kind === 'no-key') {
    const settings = (
      <Link to={paths.settingsSection('tutor')} className={styles.link}>
        {t('explain.settingsLink')}
      </Link>
    );
    return (
      <p className={styles.status} role="status">
        {rich('explain.noKey', { settings })}
      </p>
    );
  }
  const text =
    error.kind === 'offline'
      ? t('explain.offline', { rest: rest ?? t('explain.restSession') })
      : t('explain.failed', { reason: aiErrorText(t, error) });
  return (
    <p className={styles.status} role="status">
      {text}
    </p>
  );
}
