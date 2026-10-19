import { type RefObject, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { AiClient } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { RateLimitWait } from '../../ui/rate-limit-notice.tsx';
import styles from './capture.module.css';
import { startMessage } from './capture-copy.ts';
import type { StartState } from './use-capture-start.ts';

interface FileInputProps {
  inputRef: RefObject<HTMLInputElement | null>;
  /** Opens the camera on phones (`capture="environment"`). */
  camera: boolean;
  onFile: (file: File) => void;
}

/** A hidden image input; a visible button opens it. Cleared after each pick. */
export function HiddenFileInput({ inputRef, camera, onFile }: FileInputProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      {...(camera ? { capture: 'environment' as const } : {})}
      className={styles.hidden}
      tabIndex={-1}
      aria-hidden="true"
      data-testid={camera ? 'camera-input' : 'library-input'}
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) onFile(file);
      }}
    />
  );
}

/** A photo picked after an `AiAction`: the file, with the client of that press (A18). */
export type OnPhoto = (client: AiClient, file: File) => void;

/** The picker and the client of the press that opened it; the tutor reads the photo. */
export function usePhotoPicker(onPhoto: OnPhoto) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const client = useRef<AiClient>(undefined);
  const open = (input: RefObject<HTMLInputElement | null>) => (c: AiClient) => {
    client.current = c;
    input.current?.click();
  };
  const onFile = (file: File) => client.current && onPhoto(client.current, file);
  return { camera, library, onFile, openCamera: open(camera), openLibrary: open(library) };
}

/** "Photograph a page" (camera) and "Choose from library": the tutor reads the photo (C1). */
export function PhotoButtons({ onPhoto, busy }: { onPhoto: OnPhoto; busy: boolean }) {
  const picker = usePhotoPicker(onPhoto);
  const t = useT();
  return (
    <div className={styles.startActions}>
      <HiddenFileInput inputRef={picker.camera} camera onFile={picker.onFile} />
      <HiddenFileInput inputRef={picker.library} camera={false} onFile={picker.onFile} />
      <AiAction
        look="primary"
        block
        label={t('capture.photograph')}
        disabled={busy}
        run={picker.openCamera}
      />
      <AiAction
        look="secondary"
        block
        label={t('capture.library')}
        disabled={busy}
        run={picker.openLibrary}
      />
    </div>
  );
}

/** "Paste text instead": works without a camera, and offline (no AI needed). */
export function PasteForm({ onText, busy }: { onText: (text: string) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const id = useId();
  const t = useT();
  if (!open) {
    return (
      <button type="button" className={styles.textLink} onClick={() => setOpen(true)}>
        {t('capture.pasteInstead')}
      </button>
    );
  }
  return (
    <form
      className={styles.paste}
      onSubmit={(event) => {
        event.preventDefault();
        onText(text);
      }}
    >
      <label htmlFor={id} className={styles.fieldLabel}>
        {t('capture.pasteLabel')}
      </label>
      <textarea
        id={id}
        lang="ja"
        rows={5}
        className={styles.textarea}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
      />
      <PillButton type="submit" variant="secondary" disabled={busy || !text.trim()}>
        {t('capture.useText')}
      </PillButton>
    </form>
  );
}

/** Progress or the reason a capture could not start. */
export function StartStatus({ state }: { state: StartState }) {
  const t = useT();
  if (state.status === 'idle') return null;
  if (state.status === 'busy') {
    if (state.step === 'reading')
      return <AiWriting tier="fast">{startMessage(t, state)}</AiWriting>;
    return (
      <p role="status" className={styles.muted}>
        {startMessage(t, state)}
      </p>
    );
  }
  if (state.problem.kind === 'ai' && state.problem.error.kind === 'rate-limit') {
    return (
      <AiBlockStatus tier="fast">
        <RateLimitWait error={state.problem.error} />
      </AiBlockStatus>
    );
  }
  return (
    <p role="alert" className={styles.alert}>
      {startMessage(t, state)}{' '}
      {state.needsKey && (
        <Link to={paths.settingsSection('tutor')} className={styles.inlineLink}>
          {t('capture.openSettings')}
        </Link>
      )}
    </p>
  );
}
