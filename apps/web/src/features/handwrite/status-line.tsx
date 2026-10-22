import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { AiError } from '../../ai/types.ts';
import type { AiRun } from '../../ui/ai-action.tsx';
import { AiBlockStatus } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import styles from './handwrite.module.css';

/** A calm, muted line announced to screen readers. */
export function StatusLine({ children }: { children: ReactNode }) {
  return (
    <p className={styles.status} role="status">
      {children}
    </p>
  );
}

interface ProblemProps {
  error: AiError;
  task: string;
  /** Asks again after a rate limit, once its wait has passed (A14). */
  onRetry?: AiRun | undefined;
}

/** Why AI could not help, and what still works, in the AI box. Never blocks drawing. */
export function AiProblem(props: ProblemProps) {
  return (
    <AiBlockStatus tier="fast">
      <ProblemLine {...props} />
    </AiBlockStatus>
  );
}

function ProblemLine({ error, task, onRetry }: ProblemProps) {
  const { t, rich } = useI18n();
  if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
  if (error.kind === 'no-key') {
    const settings = (
      <Link to={paths.settingsSection('tutor')} className={styles.link}>
        {t('handwrite.settings')}
      </Link>
    );
    return <StatusLine>{rich('handwrite.noKey', { settings, task })}</StatusLine>;
  }
  if (error.kind === 'offline') return <StatusLine>{t('handwrite.offline', { task })}</StatusLine>;
  return <StatusLine>{t('handwrite.failed', { detail: aiErrorText(t, error) })}</StatusLine>;
}
