import type { CheckedReading, Correction, CorrectionMark } from '../../ai/index.ts';
import { AiBlock } from '../../ui/ai-block.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Reading } from '../../ui/reading.tsx';
import { Insertion } from '../../ui/ruby.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './compose.module.css';
import { jaRuns } from './compose-copy.ts';
import { markSegments, type Segment } from './mark-segments.ts';

/** AI prose with its Japanese runs in Klee One. */
export function Prose({ text }: { text: string }) {
  return jaRuns(text).map((run) =>
    run.ja ? <Ja key={run.start}>{run.text}</Ja> : <span key={run.start}>{run.text}</span>,
  );
}

function SegmentView({ segment }: { segment: Segment }) {
  const t = useT();
  switch (segment.kind) {
    case 'plain':
      return segment.text;
    case 'insert':
      return <Insertion text={segment.insert} />;
    case 'style':
      return <span className={styles.wavy}>{segment.text}</span>;
    case 'delete':
      return <del className={styles.struck}>{segment.text}</del>;
    case 'replace':
      return (
        <ruby className={styles.ruby}>
          <del className={styles.struck}>{segment.text}</del>
          <rt className={styles.fix}>
            <span className="visually-hidden">{t('compose.instead')}</span>
            {segment.insert}
          </rt>
        </ruby>
      );
  }
}

/** The learner's sentence with the red pen on it (compose.html). */
export function MarkedSentence({ segments }: { segments: readonly Segment[] }) {
  return (
    <p lang="ja" className={styles.sentence}>
      {segments.map((segment) => (
        <SegmentView key={`${segment.kind}${segment.start}`} segment={segment} />
      ))}
    </p>
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

/** The corrected sentence, one note per mark, the summary and any unverified readings. */
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
  const { t, rich } = useI18n();
  return (
    <AiBlock size="sm" label={t('compose.markedLabel')} readings={correction.readings}>
      <div className={styles.block}>
        <SectionLabel>{t('compose.yourSentence')}</SectionLabel>
        <MarkedSentence segments={segments} />
      </div>
      <div className={styles.notes}>
        {marks.map((mark) => (
          <MarkNote key={`${mark.start}-${mark.end}-${mark.kind}`} mark={mark} />
        ))}
        <p className={styles.muted}>
          <Prose text={correction.summary} />
        </p>
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
