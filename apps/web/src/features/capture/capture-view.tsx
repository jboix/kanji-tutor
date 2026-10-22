import { useCallback, useState } from 'react';
import type { AiClient } from '../../ai/types.ts';
import { captureSentenceId } from '../../domain/services/index.ts';
import { canSpeak, speak } from '../../lang/index.ts';
import { ActionBar, ActionFixed, ActionRow } from '../../ui/action-bar.tsx';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { CameraIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { Candidates } from './candidates.tsx';
import styles from './capture.module.css';
import { addedLead, captureLine, percent } from './capture-copy.ts';
import { CaptureLines, type KeyedLine, LineExplanation } from './capture-lines.tsx';
import { LineStatic } from './line-static.tsx';
import { HiddenFileInput, StartStatus, usePhotoPicker } from './start-controls.tsx';
import { useCaptureStart } from './use-capture-start.ts';
import { type CaptureData, useCaptureView } from './use-capture-view.ts';
import { type Added, useReview } from './use-review.ts';

/** A saved capture, by id (C2–C5). */
export function CaptureView({ id }: { id: string }) {
  const { state, reload } = useCaptureView(id);
  const t = useT();
  if (state.status === 'ready') return <CaptureReview data={state.data} reload={reload} />;
  const back = <BackButton parent={paths.capture} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} />}>
      <p className={styles.muted}>
        {state.status === 'loading' ? t('capture.opening') : t('capture.gone')}
      </p>
    </Screen>
  );
}

function ReviewHeader({ data, now }: { data: CaptureData; now: number }) {
  const value = data.analysis.readiness.ratio;
  const { t, format } = useI18n();
  return (
    <>
      <header className={styles.reviewHeader}>
        <div className={styles.kicker}>{captureLine(t, format, data.capture, now)}</div>
        <h1 className={styles.title}>{t('capture.canRead', { percent: percent(value) })}</h1>
      </header>
      <ProgressLine value={value} label={t('capture.shareLabel')} />
      {data.capture.photo && (
        <AiBlock size="xs" tier="fast" label={t('capture.ocrLabel')}>
          {t('capture.ocrNote')}
        </AiBlock>
      )}
    </>
  );
}

function keyed(data: CaptureData): KeyedLine[] {
  return data.analysis.lines.map((line, index) => ({
    ...line,
    index,
    key: captureSentenceId(data.capture.id, index),
  }));
}

function AddedStatus({ added }: { added: Added | undefined }) {
  const { t, rich } = useI18n();
  if (!added) return null;
  const lead = addedLead(t, added.words, added.grammar);
  const lesson = added.lesson ? <JaRuns text={added.lesson} /> : t('capture.thisWeek');
  return (
    <p role="status" className={styles.muted}>
      {lead === undefined ? t('capture.allKnown') : rich('capture.addedTo', { lead, lesson })}
    </p>
  );
}

type Review = ReturnType<typeof useReview>;

/** The tapped line. Tapping shows what the app knows; the tutor runs only on "Ask" (A13). */
function useSelection(data: CaptureData, review: Review) {
  const [selected, setSelected] = useState<number>();
  const on = selected === undefined ? undefined : data.analysis.lines[selected];
  const note = selected === undefined ? undefined : review.notes.get(selected);
  const ask = (client: AiClient) => {
    if (selected !== undefined && on && !review.notes.has(selected))
      void review.explain(client, selected, on.text);
  };
  const text = on?.text;
  const { peekLine } = review;
  const peek = useCallback(
    async (client: AiClient) => (text ? peekLine(client, text) : undefined),
    [peekLine, text],
  );
  return { selected, select: setSelected, note, text, tokens: on?.tokens, ask, peek };
}

function ReviewCandidates({ data, review }: { data: CaptureData; review: Review }) {
  return (
    <Candidates
      words={data.analysis.words}
      grammar={review.grammar}
      picks={review.picks}
      onToggle={review.toggle}
      lesson={review.lesson}
      onLesson={review.setLesson}
      onAddGrammar={review.addGrammar}
    />
  );
}

function CaptureReview({ data, reload }: { data: CaptureData; reload: () => Promise<void> }) {
  const [now] = useState(() => Date.now());
  const review = useReview(data, reload);
  const { selected, select, note, text, tokens, ask, peek } = useSelection(data, review);
  return (
    <Screen gap={20} footer={<ReviewFooter review={review} />}>
      <ReviewHeader data={data} now={now} />
      <CaptureLines
        lines={keyed(data)}
        selected={selected}
        cited={note?.status === 'ready' ? note.cited : []}
        onSelect={select}
      />
      {tokens && <LineStatic tokens={tokens} text={text ?? ''} />}
      <LineExplanation
        note={note}
        onAsk={selected === undefined ? undefined : ask}
        peek={peek}
        onRetry={(client) =>
          selected !== undefined && text && void review.explain(client, selected, text)
        }
        onExercise={() => selected !== undefined && void review.exercise(selected)}
        onSpeak={text && canSpeak() ? () => void speak(text) : undefined}
        exercise={selected === undefined ? undefined : review.exercises.get(selected)}
      />
      <ReviewCandidates data={data} review={review} />
      <AddedStatus added={review.added} />
    </Screen>
  );
}

function AddButton({ review }: { review: Review }) {
  const count = review.words.length + review.pickedGrammar.length;
  const { t, rich } = useI18n();
  if (count === 0 && review.added) {
    return (
      <PillLink to={paths.today} grow={1}>
        {t('capture.goToday')}
      </PillLink>
    );
  }
  const lesson = review.tag ? <Ja>{review.tag}</Ja> : t('capture.thisWeek');
  return (
    <PillButton disabled={count === 0} onClick={() => void review.add()}>
      {rich('capture.addTo', { lesson })}
    </PillButton>
  );
}

/** "Take another photo" and "Add to <lesson>" (capture.html). */
function ReviewFooter({ review }: { review: Review }) {
  const start = useCaptureStart();
  const picker = usePhotoPicker((client, file) => void start.fromPhoto(client, file));
  const t = useT();
  return (
    <ActionBar>
      <StartStatus state={start.state} />
      <ActionRow>
        <ActionFixed>
          <HiddenFileInput inputRef={picker.camera} camera onFile={picker.onFile} />
          <AiAction
            look="icon"
            icon={<CameraIcon />}
            label={t('capture.anotherPhoto')}
            disabled={start.state.status === 'busy'}
            run={picker.openCamera}
          />
        </ActionFixed>
        <AddButton review={review} />
      </ActionRow>
    </ActionBar>
  );
}
