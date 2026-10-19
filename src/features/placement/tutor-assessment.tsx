import { Link } from 'react-router';
import type { AiError, LevelAssessment } from '../../ai/types.ts';
import { AiAction, type AiPeek, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock, AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import { Reading } from '../../ui/reading.tsx';
import { JaRuns } from './ja-runs.tsx';
import styles from './placement.module.css';
import type { Assessment } from './use-assessment.ts';

function List({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <>
      <p className={styles.listTitle}>{title}</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item}>
            <JaRuns text={item} />
          </li>
        ))}
      </ul>
    </>
  );
}

function Unconfirmed({ failed }: { failed: LevelAssessment['readings'] }) {
  const t = useT();
  return (
    <p className={styles.muted}>
      {t('placement.unconfirmed')}{' '}
      {failed.map((reading) => (
        <span key={`${reading.surface}:${reading.reading}`}>
          <Ja>{reading.surface}</Ja> <Reading kana={reading.reading} verified={false} />{' '}
        </span>
      ))}
    </p>
  );
}

function Assessed({ value }: { value: LevelAssessment }) {
  const failed = value.readings.filter((reading) => !reading.verified);
  const detail = failed.length > 0 ? { detail: <Unconfirmed failed={failed} /> } : {};
  const t = useT();
  return (
    <AiBlock label={t('placement.assessment')} size="sm" readings={value.readings} {...detail}>
      <p className={styles.para}>{t('placement.tutorSuggests', { level: value.level })}</p>
      <p className={styles.para}>
        <JaRuns text={value.notes} />
      </p>
      <List title={t('placement.solid')} items={value.strengths} />
      <List title={t('placement.toWorkOn')} items={value.gaps} />
    </AiBlock>
  );
}

/** Why the tutor gave no view, in the AI box; the countdown and Retry after a 429 (A14). */
function Problem(props: { error: AiError; onRetry: AiRun }) {
  return (
    <AiBlockStatus>
      <ProblemLine {...props} />
    </AiBlockStatus>
  );
}

function ProblemLine({ error, onRetry }: { error: AiError; onRetry: AiRun }) {
  const { t, rich } = useI18n();
  if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
  if (error.kind === 'no-key') {
    return (
      <p className={styles.muted} role="status">
        {rich('placement.noKey', {
          settings: <Link to={paths.settingsSection('tutor')}>{t('placement.settings')}</Link>,
        })}
      </p>
    );
  }
  const text = t('placement.noAnswer', { reason: aiErrorText(t, error) });
  return (
    <p className={styles.muted} role="status">
      {text}
    </p>
  );
}

/** The tutor's view, only when asked: one call to assessLevel with the answers (A11). */
export function TutorAssessment(props: { state: Assessment; onAsk: AiRun; peek?: AiPeek }) {
  const { state, onAsk } = props;
  const t = useT();
  if (state.status === 'done') return <Assessed value={state.value} />;
  if (state.status === 'loading') return <AiWriting>{t('placement.reading')}</AiWriting>;
  return (
    <>
      {state.status === 'error' && <Problem error={state.error} onRetry={onAsk} />}
      <AiAction look="secondary" label={t('placement.ask')} run={onAsk} peek={props.peek} />
    </>
  );
}
