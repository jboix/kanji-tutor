/**
 * A drill card in the reading session (R8) or an S4 exercise: its body, its answer actions and
 * "Next". `DrillCard` lays them out in a full screen or inline (a grammar page's practice, S5).
 */
import { type ReactNode, useMemo, useState } from 'react';
import { type Drill, KANJI_BLANK, PATTERN_BLANK } from '../../domain/drills/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { ItemId } from '../../domain/types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { blankHelpCard } from '../../ui/exercise-cards.ts';
import { ExerciseHelp } from '../../ui/exercise-help.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import { BuildActions, type BuildOrder, BuildView, useBuildOrder } from './drill-build.tsx';
import { ChoiceActions, ClozeView, LookalikeView } from './drill-choices.tsx';
import {
  ListeningView,
  listeningChoices,
  MeaningView,
  meaningChoices,
  ParticleView,
} from './drill-exercises.tsx';
import { ConjugationView, PatternView } from './drill-forms.tsx';
import { useDrillTutor } from './drill-tutor.ts';
import { FamilyView, ReadingsView, TypedActions } from './drill-typed.tsx';
import { ItemTeaching } from './item-teaching.tsx';
import { asShown, listeningQuiet, listenLater } from './listen-later.ts';
import read from './read.module.css';
import { useFocus } from './read-actions.tsx';
import type { DrillResult } from './session-state.ts';
import { SkipButton } from './skip-button.tsx';
import { useGradeSound } from './use-answer-sound.ts';
import { type DrillControls, useDrill } from './use-drill.ts';

interface BodyProps {
  drill: Drill;
  controls: DrillControls;
  order: BuildOrder;
  /** "I can't listen now" on a listening exercise. */
  onWritten?: (() => void) | undefined;
}

function ExerciseBody({ drill, controls, order, onWritten }: BodyProps) {
  const answer = controls.answered ? controls.answers[controls.step] : undefined;
  if (drill.kind === 'meaning') return <MeaningView drill={drill} answer={answer} />;
  if (drill.kind === 'particle') return <ParticleView drill={drill} answer={answer} />;
  if (drill.kind === 'listening') {
    return <ListeningView drill={drill} answer={answer} onWritten={onWritten} />;
  }
  if (drill.kind === 'pattern') return <PatternView drill={drill} answer={answer} />;
  if (drill.kind === 'conjugation') return <ConjugationView drill={drill} answer={answer} />;
  if (drill.kind === 'build') return <BuildView drill={drill} order={order} answer={answer} />;
  return null;
}

function DrillBody(props: BodyProps) {
  const { drill, controls } = props;
  const answer = controls.answered ? controls.answers[controls.step] : undefined;
  if (drill.kind === 'lookalike') return <LookalikeView drill={drill} answer={answer} />;
  if (drill.kind === 'cloze') return <ClozeView drill={drill} answer={answer} />;
  if (drill.kind === 'family') return <FamilyView drill={drill} answer={answer} />;
  if (drill.kind === 'readings') {
    return <ReadingsView drill={drill} step={controls.step} answers={controls.answers} />;
  }
  return <ExerciseBody {...props} />;
}

/** The blanked range of a sentence drill, for the help's masked sentence. */
function blankOf(drill: Drill) {
  if (drill.kind === 'lookalike') return { from: drill.at, to: drill.at + 1, fill: KANJI_BLANK };
  if (drill.kind === 'cloze') return { from: drill.start, to: drill.end, fill: PATTERN_BLANK };
  if (drill.kind === 'particle') {
    return { from: drill.at, to: drill.at + drill.answer.length, fill: PATTERN_BLANK };
  }
  return undefined;
}

/**
 * The sentence the help may show: none before the answer of a sentence to hear or to build,
 * whose sentence is the answer.
 */
function helpSentence(drill: Drill, answered: boolean) {
  if (!('sentence' in drill)) return undefined;
  const hidden = drill.kind === 'listening' || drill.kind === 'build';
  return hidden && !answered ? undefined : drill.sentence;
}

/** The help bar (U6): meaning and explanation for sentence drills, "I don't know" for all. */
function DrillHelp({ drill, controls }: { drill: Drill; controls: DrillControls }) {
  const sentence = helpSentence(drill, controls.answered);
  const range = blankOf(drill);
  const explain = sentence && range && blankHelpCard(sentence, range, controls.answered);
  return (
    <ExerciseHelp
      sentence={sentence}
      explain={explain || undefined}
      answered={controls.answered}
      meaningOnAnswer={drill.kind !== 'build'}
      skip={<SkipButton onSkip={controls.skip} />}
    />
  );
}

function ExerciseFooter({ drill, controls, order }: BodyProps) {
  const { language } = useI18n();
  const t = useT();
  const { answer } = controls;
  if (drill.kind === 'meaning') {
    const ja = drill.reverse === true;
    return (
      <ChoiceActions choices={meaningChoices(drill, language)} stacked ja={ja} onChoose={answer} />
    );
  }
  if (drill.kind === 'listening') {
    const choices = listeningChoices(drill, language);
    return <ChoiceActions choices={choices} stacked ja={false} onChoose={answer} />;
  }
  if (drill.kind === 'particle') {
    const choices = drill.choices.map((c) => ({ value: c, label: c }));
    return <ChoiceActions choices={choices} stacked={false} onChoose={answer} />;
  }
  if (drill.kind === 'build') return <BuildActions drill={drill} order={order} onAnswer={answer} />;
  return (
    <TypedActions
      label={t('exercises.typeIt')}
      placeholder={t('exercises.typeHint')}
      onAnswer={answer}
    />
  );
}

