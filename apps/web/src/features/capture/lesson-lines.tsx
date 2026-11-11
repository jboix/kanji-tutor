/**
 * The printed lines on a scanned lesson's page: tap a line, then ask the tutor to translate and
 * explain it (one request, A13); its readings come back checked (A8).
 */
import { useCallback, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import type { BlockLine } from '../../domain/services/index.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock, AiBlockStatus, AiWriting } from '../../ui/ai-block.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { RateLimitNotice } from '../../ui/rate-limit-notice.tsx';
import { Reading } from '../../ui/reading.tsx';
import styles from './lesson.module.css';
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

/** The line tapped on a lesson's pages and the tutor's note on it. */
export function useSelectedLine(lesson: string | undefined) {
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

export type LineAsk = ReturnType<typeof useSelectedLine>;

interface BlockLinesProps {
  /** The page's index, which with a line's makes its key. */
  page: number;
  lines: readonly BlockLine[];
  ask: LineAsk;
}

/** A block's lines as printed: tap one, then ask the tutor about it. */
export function BlockLines({ page, lines, ask }: BlockLinesProps) {
  return (
    <ul className={styles.lines}>
      {lines.map((line) => {
        const key = `${page}.${line.index}`;
        const on = ask.selected?.key === key;
        return (
          <li key={key}>
            <button
              type="button"
              lang="ja"
              aria-pressed={on}
              className={cx(styles.line, on && styles.lineOn)}
              onClick={() => ask.select({ key, text: line.text })}
            >
              {line.text}
            </button>
            {on && <LineNoteView note={ask.note} ask={ask.ask} peek={ask.peek} />}
          </li>
        );
      })}
    </ul>
  );
}
