import type { AnalysedLine, ExerciseOutcome } from '../../domain/services/index.ts';
import { AiAction, type AiPeek, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock, AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { Chip } from '../../ui/chip.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { RateLimitNotice } from '../../ui/rate-limit-notice.tsx';
import { Reading } from '../../ui/reading.tsx';
import styles from './capture.module.css';
import { exerciseMessage, noteErrorMessage } from './capture-copy.ts';
import { lineSegments, splitJapanese } from './line-segments.ts';
import type { LineNote } from './use-line-notes.ts';

/** A line with its position, which is also its key: captured lines never move. */
export type KeyedLine = AnalysedLine & { index: number; key: string };

interface LineProps {
  line: KeyedLine;
  on: boolean;
  cited: readonly string[];
  onSelect: (line: number) => void;
}

function CaptureLine({ line, on, cited, onSelect }: LineProps) {
  const segments = lineSegments(line.text, line.tokens, line.unknown, on ? cited : []);
  return (
    <button
      type="button"
      lang="ja"
      aria-pressed={on}
      className={cx(styles.line, on && styles.lineOn)}
      onClick={() => onSelect(line.index)}
    >
      {segments.map((segment) => (
        <span
          key={segment.start}
          className={cx(segment.unknown && styles.unknown, segment.cited && styles.cited)}
        >
          {segment.text}
        </span>
      ))}
    </button>
  );
}

interface LinesProps {
  lines: readonly KeyedLine[];
  selected: number | undefined;
  /** Phrases the selected line's explanation is about. */
  cited: readonly string[];
  onSelect: (line: number) => void;
}

/** The captured text, one tappable line each; unknown words dotted (capture.html). */
export function CaptureLines({ lines, selected, cited, onSelect }: LinesProps) {
  return (
    <div className={styles.lines}>
      {lines.map((line) => (
        <CaptureLine
          key={line.key}
          line={line}
          on={line.index === selected}
          cited={cited}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/** Explanation text with Japanese runs in Klee One. */
function NoteText({ text }: { text: string }) {
  return (
    <>
      {splitJapanese(text).map((part) =>
        part.ja ? <Ja key={part.start}>{part.text}</Ja> : <span key={part.start}>{part.text}</span>,
      )}
    </>
  );
}

interface NoteProps {
  note: LineNote | undefined;
  /** "Ask the tutor about this line": the one AI call for it (A13). */
  onAsk?: AiRun | undefined;
  /** The tutor's note for the line if it already wrote one, so the button says "Saved". */
  peek?: AiPeek | undefined;
  /** Asks again after a rate limit (A14). */
  onRetry?: AiRun | undefined;
  onExercise: () => void;
  onSpeak: (() => void) | undefined;
  exercise: ExerciseOutcome | undefined;
}

function Readings({ note }: { note: Extract<LineNote, { status: 'ready' }> }) {
  return (
    <span className={styles.readings}>
      {note.answer.readings.map((r) => (
        <span key={`${r.surface}=${r.reading}`} className={styles.readingPair}>
          <Ja>{r.surface}</Ja> <Reading kana={r.reading} verified={r.verified} />
        </span>
      ))}
    </span>
  );
}

/** Why the line note did not come, in the AI box; the countdown and Retry after a 429. */
function LineProblem(props: {
  note: Extract<LineNote, { status: 'error' }>;
  onRetry: AiRun | undefined;
}) {
  const t = useT();
  const { kind, waitMs } = props.note;
  return (
    <AiBlockStatus>
      {kind === 'rate-limit' ? (
        <RateLimitNotice retryAfterMs={waitMs ?? 60_000} onRetry={props.onRetry} />
      ) : (
        <p className={styles.alert}>{noteErrorMessage(t, kind)}</p>
      )}
    </AiBlockStatus>
  );
}

/** The AI note under the lines for the tapped line (C4), with its two chips. */
export function LineExplanation({
  note,
  onAsk,
  peek,
  onRetry,
  onExercise,
  onSpeak,
  exercise,
}: NoteProps) {
  const t = useT();
  if (!note)
    return onAsk ? <AiAction label={t('capture.askLine')} run={onAsk} peek={peek} /> : null;
  if (note.status === 'loading') return <AiWriting>{t('capture.askingLine')}</AiWriting>;
  if (note.status === 'error') return <LineProblem note={note} onRetry={onRetry} />;
  const chips = (
    <>
      <Chip onClick={onExercise}>{t('capture.toExercise')}</Chip>
      {onSpeak && <Chip onClick={onSpeak}>{t('capture.readAloud')}</Chip>}
    </>
  );
  const readings = note.answer.readings.length > 0 ? <Readings note={note} /> : undefined;
  return (
    <div className={styles.noteBlock}>
      <AiBlock
        size="sm"
        label={t('capture.lineExplanation')}
        detail={readings}
        chips={chips}
        readings={note.answer.readings}
      >
        <NoteText text={note.answer.answer} />
      </AiBlock>
      {exercise && (
        <p role="status" className={styles.exerciseStatus}>
          {exerciseMessage(t, exercise)}
        </p>
      )}
    </div>
  );
}
