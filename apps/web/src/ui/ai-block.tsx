/**
 * The AI box (D57): every text the tutor wrote goes through `AiBlock`, and nothing static ever
 * does. A box with a AI red rule, the 解 seal and a "Tutor · model" line, then the text, the
 * marks it carries (saved answer, a reading hidden, not in your language), detail and chips.
 * `AiBlockStatus` is the same box for the request states: writing, the rate-limit countdown and
 * Retry, offline, no key, an error. Static teaching content (dictionary, catalogue grammar,
 * static notes, the plain letter) stays ink on paper: no seal, no AI red.
 */
import { type ReactNode, useEffect, useState } from 'react';
import type { CheckedReading } from '../ai/types.ts';
import { DEFAULT_MODEL_ID, DEFAULT_TEACHER_MODEL_ID } from '../domain/defaults.ts';
import styles from './ai-block.module.css';
import { AiSeal } from './ai-seal.tsx';
import { ChipRow } from './chip.tsx';
import { cx } from './cx.ts';
import { useI18n, useT } from './i18n/i18n.tsx';
import { Ja } from './ja.tsx';
import { useServices } from './services.tsx';

export type AiBlockSize = 'md' | 'sm' | 'xs' | 'panel';
/** Which model wrote it: the teacher (tool-using) model or the fast one (A12). */
export type AiTier = 'teacher' | 'fast';

/** "gemini-3.5-flash-lite" → "Flash-Lite 3.5"; an unknown id stays as it is. */
export function modelShortName(id: string): string {
  const match = /^gemini-([\d.]+)-(.+?)(?:-preview.*)?$/.exec(id);
  if (!match) return id;
  const name = (match[2] ?? '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
  return `${name} ${match[1]}`;
}

/** The short name of the model a tier runs on, from Settings. */
function useModelName(tier: AiTier): string {
  const { repos } = useServices();
  const fallback = tier === 'teacher' ? DEFAULT_TEACHER_MODEL_ID : DEFAULT_MODEL_ID;
  const [id, setId] = useState(fallback);
  useEffect(() => {
    let live = true;
    repos.settings.get().then(
      (s) => live && setId((tier === 'teacher' ? s.teacherModelId : undefined) ?? s.modelId),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [repos, tier]);
  return modelShortName(id);
}

/** The marks an AI text may carry, shown in its header line. */
export interface AiMarks {
  /** Served from the local cache: no call was made (A15). */
  cached?: boolean | undefined;
  /** A reading still to be answered was removed (L3). */
  hidden?: boolean | undefined;
  /** The reply is not in the explanation language (D35). */
  offLanguage?: boolean | undefined;
}

function Header({ tier, marks }: { tier: AiTier; marks: AiMarks }) {
  const t = useT();
  const model = useModelName(tier);
  const extra = [
    marks.cached && t('ui.aiSaved'),
    marks.hidden && t('ui.aiHidden'),
    marks.offLanguage && t('ui.aiOffLanguage'),
  ].filter(Boolean);
  return (
    <p className={styles.header}>
      {t('ui.aiTutor', { model })}
      {extra.map((mark) => (
        <span key={String(mark)} className={styles.mark}>
          {' · '}
          {mark}
        </span>
      ))}
    </p>
  );
}

export interface AiBlockProps extends AiMarks {
  /** The tutor's text. Put Japanese in `<Ja>` and readings in `<Reading>`. */
  children: ReactNode;
  /** md: read/voice · sm: today/explain/compose · xs: kanji · panel: handwrite. */
  size?: AiBlockSize;
  /** Follow-up chips under the text. */
  chips?: ReactNode;
  /** Muted lines under the text, e.g. readings the dictionary could not confirm. */
  detail?: ReactNode;
  /** The 〜 outline seal: a style note, not an error (compose.html). */
  styleNote?: boolean;
  /** Accessible name; "From the tutor" by default. */
  label?: string;
  tier?: AiTier;
  /** The checked readings of the text: a less common one is named with the usual one (R10). */
  readings?: readonly CheckedReading[] | undefined;
}

/** "Less common reading にっぽんじん for 日本人: the usual one is にほんじん." (R10, D57). */
function LessCommon({ readings }: { readings: readonly CheckedReading[] | undefined }) {
  const { rich } = useI18n();
  const marked = (readings ?? []).filter((r) => r.verified && r.preferred);
  const unique = [...new Map(marked.map((r) => [`${r.surface}=${r.reading}`, r])).values()];
  return unique.map((r) => (
    <p key={`${r.surface}=${r.reading}`} className={styles.lessCommon}>
      {rich('ui.lessCommon', {
        word: <Ja>{r.surface}</Ja>,
        reading: <Ja>{r.reading}</Ja>,
        usual: <Ja>{r.preferred}</Ja>,
      })}
    </p>
  ));
}

/** Tutor-written text in the AI box (see the module comment). */
export function AiBlock(props: AiBlockProps) {
  const t = useT();
  const { size = 'md', chips, detail, tier = 'teacher' } = props;
  return (
    <div
      role="note"
      aria-label={props.label ?? t('ui.fromTutor')}
      data-ai-block=""
      className={cx(styles.block, styles[size])}
    >
      <AiSeal size={size === 'xs' ? 22 : 24} outline={props.styleNote ?? false} />
      <div className={styles.body}>
        <Header tier={tier} marks={props} />
        <div className={styles.text}>{props.children}</div>
        <LessCommon readings={props.readings} />
        {detail !== undefined && detail !== false && <div className={styles.detail}>{detail}</div>}
        {chips !== undefined && <ChipRow>{chips}</ChipRow>}
      </div>
    </div>
  );
}

/** The AI box for a request state (writing, wait, offline, no key, error): a live region. */
export function AiBlockStatus(props: { children: ReactNode; tier?: AiTier }) {
  return (
    <div data-ai-block="status" className={cx(styles.block, styles.status)}>
      <AiSeal size={22} />
      <div className={styles.body}>
        <Header tier={props.tier ?? 'teacher'} marks={{}} />
        <div className={styles.statusText}>{props.children}</div>
      </div>
    </div>
  );
}

/** "The tutor is writing…" in the AI box. */
export function AiWriting({ children, tier }: { children?: ReactNode; tier?: AiTier }) {
  const t = useT();
  return (
    <AiBlockStatus {...(tier ? { tier } : {})}>
      <p className={styles.line} role="status">
        {children ?? t('ui.aiWriting')}
      </p>
    </AiBlockStatus>
  );
}

/** The large seal with a rule after it, separating an AI letter from the plan (notes.html). */
export function AiDivider() {
  return (
    <div className={styles.divider}>
      <AiSeal size={28} />
    </div>
  );
}
