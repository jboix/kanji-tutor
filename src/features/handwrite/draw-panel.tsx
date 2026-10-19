import type { Dispatch } from 'react';
import { AiAction, type AiRun } from '../../ui/ai-action.tsx';
import { AiWriting } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { useOnline } from '../../ui/use-online.ts';
import { Picker } from './candidate-picker.tsx';
import { DrawingPad } from './drawing-pad.tsx';
import styles from './handwrite.module.css';
import type { Ink, InkAction } from './ink.ts';
import { AiProblem, StatusLine } from './status-line.tsx';
import { type AiLookup, useAskAi } from './use-ai-lookup.ts';
import { type Recognition, useRecognition } from './use-recognition.ts';

function AskAi({ lookup, ask }: { lookup: AiLookup; ask: AiRun }) {
  const t = useT();
  if (lookup.state === 'asking') return <AiWriting tier="fast">{t('handwrite.asking')}</AiWriting>;
  if (lookup.state === 'failed') {
    return <AiProblem error={lookup.error} task={t('handwrite.taskAsk')} onRetry={ask} />;
  }
  if (lookup.state === 'done' && lookup.candidates.length === 0) {
    return <StatusLine>{t('handwrite.aiNone')}</StatusLine>;
  }
  if (lookup.state === 'done') return null;
  return <AiAction look="secondary" label={t('handwrite.askAi')} run={ask} />;
}

function offlineNote(t: Translate, recognition: Recognition): string | undefined {
  if (recognition.status === 'loading') return t('handwrite.recognizerLoading');
  if (recognition.status === 'failed') return t('handwrite.recognizerFailed');
  if (recognition.unsure) return t('handwrite.unsure');
  return undefined;
}

function useResults(strokes: Ink['strokes'], recognition: Recognition) {
  const { lookup, ask } = useAskAi(strokes);
  const online = useOnline();
  const t = useT();
  const fromAi = lookup.state === 'done' && lookup.candidates.length > 0;
  return {
    lookup,
    ask,
    fromAi,
    chars: fromAi ? lookup.candidates.map((c) => c.char) : recognition.candidates,
    note: fromAi ? undefined : offlineNote(t, recognition),
    offerAi: recognition.unsure && (online || lookup.state !== 'idle'),
  };
}

function Results({ strokes, recognition }: { strokes: Ink['strokes']; recognition: Recognition }) {
  const { lookup, ask, fromAi, chars, note, offerAi } = useResults(strokes, recognition);
  const t = useT();
  if (strokes.length === 0) return <StatusLine>{t('handwrite.drawPrompt')}</StatusLine>;
  return (
    <>
      <Picker chars={chars} aiNote={fromAi ? t('handwrite.readByAi') : undefined} />
      {note && <StatusLine>{note}</StatusLine>}
      {offerAi && <AskAi lookup={lookup} ask={ask} />}
    </>
  );
}

/** The mockup's panel: switches to describe mode. */
function DescribeHint({ onDescribe }: { onDescribe: () => void }) {
  const t = useT();
  return (
    <section className={styles.hint} aria-label={t('handwrite.describeInstead')}>
      <button type="button" className={styles.hintButton} onClick={onDescribe}>
        {t('handwrite.cantDraw')}
      </button>
      <p className={styles.hintDetail}>{t('handwrite.describeQuoted')}</p>
    </section>
  );
}

export interface DrawPanelProps {
  ink: Ink;
  dispatch: Dispatch<InkAction>;
  onDescribe: () => void;
}

/** Draw mode (I4): the pad, offline candidates after every stroke, and the AI fallback. */
export function DrawPanel({ ink, dispatch, onDescribe }: DrawPanelProps) {
  const recognition = useRecognition(ink.strokes);
  return (
    <>
      <DrawingPad ink={ink} dispatch={dispatch} />
      <Results strokes={ink.strokes} recognition={recognition} />
      <DescribeHint onDescribe={onDescribe} />
    </>
  );
}
