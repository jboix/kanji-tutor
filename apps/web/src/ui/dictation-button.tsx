/**
 * Mic button that dictates Japanese into a field (I3). Renders nothing when the browser has no
 * speech recognition, so callers can always include it. Dictation is the browser's own, so it
 * works without an AI key; it is never used to grade readings (SPEC "Voice").
 */
import { useEffect, useRef, useState } from 'react';
import { canDictate, type Dictation, startDictation } from '../lang/voice/index.ts';
import { cx } from './cx.ts';
import styles from './dictation-button.module.css';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import { IconButton } from './icon-button.tsx';
import { MicIcon } from './icons.tsx';

export interface DictationButtonProps {
  /** Called with the final dictated text. */
  onText: (text: string) => void;
  /** Text heard so far while listening, for a live preview in the field. */
  onInterim?: (text: string) => void;
  /** A plain message when dictation fails (blocked microphone, nothing heard). */
  onError?: (message: string) => void;
  label?: string;
}

const ERRORS: Readonly<Record<string, PlainKey>> = {
  'not-allowed': 'ui.dictationBlocked',
  'service-not-allowed': 'ui.dictationNotHere',
  'no-speech': 'ui.dictationNoSpeech',
  'audio-capture': 'ui.dictationNoMic',
  network: 'ui.dictationNetwork',
  'language-not-supported': 'ui.dictationNoJapanese',
  'start-failed': 'ui.dictationNoStart',
};

/** Press to listen, press again to stop; recognition also stops by itself after a pause. */
function useDictation(props: DictationButtonProps) {
  const latest = useRef(props);
  latest.current = props;
  const session = useRef<Dictation | undefined>(undefined);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const t = useT();
  useEffect(() => () => session.current?.stop(), []);
  const toggle = () => {
    if (session.current) return session.current.stop();
    setMessage('');
    setListening(true);
    session.current = startDictation({
      onInterim: (text) => latest.current.onInterim?.(text),
      onFinal: (text) => latest.current.onText(text),
      onError: (_, code) => {
        const error = t(ERRORS[code] ?? 'ui.dictationStopped');
        setMessage(error);
        latest.current.onError?.(error);
      },
      onEnd: () => {
        session.current = undefined;
        setListening(false);
      },
    });
  };
  return { listening, message, toggle };
}

export function DictationButton(props: DictationButtonProps) {
  const { listening, message, toggle } = useDictation(props);
  const t = useT();
  if (!canDictate()) return null;
  return (
    <>
      <IconButton
        size={36}
        muted
        aria-label={props.label ?? t('ui.dictate')}
        aria-pressed={listening}
        className={cx(listening && styles.listening)}
        onClick={toggle}
      >
        <MicIcon />
      </IconButton>
      <span role="status" className="visually-hidden">
        {listening ? t('ui.listening') : message}
      </span>
    </>
  );
}
