/**
 * The tutor, one tap away on every exercise, introduction and explanation (CLAUDE.md, A4): a 解
 * button that opens the conversation sheet. Opening it sends nothing; the suggested questions
 * about what is on screen wait inside the sheet, each one request.
 */
import { type ReactNode, useState } from 'react';
import { AiSeal } from './ai-seal.tsx';
import { Chip } from './chip.tsx';
import { useT } from './i18n/i18n.tsx';
import { JaRuns } from './ja-runs.tsx';
import { type TutorQuestion, type TutorTopic, useSlot } from './slots.tsx';
import styles from './tutor.module.css';

export interface TutorOptions {
  topic: TutorTopic;
  /** Suggested questions about what is on screen, two at most. */
  starters: readonly string[];
}

export interface Tutor extends TutorOptions {
  /** Opens the sheet, asking `first` when a suggested question was pressed. */
  open: (first?: TutorQuestion) => void;
  /** The sheet while open: render it anywhere on the screen. */
  sheet: ReactNode;
}

/** The tutor for what is on screen; undefined when the explain feature is not wired. */
export function useTutor(options: TutorOptions): Tutor | undefined {
  const Sheet = useSlot('tutorSheet');
  const [opened, setOpened] = useState<{ first?: TutorQuestion | undefined }>();
  if (!Sheet) return undefined;
  const sheet = opened && (
    <Sheet
      topic={options.topic}
      starters={options.starters}
      first={opened.first}
      onClose={() => setOpened(undefined)}
    />
  );
  return { ...options, open: (first) => setOpened({ first }), sheet };
}

/** "Your tutor · About 〜ました", heading the conversation sheet (Tutor-sheet). */
export function TutorHeading({ about }: { about: string }) {
  const t = useT();
  return (
    <div className={styles.heading}>
      <AiSeal size={28} />
      <span className={styles.lines}>
        <span className={styles.strong}>{t('ui.tutorTitle')}</span>
        <span className={styles.sub}>
          <JaRuns text={t('ui.tutorAbout', { about })} />
        </span>
      </span>
    </div>
  );
}

/** The round 解 button beside an exercise's Next or an introduction's Got it (Tutor-drill). */
export function TutorButton({ tutor }: { tutor: Tutor }) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.round}
      aria-label={t('ui.tutorOpen', { about: tutor.topic.about })}
      data-tutor=""
      onClick={() => tutor.open()}
    >
      <AiSeal size={28} />
    </button>
  );
}

/** "Talk it through with the tutor", near the top of a page (Tutor-grammar-page). */
export function TutorCard({ tutor }: { tutor: Tutor }) {
  const t = useT();
  return (
    <button type="button" className={styles.card} data-tutor="" onClick={() => tutor.open()}>
      <AiSeal size={28} />
      <span className={styles.lines}>
        <span className={styles.strong}>{t('ui.tutorTalk')}</span>
        <span className={styles.sub}>
          <JaRuns text={t('ui.tutorTalkLine', { about: tutor.topic.about })} />
        </span>
      </span>
    </button>
  );
}

/** "Ask", floating over a long page so the tutor stays in reach while it scrolls. */
export function TutorFloat({ tutor }: { tutor: Tutor }) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.float}
      aria-label={t('ui.tutorOpen', { about: tutor.topic.about })}
      onClick={() => tutor.open()}
    >
      <AiSeal size={28} />
      <span className={styles.strong}>{t('ui.tutorFloat')}</span>
    </button>
  );
}

/**
 * The tutor as a chip with its 解 seal and what to ask ("Explain this conversation"), among an
 * exercise's chips before its answer, so it is in reach at once. Renders the sheet too.
 */
export function TutorChip({ tutor, label }: { tutor: Tutor; label: string }) {
  return (
    <>
      <Chip icon={<AiSeal size={22} />} data-tutor="" onClick={() => tutor.open()}>
        {label}
      </Chip>
      {tutor.sheet}
    </>
  );
}

/**
 * An exercise's or introduction's footer (Tutor-drill): the 解 button beside Next or Got it.
 * The suggested questions wait inside the sheet, so the footer stays two buttons. Without the
 * tutor wired, the action alone.
 */
export function TutorNext({ tutor, children }: { tutor: Tutor | undefined; children: ReactNode }) {
  if (!tutor) return <>{children}</>;
  return (
    <>
      <div className={styles.next}>
        <TutorButton tutor={tutor} />
        <div className={styles.grow}>{children}</div>
      </div>
      {tutor.sheet}
    </>
  );
}
