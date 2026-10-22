import type { MistakeExplanation as Explanation } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock } from '../../ui/ai-block.tsx';
import { Chip } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import type { MistakeSlotProps } from '../../ui/slots.tsx';
import { AiProblem, Pending } from './ai-status.tsx';
import type { ChipContext } from './chip-actions.ts';
import styles from './explain.module.css';
import { ChipOutcomeView } from './follow-up-view.tsx';
import { ImmersionFooter, JaText } from './ja-text.tsx';
import { NoSpoilProvider } from './no-spoil.tsx';
import { contextOf, followUpChips } from './sentence-context.ts';
import { type MistakeFacts, staticMistake } from './static-mistake.ts';
import { UncheckedReadings, unverified } from './unchecked-readings.tsx';
import { useChips } from './use-chips.tsx';
import { useMistake } from './use-mistake.ts';

interface NoteProps {
  value: Explanation;
  context: ChipContext;
  onBreakDown: () => void;
  cached: boolean | undefined;
}

function MistakeNote({ value, context, onBreakDown, cached }: NoteProps) {
  const t = useT();
  const { buttons, state, onWriteNew, retry } = useChips(
    followUpChips(t, value.chips, context.surface),
    context,
  );
  const chips = (
    <>
      {buttons}
      <Chip onClick={onBreakDown}>{t('explain.breakDownSentence')}</Chip>
    </>
  );
  const detail = unverified(value.readings).length > 0 && (
    <UncheckedReadings readings={value.readings} />
  );
  return (
    <div className={styles.stack}>
      <AiBlock
        label={t('explain.whyReading')}
        cached={cached}
        chips={chips}
        readings={value.readings}
        {...(detail ? { detail } : {})}
      >
        <p className={styles.para}>
          <JaText text={value.explanation} immersion={value.immersion} />
        </p>
        {value.hook && (
          <p className={styles.para}>
            <JaText text={value.hook} immersion={value.immersion} />
          </p>
        )}
        <ImmersionFooter immersion={value.immersion} />
      </AiBlock>
      <ChipOutcomeView state={state} onWriteNew={onWriteNew} onRetry={retry} />
    </div>
  );
}

/** The app's own note for the error type: no AI, no seal (A13). */
function StaticNote({ facts }: { facts: MistakeFacts }) {
  const t = useT();
  const note = staticMistake(t, facts);
  return (
    <section className={styles.section} aria-label={t('explain.whatWentWrong')}>
      <SectionLabel>{note.title}</SectionLabel>
      {note.lines.map((line) => (
        <p key={line} className={styles.para}>
          <JaText text={line} emph={false} />
        </p>
      ))}
    </section>
  );
}

/** "Ask the tutor why": by itself once with the Settings opt-in (A13). */
function AskWhy({ mistake }: { mistake: ReturnType<typeof useMistake> }) {
  const t = useT();
  const { ask } = mistake;
  return (
    <AiAction
      label={t('explain.askWhy')}
      run={(client) => ask?.(client)}
      peek={mistake.peek}
      disabled={!ask}
      auto={mistake.auto}
    />
  );
}

function TutorPart(props: MistakeSlotProps & { mistake: ReturnType<typeof useMistake> }) {
  const { mistake, card, target, onOpenWord } = props;
  const { state, ask, surface } = mistake;
  const t = useT();
  if (state.status === 'idle') return <AskWhy mistake={mistake} />;
  if (state.status === 'loading') return <Pending>{t('explain.lookingAtAnswer')}</Pending>;
  if (state.status === 'error') return <AiProblem error={state.error} onRetry={ask} />;
  const context: ChipContext = {
    sentence: contextOf(card.sentence),
    sentenceId: card.sentence.id,
    surface,
    wordId: target.wordId,
    previous: state.value.explanation,
  };
  return (
    <MistakeNote
      value={state.value}
      context={context}
      cached={state.cached}
      onBreakDown={() => onOpenWord(target.tokenIndex)}
    />
  );
}

function MissNote(props: MistakeSlotProps) {
  const mistake = useMistake(props);
  return (
    <div className={styles.stack}>
      {mistake.facts && <StaticNote facts={mistake.facts} />}
      <TutorPart {...props} mistake={mistake} />
    </div>
  );
}

/**
 * Under a wrong or near-miss answer (A1, A13, read.html): the app's note for the error type,
 * then "Ask the tutor why". A skip ("I don't know") gets neither: the teaching card covers it.
 * The later targets of the card stay hidden in the tutor's note (L3, D57).
 */
export function MistakeExplanation(props: MistakeSlotProps) {
  if (props.grade.skipped) return null;
  const index = props.card.targets.findIndex((t) => t.tokenIndex === props.target.tokenIndex);
  return (
    <NoSpoilProvider card={props.card} from={index + 1}>
      <MissNote {...props} />
    </NoSpoilProvider>
  );
}
