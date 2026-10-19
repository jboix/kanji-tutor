import { useId } from 'react';
import { Link } from 'react-router';
import type { AiErrorKind } from '../../ai/index.ts';
import type { AiRun } from '../../ui/ai-action.tsx';
import { AiBlockStatus } from '../../ui/ai-block.tsx';
import { CompositionMark } from '../../ui/composition-mark.tsx';
import { cx } from '../../ui/cx.ts';
import { DictationButton } from '../../ui/dictation-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { KanaToggle, KanjiCandidatePopup } from '../../ui/kanji-candidates.tsx';
import { paths } from '../../ui/paths.ts';
import { RateLimitNotice } from '../../ui/rate-limit-notice.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useJapaneseTyping } from '../../ui/use-japanese-typing.ts';
import styles from './compose.module.css';
import { errorCopy } from './compose-copy.ts';
import { useKanaMode } from './use-kana-mode.ts';

export interface DraftEditorProps {
  text: string;
  onChange: (text: string) => void;
  error: AiErrorKind | 'save' | undefined;
  /** The wait after a rate limit, and Retry (A14). */
  waitMs?: number | undefined;
  onRetry?: AiRun | undefined;
  disabled: boolean;
}

/**
 * The sentence field: Klee One on ruled lines. Written with the keyboard's Japanese IME, by voice
 * (I3), or in romaji that turns into kana with kanji spellings to pick in a popup by the kana (C6). The
 * あ switch cycles hiragana, katakana and romaji as typed (D109); capitals give katakana too. The
 * kana a pick would replace is underlined, as an IME does; a Japanese keyboard switches all of
 * this off (D112), and an IME composition is never touched.
 */
export function DraftEditor(props: DraftEditorProps) {
  const { text, onChange, error, disabled } = props;
  const id = useId();
  const t = useT();
  const { mode, choose, native } = useKanaMode();
  const typing = useJapaneseTyping<HTMLTextAreaElement>(text, onChange, mode, { onNative: native });
  return (
    <div className={cx(styles.block, styles.typing)}>
      <div className={styles.labelRow}>
        <label htmlFor={id}>
          <SectionLabel>{t('compose.yourSentence')}</SectionLabel>
        </label>
        <div className={styles.tools}>
          <KanaToggle mode={mode} onChange={choose} />
          <DictationButton
            label={t('compose.dictate')}
            onText={(spoken) => onChange(text + spoken)}
          />
        </div>
      </div>
      <textarea
        id={id}
        lang="ja"
        className={styles.editor}
        ref={typing.ref}
        value={text}
        {...typing.handlers}
        placeholder={t('compose.placeholder')}
        disabled={disabled}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        rows={3}
      />
      {!disabled && <CompositionMark typing={typing} />}
      {!disabled && <KanjiCandidatePopup typing={typing} />}
      {error && <ErrorLine kind={error} waitMs={props.waitMs} onRetry={props.onRetry} />}
    </div>
  );
}

interface ErrorLineProps {
  kind: AiErrorKind | 'save';
  waitMs?: number | undefined;
  onRetry?: AiRun | undefined;
}

/**
 * Why the check or save failed, calmly; links to Settings when the key is missing. A tutor
 * problem sits in the AI box, with the countdown and Retry after a rate limit (A14).
 */
export function ErrorLine(props: ErrorLineProps) {
  if (props.kind === 'save') return <ErrorText kind="save" />;
  return (
    <AiBlockStatus>
      {props.kind === 'rate-limit' ? (
        <RateLimitNotice retryAfterMs={props.waitMs ?? 60_000} onRetry={props.onRetry} />
      ) : (
        <ErrorText kind={props.kind} />
      )}
    </AiBlockStatus>
  );
}

function ErrorText({ kind }: { kind: AiErrorKind | 'save' }) {
  const t = useT();
  const copy = errorCopy(t, kind);
  return (
    <p className={styles.muted} role="status">
      {copy.text}
      {copy.settings && (
        <>
          {' '}
          <Link to={paths.settingsSection('tutor')}>{t('compose.openSettings')}</Link>
        </>
      )}
    </p>
  );
}
