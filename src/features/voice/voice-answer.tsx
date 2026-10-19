import type { KeyboardEvent, PointerEvent } from 'react';
import { canRecord } from '../../lang/voice/index.ts';
import { ActionHint } from '../../ui/action-bar.tsx';
import { AiActionContent, useAiActionName } from '../../ui/ai-action.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { IconButton } from '../../ui/icon-button.tsx';
import { MicIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import type { VoiceAnswerSlotProps } from '../../ui/slots.tsx';
import { useVoiceAnswer, type VoiceAnswerControls, type VoicePhase } from './use-voice-answer.ts';
import styles from './voice.module.css';
import { HINT, NO_RECORDER, PROMPT } from './voice-copy.ts';
import { Waveform } from './waveform.tsx';

const STATUS: Record<Exclude<VoicePhase['name'], 'error'>, PlainKey> = {
  idle: PROMPT,
  starting: 'voice.starting',
  recording: 'voice.recording',
  transcribing: 'voice.transcribing',
};

interface StatusProps {
  phase: VoicePhase;
  surface: string;
  onTypeInstead: () => void;
}

/** The line above the waveform: the prompt, progress, or a calm message (offline, no key). */
function Status({ phase, surface, onTypeInstead }: StatusProps) {
  const t = useT();
  if (phase.name !== 'error') {
    return (
      <p role="status" className={styles.status}>
        {t(STATUS[phase.name])}
        {phase.name === 'idle' && (
          <span className="visually-hidden">
            : <Ja>{surface}</Ja>
          </span>
        )}
      </p>
    );
  }
  return (
    <div role="status" className={styles.message}>
      <p className={styles.status}>
        {t(phase.message)}
        {phase.detail && ` (${phase.detail})`}
      </p>
      {phase.typeInstead && (
        <button type="button" className={styles.textButton} onClick={onTypeInstead}>
          {t('voice.typeReadingInstead')}
        </button>
      )}
    </div>
  );
}

const isActivation = (key: string) => key === ' ' || key === 'Enter';

const prevent = (event: KeyboardEvent<HTMLButtonElement>) =>
  isActivation(event.key) && event.preventDefault();

const stop = (event: { preventDefault: () => void }) => event.preventDefault();

/** The 76px mic: hold with a pointer, or press Space/Enter once to start and again to answer. */
function holdHandlers(voice: VoiceAnswerControls) {
  const down = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    voice.press();
  };
  const key = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isActivation(event.key)) return;
    event.preventDefault();
    if (!event.repeat) voice.toggle();
  };
  return { down, key };
}

function HoldButton({ voice, disabled }: { voice: VoiceAnswerControls; disabled: boolean }) {
  const { phase } = voice;
  const { down, key } = holdHandlers(voice);
  const name = useAiActionName(useT()('voice.hold'));
  return (
    <button
      type="button"
      aria-label={name}
      data-ai-action="request"
      aria-pressed={phase.name === 'starting' || phase.name === 'recording'}
      className={styles.hold}
      disabled={disabled || phase.name === 'transcribing'}
      onPointerDown={down}
      onPointerUp={voice.release}
      onPointerCancel={voice.release}
      onKeyDown={key}
      onKeyUp={prevent}
      onContextMenu={stop}
    >
      <MicIcon size={28} />
    </button>
  );
}

/**
 * Answer by voice (I2, voice.html): hold to speak the underlined word, let go, and the reading
 * is transcribed as pronounced and handed to the session to grade. The session shows the result.
 */
export function VoiceAnswer({ target, onAnswer, onTypeInstead }: VoiceAnswerSlotProps) {
  const voice = useVoiceAnswer(onAnswer);
  const t = useT();
  const supported = canRecord();
  const phase = supported
    ? voice.phase
    : { name: 'error' as const, message: NO_RECORDER, typeInstead: true };
  return (
    <div className={styles.panel}>
      <Status phase={phase} surface={target.surface} onTypeInstead={onTypeInstead} />
      <Waveform active={phase.name === 'recording'} level={voice.level} />
      <div className={styles.controls}>
        <IconButton
          size={48}
          look="outline"
          glyph
          aria-label={t('voice.typeInstead')}
          onClick={onTypeInstead}
        >
          あ
        </IconButton>
        <HoldButton voice={voice} disabled={!supported} />
        {/* Keeps the hold button centred. No pen here: the recognizer reads kanji, not kana. */}
        <span className={styles.side} aria-hidden="true" />
      </div>
      <p className={styles.mark} aria-hidden="true">
        <AiActionContent label={t('voice.sentToTutor')} saved={false} />
      </p>
      <ActionHint>{t(HINT)}</ActionHint>
    </div>
  );
}
