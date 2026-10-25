/**
 * The pages' text on a scanned lesson's page: tap a line, then ask the tutor to translate and
 * explain it (one request, A13); its readings come back checked (A8). Lines the tutor was unsure
 * of can be checked from here.
 */
import { useCallback, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock, AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { RateLimitNotice } from '../../ui/rate-limit-notice.tsx';
import { Reading } from '../../ui/reading.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './lesson.module.css';
import { CheckLines } from './review-pages.tsx';
import type { ReviewModel } from './use-draft-review.ts';
import { type LineNote, useLineNotes } from './use-line-notes.ts';

type Ready = Extract<LineNote, { status: 'ready' }>;
type Failed = Extract<LineNote, { status: 'error' }>;

function noteError(t: Translate, kind: Failed['kind']): string {
  if (kind === 'offline') return t('capture.noteOffline');
  if (kind === 'no-key') return t('capture.noteNoKey');
  return t('capture.noteFailed');
}

function Readings({ note }: { note: Ready }) {
  return (
    <span className={styles.readings}>
      {note.answer.readings.map((r) => (
        <span key={`${r.surface}=${r.reading}`}>
          <Ja>{r.surface}</Ja> <Reading kana={r.reading} verified={r.verified} />
        </span>
      ))}
    </span>
  );
}

interface NoteProps {
  note: LineNote | undefined;
  ask: (client: AiClient) => void;
  peek: (client: AiClient) => Promise<unknown>;
}

/** The tutor's note on the tapped line, or the press that asks for it. */
function LineNoteView({ note, ask, peek }: NoteProps) {
  const t = useT();
  if (!note) return <AiAction label={t('capture.askLine')} run={ask} peek={peek} />;
  if (note.status === 'loading') return <AiWriting>{t('capture.askingLine')}</AiWriting>;
  if (note.status === 'error') {
    return (
      <AiBlockStatus>
        {note.kind === 'rate-limit' ? (
          <RateLimitNotice retryAfterMs={note.waitMs ?? 60_000} onRetry={ask} />
        ) : (
          <p className={styles.muted}>{noteError(t, note.kind)}</p>
        )}
      </AiBlockStatus>
    );
  }
  const detail = note.answer.readings.length > 0 ? <Readings note={note} /> : undefined;
  return (
    <AiBlock
      size="sm"
      label={t('capture.lineExplanation')}
      detail={detail}
      readings={note.answer.readings}
    >
      <JaRuns text={note.answer.answer} />
    </AiBlock>
  );
}

interface LineRef {
  key: string;
  text: string;
}

function useSelectedLine(lesson: string | undefined) {
  const { notes, explain, peek } = useLineNotes(lesson);
  const [selected, setSelected] = useState<LineRef>();
  const ask = (client: AiClient) => selected && void explain(client, selected.key, selected.text);
  const text = selected?.text;
  const peekLine = useCallback(
    async (client: AiClient) => (text ? peek(client, text) : undefined),
    [peek, text],
  );
  const note = selected ? notes.get(selected.key) : undefined;
  return { selected, select: setSelected, note, ask, peek: peekLine };
}

export function LessonLines({ model }: { model: ReviewModel }) {
  const t = useT();
  const { selected, select, note, ask, peek } = useSelectedLine(model.lesson.lesson);
  return (
    <section aria-label={t('capture.linesHeading')} className={styles.section}>
      <SectionLabel as="h2">{t('capture.linesHeading')}</SectionLabel>
      <ul className={styles.lines}>
        {model.lesson.pages.flatMap((page, p) =>
          page.lines.map((line, l) => {
            const key = `${p}.${l}`;
            return (
              <li key={key}>
                <button
                  type="button"
                  lang="ja"
                  aria-pressed={selected?.key === key}
                  className={cx(styles.line, selected?.key === key && styles.lineOn)}
                  onClick={() => select({ key, text: line.text })}
                >
                  {line.text}
                </button>
                {selected?.key === key && <LineNoteView note={note} ask={ask} peek={peek} />}
              </li>
            );
          }),
        )}
      </ul>
      <CheckLines model={model} />
    </section>
  );
}
