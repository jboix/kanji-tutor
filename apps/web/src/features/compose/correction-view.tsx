import type { CheckedReading, Correction, CorrectionMark } from '../../ai/index.ts';
import { AiBlock } from '../../ui/ai-block.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Reading } from '../../ui/reading.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './compose.module.css';
import { jaRuns } from './compose-copy.ts';
import { markSegments } from './mark-segments.ts';
import { VerdictCard } from './verdict-card.tsx';

/** AI prose with its Japanese runs in Klee One. */
export function Prose({ text }: { text: string }) {
  return jaRuns(text).map((run) =>
    run.ja ? <Ja key={run.start}>{run.text}</Ja> : <span key={run.start}>{run.text}</span>,
  );
}

/** One red-pen note inside the AI box; a style note is marked 〜 rather than as an error. */
function MarkNote({ mark }: { mark: CorrectionMark }) {
  const style = mark.severity === 'style';
  const t = useT();
  return (
    <div
      role="note"
      aria-label={style ? t('compose.styleNote') : t('compose.correction')}
      className={style ? styles.styleMark : styles.errorMark}
    >
      <b>
        <Prose text={mark.title} />
      </b>{' '}
      <Prose text={mark.note} />
    </div>
  );
}

function UnverifiedReadings({ readings }: { readings: readonly CheckedReading[] }) {
  const t = useT();
  const unverified = readings.filter((reading) => !reading.verified);
  if (unverified.length === 0) return null;
  return (
    <p className={styles.muted}>
      {t('compose.unverified')}
      {unverified.map((reading) => (
        <span key={`${reading.surface}=${reading.reading}`}>
          <Ja>{reading.surface}</Ja> <Reading kana={reading.reading} verified={false} />{' '}
        </span>
      ))}
      {t('compose.unverifiedEnd')}
    </p>
  );
}

/** "What works" and "One thing to try": a labelled paragraph of the tutor's notes. */
function Part({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div className={styles.part}>
      <SectionLabel>{label}</SectionLabel>
      <p className={styles.partText}>
        <Prose text={text} />
      </p>
    </div>
  );
}

/** The tutor's notes: one per mark, what works, one thing to try, and what to watch. */
function TutorNotes(props: { correction: Correction; marks: CorrectionMark[]; pattern: string }) {
  const { correction, marks, pattern } = props;
  const { t, rich } = useI18n();
  return (
    <AiBlock size="sm" label={t('compose.markedLabel')} readings={correction.readings}>
      <div className={styles.notes}>
        {marks.map((mark) => (
          <MarkNote key={`${mark.start}-${mark.end}-${mark.kind}`} mark={mark} />
        ))}
        <Part label={t('compose.works')} text={correction.works} />
        <Part label={t('compose.next')} text={correction.next} />
        {!correction.usesTarget && (
          <p className={styles.muted}>
            {rich('compose.notTarget', { pattern: <Ja>{pattern}</Ja> })}
          </p>
        )}
        <UnverifiedReadings readings={correction.readings} />
      </div>
    </AiBlock>
  );
}

/** The verdict with the marked sentence, then the tutor's notes (Compose-natural, -needs-work). */
export function CorrectionView({
  text,
  correction,
  pattern,
}: {
  text: string;
  correction: Correction;
  pattern: string;
}) {
  const { segments, marks } = markSegments(text, correction.marks);
  const fixes = marks.filter((mark) => mark.severity === 'error').length;
  return (
    <>
      <VerdictCard verdict={correction.verdict} fixes={fixes} segments={segments} />
      <TutorNotes correction={correction} marks={marks} pattern={pattern} />
    </>
  );
}
