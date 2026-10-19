import type { CheckedReading, SentenceBreakdown, WordExplanation } from '../../ai/types.ts';
import { glossesIn } from '../../domain/localized.ts';
import type { Word } from '../../domain/types.ts';
import { AiAction, type AiPeek, type AiRun } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { ChipRow } from '../../ui/chip.tsx';
import { cx } from '../../ui/cx.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { Reading } from '../../ui/reading.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import type { ChipContext } from './chip-actions.ts';
import styles from './explain.module.css';
import { ChipOutcomeView } from './follow-up-view.tsx';
import { ImmersionFooter, JaText } from './ja-text.tsx';
import { followUpChips } from './sentence-context.ts';
import { UncheckedReadings, unverified } from './unchecked-readings.tsx';
import type { AiState } from './use-ai.ts';
import { useChips } from './use-chips.tsx';
import type { SourceLesson } from './use-word-data.ts';

/** Reading and meaning under the big word: the AI's (marked if unverified), else the dictionary's. */
export function HeadingGloss(props: {
  explain: AiState<WordExplanation>;
  surface: string;
  word: Word | undefined;
  reading: string;
}) {
  const { language } = useI18n();
  // A reading the model gave for another surface (間に for 間) would not be about this word.
  if (props.explain.status === 'done' && props.explain.value.reading.surface === props.surface) {
    const { reading, meaning } = props.explain.value;
    return (
      <>
        <Reading kana={reading.reading} verified={reading.verified} /> · {meaning}
      </>
    );
  }
  const glosses = props.word && glossesIn(props.word, language);
  const gloss = glosses?.value[0];
  return (
    <>
      {props.reading && <Reading kana={props.reading} />}
      {gloss && `${props.reading ? ' · ' : ''}${gloss}`}
      {gloss && <EnMark english={glosses.fallback} />}
    </>
  );
}

/** Leading and trailing punctuation is not part of a chunk's meaning (、本を読みました。). */
function chunkText(text: string): string {
  return text.replace(/^[、。,.\s]+|[、。,.\s]+$/gu, '');
}

/** HOW THIS SENTENCE IS BUILT: chunks with glosses, the tapped one underlined (explain.html). */
function Chunks({ value, cached }: { value: SentenceBreakdown; cached?: boolean | undefined }) {
  const t = useT();
  return (
    <section className={styles.breakdown} aria-label={t('explain.builtLabel')}>
      <SectionLabel>{t('explain.builtLabel')}</SectionLabel>
      <AiBlock size="sm" tier="fast" readings={value.readings} cached={cached}>
        <ChunkList value={value} />
      </AiBlock>
    </section>
  );
}

function ChunkList({ value }: { value: SentenceBreakdown }) {
  return (
    <ul className={styles.chunks}>
      {value.chunks.map((chunk) => (
        <li key={`${chunk.text}:${chunk.gloss}`} className={styles.chunk}>
          <span lang="ja" className={cx(styles.chunkText, chunk.focus && styles.focusText)}>
            {chunkText(chunk.text)}
          </span>
          <span className={cx(styles.chunkGloss, chunk.focus && styles.focusGloss)}>
            {chunk.gloss}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface NuanceNoteProps {
  value: WordExplanation;
  context: ChipContext;
  cached: boolean | undefined;
}

function NuanceNote({ value, context, cached }: NuanceNoteProps) {
  const t = useT();
  const { buttons, state, onWriteNew, retry } = useChips(
    followUpChips(t, value.chips, context.surface),
    context,
  );
  return (
    <>
      <AiBlock
        size="sm"
        label={t('explain.tutorOn', { surface: value.surface })}
        readings={[value.reading, ...value.readings]}
        cached={cached}
      >
        <p className={styles.para}>
          <JaText text={value.nuance} immersion={value.immersion} />
        </p>
        {value.contrast && (
          <p className={styles.para}>
            <Ja variant="line">{value.contrast.text}</Ja>
            <span className={styles.gloss}>{value.contrast.meaning}</span>
          </p>
        )}
        {value.hook && (
          <p className={styles.para}>
            <JaText text={value.hook} immersion={value.immersion} />
          </p>
        )}
        <ImmersionFooter immersion={value.immersion} />
      </AiBlock>
      <ChipRow>{buttons}</ChipRow>
      <ChipOutcomeView
        state={state}
        rest={t('explain.restDictionary')}
        onWriteNew={onWriteNew}
        onRetry={retry}
      />
    </>
  );
}

interface TutorViewProps<T> {
  state: AiState<T>;
  onAsk: AiRun;
  /** The cached answer, so the button can say "Saved" (A18). */
  peek: AiPeek;
}

/** The breakdown once asked: "Break down with the tutor" runs breakdownSentence (A13). */
export function BreakdownView({ state, onAsk, peek }: TutorViewProps<SentenceBreakdown>) {
  const t = useT();
  if (state.status === 'done') return <Chunks value={state.value} cached={state.cached} />;
  if (state.status === 'loading') return <Pending>{t('explain.breakingDown')}</Pending>;
  if (state.status === 'error')
    return <AiProblem error={state.error} rest={t('explain.restDictionary')} onRetry={onAsk} />;
  return <AiAction label={t('explain.breakDown')} run={onAsk} peek={peek} />;
}

/** The tutor's note on the word, with its chips, once asked (A13). */
export function NuanceView(props: TutorViewProps<WordExplanation> & { context: ChipContext }) {
  const { state, onAsk, peek } = props;
  const t = useT();
  if (state.status === 'done') {
    return <NuanceNote value={state.value} context={props.context} cached={state.cached} />;
  }
  if (state.status === 'loading') return <Pending>{t('explain.lookingAtWord')}</Pending>;
  if (state.status === 'error')
    return <AiProblem error={state.error} rest={t('explain.restDictionary')} onRetry={onAsk} />;
  return <AiAction label={t('explain.askWord')} run={onAsk} peek={peek} />;
}

function allReadings(
  explain: AiState<WordExplanation>,
  breakdown: AiState<SentenceBreakdown>,
): CheckedReading[] | undefined {
  if (explain.status !== 'done') return undefined;
  const extra = breakdown.status === 'done' ? breakdown.value.readings : [];
  return [explain.value.reading, ...explain.value.readings, ...extra];
}

/** "Grammar point from Tobira 第4課 · readings checked against the dictionary" (explain.html). */
export function SheetFooter(props: {
  explain: AiState<WordExplanation>;
  breakdown: AiState<SentenceBreakdown>;
  lesson: SourceLesson | undefined;
}) {
  const { t, rich } = useI18n();
  const readings = allReadings(props.explain, props.breakdown);
  if (!readings) return null;
  const checked = unverified(readings).length === 0;
  const claim = checked ? t('explain.claimChecked') : t('explain.claimUnchecked');
  const alone = checked ? t('explain.aloneChecked') : t('explain.aloneUnchecked');
  const { lesson } = props;
  const from = lesson?.what === 'grammar' ? 'explain.fromGrammar' : 'explain.fromWord';
  return (
    <div className={styles.footer}>
      <p className={styles.footLine}>
        {lesson ? rich(from, { lesson: <JaRuns text={lesson.lesson} />, claim }) : alone}
      </p>
      <UncheckedReadings readings={readings} />
    </div>
  );
}
