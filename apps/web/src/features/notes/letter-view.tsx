import { Link } from 'react-router';
import { AiAction, type AiPeek, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock, AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import { JaRuns } from './ja-runs.tsx';
import styles from './notes.module.css';
import type { Letter, PlainReason } from './use-letter.ts';

function Ungrounded({ claims }: { claims: string[] }) {
  const { rich } = useI18n();
  return (
    <p className={styles.why}>
      {rich('notes.ungrounded', { claims: <JaRuns text={claims.join(', ')} /> })}
    </p>
  );
}

interface ReasonProps {
  reason: PlainReason;
  onRetry: AiRun | undefined;
}

/** Why the plain letter is shown: a tutor problem in the AI box, or ungrounded claims. */
function ReasonLine({ reason, onRetry }: ReasonProps) {
  if (reason.kind === 'ungrounded') return <Ungrounded claims={reason.claims} />;
  return (
    <AiBlockStatus tier="fast">
      <ErrorLine reason={reason} onRetry={onRetry} />
    </AiBlockStatus>
  );
}

function ErrorLine({ reason, onRetry }: ReasonProps) {
  const { t, rich } = useI18n();
  if (reason.kind === 'ungrounded') return null;
  const { error } = reason;
  if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
  if (error.kind === 'no-key') {
    const settings = (
      <Link to={paths.settingsSection('tutor')} className={styles.link}>
        {t('notes.settings')}
      </Link>
    );
    return <p className={styles.why}>{rich('notes.noKey', { settings })}</p>;
  }
  const text =
    error.kind === 'offline'
      ? t('notes.offline')
      : t('notes.failed', { reason: aiErrorText(t, error) });
  return <p className={styles.why}>{text}</p>;
}

/** "Ask the tutor to write this week's letter" (A13), or that it is being written. */
function AskLetter({ letter, onAsk, peek }: LetterViewProps) {
  const t = useT();
  if (letter.kind !== 'plain') return null;
  if (letter.writing) return <AiWriting tier="fast">{t('notes.writing')}</AiWriting>;
  if (!letter.canAsk || !onAsk) return null;
  return <AiAction label={t('notes.askLetter')} run={onAsk} peek={peek} />;
}

interface LetterViewProps {
  letter: Letter;
  onAsk?: AiRun | undefined;
  peek?: AiPeek | undefined;
}

/**
 * The letter on the week (notes.html): the plain version of the real stats, or the tutor's
 * wording of them once asked.
 */
export function LetterView({ letter, onAsk, peek }: LetterViewProps) {
  const t = useT();
  if (letter.kind === 'loading') {
    return (
      <p className={styles.why} role="status">
        {t('notes.writing')}
      </p>
    );
  }
  const paragraphs = letter.paragraphs.map((paragraph) => (
    <p key={paragraph} className={styles.paragraph}>
      <JaRuns text={paragraph} />
    </p>
  ));
  return (
    <section className={styles.letter} aria-label={t('notes.letterRegion')}>
      {letter.kind === 'ai' ? (
        <AiBlock tier="fast" label={t('notes.aiLetter')}>
          {paragraphs}
        </AiBlock>
      ) : (
        paragraphs
      )}
      {letter.kind === 'plain' && letter.reason && (
        <ReasonLine reason={letter.reason} onRetry={onAsk} />
      )}
      <AskLetter letter={letter} onAsk={onAsk} peek={peek} />
    </section>
  );
}

/** A plain rule after the letter; an AI letter carries its seal in the AI box. */
export function LetterDivider({ letter }: { letter: Letter }) {
  if (letter.kind === 'loading') return null;
  return <hr className={styles.rule} />;
}
