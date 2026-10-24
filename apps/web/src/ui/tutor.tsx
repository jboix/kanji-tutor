/**
 * The tutor, one tap away on every exercise, introduction and explanation (CLAUDE.md, A4): a 解
 * button that opens the conversation sheet, and suggested questions that open it asking. The
 * buttons that only open the sheet send nothing; each suggested question is one request.
 */
import { type ReactNode, useState } from 'react';
import { AiAction } from './ai-action.tsx';
import { AiSeal } from './ai-seal.tsx';
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

/** The round 解 button beside an exercise's Next (Tutor-drill). */
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

/** "Ask the tutor · about 〜か, anything", beside an introduction's Got it (Tutor-grammar-intro). */
export function TutorWideButton({ tutor }: { tutor: Tutor }) {
  const t = useT();
  return (
    <button type="button" className={styles.wide} data-tutor="" onClick={() => tutor.open()}>
      <AiSeal size={28} />
      <span className={styles.lines}>
        <span className={styles.strong}>{t('ui.tutorAsk')}</span>
        <span className={styles.sub}>
          <JaRuns text={t('ui.tutorAnything', { about: tutor.topic.about })} />
        </span>
      </span>
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

/** The suggested questions: each opens the sheet asking it (one request). */
export function TutorStarters({ tutor }: { tutor: Tutor }) {
  if (tutor.starters.length === 0) return null;
  return (
    <div className={styles.starters}>
      {tutor.starters.map((question) => (
        <AiAction
          key={question}
          label={question}
          content={<JaRuns text={question} />}
          run={(client) => tutor.open({ question, client })}
        />
      ))}
    </div>
  );
}

/**
 * An exercise's footer once answered (Tutor-drill): the suggested questions, then the 解 button
 * beside Next. Without the tutor wired, Next alone.
 */
export function TutorNext({ tutor, children }: { tutor: Tutor | undefined; children: ReactNode }) {
  if (!tutor) return <>{children}</>;
  return (
    <>
      <TutorStarters tutor={tutor} />
      <div className={styles.next}>
        <TutorButton tutor={tutor} />
        <div className={styles.grow}>{children}</div>
      </div>
      {tutor.sheet}
    </>
  );
}