function AnswerFooter(props: BodyProps) {
  const { drill, controls } = props;
  const { answer } = controls;
  const t = useT();
  if (drill.kind === 'lookalike') {
    const choices = drill.choices.map((c) => ({ value: c.char, label: c.char }));
    return <ChoiceActions choices={choices} stacked={false} onChoose={answer} />;
  }
  if (drill.kind === 'cloze') {
    const choices = drill.choices.map((c) => ({ value: c.grammarId, label: c.pattern }));
    return <ChoiceActions choices={choices} stacked onChoose={answer} />;
  }
  if (drill.kind !== 'family' && drill.kind !== 'readings') return <ExerciseFooter {...props} />;
  const label =
    drill.kind === 'family'
      ? t('drills.onyomiOf', { kanji: drill.guess })
      : t('drills.readingOf', { word: drill.items[controls.step]?.form ?? '' });
  const placeholder = t(drill.kind === 'family' ? 'drills.guessReading' : 'readSession.prompt');
  return <TypedActions key={label} label={label} placeholder={placeholder} onAnswer={answer} />;
}

interface NextFooterProps {
  drill: Drill;
  controls: DrillControls;
  nextLabel?: string | undefined;
}

/** Once answered: the tutor's suggested questions and 解 button beside Next (Tutor-drill). */
function NextFooter({ drill, controls, nextLabel }: NextFooterProps) {
  const box = useFocus('[data-next]', `step${controls.step}`);
  const tutor = useDrillTutor(drill);
  const t = useT();
  const label = t(controls.last ? 'readSession.nextSentence' : 'readSession.nextWord');
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>
        <div ref={box} className={read.next}>
          <PillButton data-next onClick={controls.next}>
            {controls.last && nextLabel ? nextLabel : label}
          </PillButton>
        </div>
      </TutorNext>
    </ActionBar>
  );
}

/** The item a drill step reviews, and the word as shown: for the teaching under a miss (L4). */
function stepItem(drill: Drill, step: number): { itemId?: ItemId; surface?: string } {
  if (drill.kind === 'readings') {
    const item = drill.items[step];
    return item ? { itemId: item.itemId, surface: item.form } : {};
  }
  if (drill.kind === 'lookalike') {
    return {
      itemId: drill.itemId,
      surface: drill.sentence.tokens[drill.tokenIndex]?.surface ?? '',
    };
  }
  if (drill.kind === 'meaning') return { itemId: drill.itemId, surface: drill.word.written };
  return drill.itemId ? { itemId: drill.itemId } : {};
}

function StepTeaching(props: {
  drill: Drill;
  card: SessionCard | undefined;
  controls: DrillControls;
}) {
  const { drill, controls } = props;
  const answer = controls.answered ? controls.answers[controls.step] : undefined;
  const { itemId, surface } = stepItem(drill, controls.step);
  return <ItemTeaching card={props.card} itemId={itemId} surface={surface} grade={answer?.grade} />;
}

export interface DrillCardProps {
  drill: Drill;
  /** The session card, for the teaching under a miss or a skip (L4). */
  card?: SessionCard | undefined;
  onDone: (result: DrillResult) => void;
  /** What the last "Next" says, when not "Next sentence" (the last drill of a set). */
  nextLabel?: string | undefined;
  /** Lays out the body and the footer: a full screen, or inline on a page. */
  layout: (body: ReactNode, footer: ReactNode) => ReactNode;
}

/** The drill as shown, written instead of played after "I can't listen now". */
function useShownDrill(drill: Drill) {
  const [quiet, setQuiet] = useState(listeningQuiet);
  const shown = useMemo(() => asShown(drill, quiet), [drill, quiet]);
  const onWritten = () => {
    listenLater();
    setQuiet(true);
  };
  return { shown, onWritten };
}

/** One drill: choices, tiles or a typed answer, plain feedback, then on to the next one. */
export function DrillCard({ drill: given, card, onDone, nextLabel, layout }: DrillCardProps) {
  const { shown: drill, onWritten } = useShownDrill(given);
  const controls = useDrill(drill, onDone);
  const order = useBuildOrder();
  useGradeSound(controls.answered ? controls.answers[controls.step]?.grade : undefined);
  const footer = controls.answered ? (
    <NextFooter drill={drill} controls={controls} nextLabel={nextLabel} />
  ) : (
    <AnswerFooter drill={drill} controls={controls} order={order} />
  );
  const body = (
    <>
      <DrillBody drill={drill} controls={controls} order={order} onWritten={onWritten} />
      <DrillHelp drill={drill} controls={controls} />
      <StepTeaching drill={drill} card={card} controls={controls} />
    </>
  );
  return layout(body, footer);
}

export interface DrillScreenProps {
  drill: Drill;
  card?: SessionCard;
  topBar: ReactNode;
  onDone: (result: DrillResult) => void;
}

/** One drill card as a session screen. */
export function DrillScreen({ drill, card, topBar, onDone }: DrillScreenProps) {
  const layout = (body: ReactNode, footer: ReactNode) => (
    <Screen topBar={topBar} footer={footer} gap={22} enter={false}>
      {body}
    </Screen>
  );
  return <DrillCard drill={drill} card={card} onDone={onDone} layout={layout} />;
}
