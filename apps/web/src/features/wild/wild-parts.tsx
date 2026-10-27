/** In the wild's smaller pieces: taking or choosing a photo, and why the tutor did not read it. */
import { useRef } from 'react';
import { Link } from 'react-router';
import type { AiError } from '../../ai/types.ts';
import { AiBlockStatus } from '../../ui/ai-block.tsx';
import { aiErrorText } from '../../ui/ai-error-text.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { CameraIcon } from '../../ui/icons.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import styles from './wild.module.css';

function FileInput(props: {
  camera: boolean;
  onPick: (file: File) => void;
  open: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={props.open}
      type="file"
      accept="image/*"
      {...(props.camera ? { capture: 'environment' as const } : {})}
      className="visually-hidden"
      tabIndex={-1}
      aria-hidden="true"
      data-testid={props.camera ? 'wild-camera' : 'wild-library'}
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) props.onPick(file);
        event.target.value = '';
      }}
    />
  );
}

/** "Take a photo" (or "Another photo") and "Choose a photo", with what each photo costs. */
export function PhotoPicker({ again, onPick }: { again: boolean; onPick: (file: File) => void }) {
  const t = useT();
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.picker}>
      <FileInput camera onPick={onPick} open={camera} />
      <FileInput camera={false} onPick={onPick} open={library} />
      <PillButton
        variant={again ? 'secondary' : 'primary'}
        block
        onClick={() => camera.current?.click()}
      >
        <CameraIcon />
        {t(again ? 'wild.another' : 'wild.takePhoto')}
      </PillButton>
      <PillButton variant="text" onClick={() => library.current?.click()}>
        {t('wild.choosePhoto')}
      </PillButton>
      <p className={styles.note}>{t('wild.note')}</p>
    </div>
  );
}

/** Why the tutor read nothing, in the AI box; the countdown and Retry after a 429 (A14). */
export function WildProblem({ error, onRetry }: { error: AiError; onRetry: () => void }) {
  const { t, rich } = useI18n();
  const line = () => {
    if (error.kind === 'rate-limit') return <RateLimitWait error={error} onRetry={onRetry} />;
    if (error.kind === 'no-key') {
      const settings = <Link to={paths.settingsSection('tutor')}>{t('teach.settingsLink')}</Link>;
      return <p className={styles.note}>{rich('teach.noKey', { settings })}</p>;
    }
    const offline = error.kind === 'offline';
    const text = offline
      ? t('teach.offline')
      : t('teach.failed', { reason: aiErrorText(t, error) });
    return <p className={styles.note}>{text}</p>;
  };
  return (
    <AiBlockStatus tier="fast">
      <div role="status">{line()}</div>
    </AiBlockStatus>
  );
}
