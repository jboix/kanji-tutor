import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { MAX_DRILL_SHARE } from '../../domain/drills/index.ts';
import {
  cardType,
  LESSON_SECTIONS,
  type LessonSection,
  type SessionOutline,
  sessionOutline,
} from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { AnswerMode } from '../../domain/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { ExerciseChips } from '../../ui/exercise-help.tsx';
import { AllFuriganaContext } from '../../ui/furigana-mode.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { CloseIcon } from '../../ui/icons.tsx';
import { paths } from '../../ui/paths.ts';
import { PeekProvider } from '../../ui/peek-link.tsx';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { SessionProgress } from '../../ui/session-progress.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { DrillScreen } from './drill-screen.tsx';
import { GrammarIntroScreen } from './grammar-intro-screen.tsx';
import { HandoutScreen } from './handout-screen.tsx';
import { NewChips } from './new-chips.tsx';
import { QuestionCardScreen } from './question-screen.tsx';
import styles from './read.module.css';
import { AnswerActions, NextActions } from './read-actions.tsx';
import { againPlan } from './session-again.ts';
import { CopyModeContext, useCopyMode } from './session-copy.tsx';
import { EmptySession, SessionEnd } from './session-end.tsx';
import { roundOf } from './session-round.ts';
import { current, currentCard, lastStep } from './session-state.ts';
import { SessionView } from './session-view.tsx';
import { useGradeSound } from './use-answer-sound.ts';
import { type SessionControls, type SessionRequest, useSession } from './use-session.ts';

/** `&section=words&part=2`: one part of a unit lesson's section (S3). */
function sectionOf(params: URLSearchParams): { section?: LessonSection; part?: number } {
  const section = params.get('section');
  if (!section || !LESSON_SECTIONS.includes(section as LessonSection)) return {};
  const part = Number(params.get('part') ?? '1');
  return { section: section as LessonSection, part: Number.isInteger(part) && part > 0 ? part : 1 };
}

/**
 * `/read?kanji=生&reading=ショウ` focuses the session on one kanji reading (kanji page).
 * `/read?cards=kanji` is a round of kanji cards: read a kanji, or write it (Start → Kanji).
 * `/read?drills=1` mixes in as many drills as the session allows, up to one per sentence (R8).
 * `/read?questions=1` puts a JLPT-shaped question (J1–J5) after every sentence it can.
 * `/read?only=reading` reads sentences only, with no drills or questions (Start's Reading, IA3).
 * `/read?unit=vending-machine` practises a unit (T3); `&passage=1` asks its passage questions.
 * `/read?grammar=te-mo-ii` practises one grammar point (the grammar page's "Practise this").
 * `/read?unit=…&section=grammar&part=1` is one part of a unit lesson's section (S3).
 * `/read?scan=<id>` practises a scanned lesson, apart from the daily mix.
 */
function useRequest(): SessionRequest {
  const [params] = useSearchParams();
  const scan = params.get('scan');
  return scan ? { scan } : mixRequest(params);
}

/** Every request but a scanned lesson's (see `useRequest`). */
function mixRequest(params: URLSearchParams): SessionRequest {
  const kanji = params.get('kanji');
  const reading = params.get('reading');
  const unit = params.get('unit');
  const grammar = params.get('grammar');
  const drills = params.get('drills') === '1' ? { drillShare: MAX_DRILL_SHARE } : {};
  const questions = params.get('questions') === '1' ? { questionEvery: 1 } : {};
  const readOnly = params.get('only') === 'reading' ? { drillShare: 0, questionEvery: 0 } : {};
  const lesson = unit ? { unit, passage: params.get('passage') === '1', ...sectionOf(params) } : {};
  if (params.get('cards') === 'kanji') return { kanjiCards: true };
  const mix = { ...drills, ...questions, ...readOnly, ...lesson, ...(grammar ? { grammar } : {}) };
  return kanji && reading ? { focus: { kanji, reading }, ...mix } : mix;
}

/** "Explain new things first" (L7); on until the setting says otherwise. */
function useExplainFirst(): boolean {
  const { repos } = useServices();
  const [on, setOn] = useState(true);
  useEffect(() => {
    void repos.settings.get().then((settings) => setOn(settings.explainFirst !== false));
  }, [repos]);
  return on;
}

/** Furigana on known words too (R4); starts from the setting, toggled with ふ. */
function useAllFurigana(): [boolean, () => void] {
  const { repos } = useServices();
  const [all, setAll] = useState(false);
  useEffect(() => {
    void repos.settings.get().then((settings) => setAll(settings.furigana === 'all'));
  }, [repos]);
  return [all, () => setAll((on) => !on)];
}

function ReadTopBar(props: {
  index: number;
  total: number;
  outline: SessionOutline | undefined;
  all: boolean;
  onToggle: () => void;
}) {
  const _navigate = useNavigate();
  const t = useT();
  return (
    <TopBar
      start={
        <BackButton parent={paths.today} label={t('read.endSession')}>
          <CloseIcon />
        </BackButton>
      }
      center={<SessionProgress current={props.index} total={props.total} outline={props.outline} />}
      end={
        <IconButton
          aria-label={t('read.furiganaAll')}
          aria-pressed={props.all}
          muted
          glyph
          onClick={props.onToggle}
        >
          ふ
        </IconButton>
      }
    />
  );
}

interface FooterProps {
  controls: SessionControls;
  voice: boolean;
  onVoice: (on: boolean) => void;
}

function Footer({ controls, voice, onVoice }: FooterProps) {
  const { state, submit, next } = controls;
  const now = current(state);
  if (!now) return null;
  const key = `${state.index}:${state.step}`;
  if (state.answered) {
    return <NextActions key={key} card={now.card} last={lastStep(state)} onNext={next} />;
  }
  const answer = (value: string, mode: AnswerMode, ms?: number) => void submit(value, mode, ms);
  return (
    <AnswerActions
      key={key}
      card={now.card}
      target={now.target}
      onAnswer={answer}
      voice={voice}
      onVoice={onVoice}
      onSkip={() => void controls.skip(voice ? 'voice' : 'typed')}
    />
  );
}

/**
 * The intro gate (teach slot, L1): until the slot calls `onDone` for the current target, the
 * session shows the intro instead of the exercise. Without the slot, or with explanations
 * skipped (L7), there is no gate.
 */
function useIntroGate(state: SessionControls['state'], explainFirst: boolean) {
  const Intro = useSlot('newItemIntro');
  const [passed, setPassed] = useState<string>();
  const key = `${state.index}:${state.step}`;
  const onDone = useCallback(() => setPassed(key), [key]);
  const gated = Intro !== undefined && explainFirst && passed !== key && !state.answered;
  return { Intro: gated ? Intro : undefined, onDone };
}

interface ReadingProps {
  controls: SessionControls;
  topBar: ReactNode;
  all: boolean;
  voice: boolean;
  onVoice: (on: boolean) => void;
  explainFirst: boolean;
}

/** The current sentence: the intro card when one is due (L1), else the exercise. */
function Reading({ controls, topBar, all, voice, onVoice, explainFirst }: ReadingProps) {
  const { state } = controls;
  const { Intro, onDone } = useIntroGate(state, explainFirst);
  const now = current(state);
  if (!now) return null;
  if (Intro) {
    return (
      <Screen topBar={topBar} gap={22} enter={false}>
        <Intro
          key={`${state.index}:${state.step}`}
          card={now.card}
          target={now.target}
          onDone={onDone}
        />
      </Screen>
    );
  }
  const footer = <Footer controls={controls} voice={voice} onVoice={onVoice} />;
  return (
    <Screen topBar={topBar} footer={footer} gap={22} enter={false}>
      <SessionView
        card={now.card}
        step={state.step}
        answered={state.answered}
        allFurigana={all}
        onSkip={() => void controls.skip(voice ? 'voice' : 'typed')}
      />
    </Screen>
  );
}

/**
 * A drill (R8), question (J1–J5), passage (T6) or grammar introduction (G4) card, or undefined
 * for a sentence card.
 */
function exerciseScreen(card: SessionCard, topBar: ReactNode, controls: SessionControls) {
  const onDone = controls.finishDrill;
  if (card.grammarIntro) {
    const id = card.grammarIntro;
    return <GrammarIntroScreen grammarId={id} topBar={topBar} onDone={controls.finishIntro} />;
  }
  if (card.handout) return <HandoutScreen card={card} topBar={topBar} onDone={onDone} />;
  if (card.question || card.passage) {
    return <QuestionCardScreen card={card} topBar={topBar} onDone={onDone} />;
  }
  return (
    card.drill && <DrillScreen drill={card.drill} card={card} topBar={topBar} onDone={onDone} />
  );
}

function SessionTopBar(props: {
  state: SessionControls['state'];
  all: boolean;
  onToggle: () => void;
}) {
  const { cards, index } = props.state;
  const outline = cards ? sessionOutline(cards, index) : undefined;
  const total = cards?.length ?? 0;
  const { all, onToggle } = props;
  return <ReadTopBar index={index} total={total} outline={outline} all={all} onToggle={onToggle} />;
}

/** With explanations skipped, the current card's "New" chips for its help bar (L7). */
function CardChips({ state }: { state: SessionControls['state'] }) {
  const card = currentCard(state);
  if (!card) return null;
  const answered = state.answered !== undefined;
  const key = `${state.index}:${state.step}`;
  return <NewChips key={key} card={card} target={current(state)?.target} answered={answered} />;
}

function Session({ controls }: { controls: SessionControls }) {
  const [all, toggle] = useAllFurigana();
  const explainFirst = useExplainFirst();
  const [voice, setVoice] = useState(false);
  const { state } = controls;
  useGradeSound(state.answered?.grade);
  const topBar = <SessionTopBar state={state} all={all} onToggle={toggle} />;
  const card = currentCard(state);
  const reading = { controls, topBar, all, voice, onVoice: setVoice, explainFirst };
  const body = (card && exerciseScreen(card, topBar, controls)) || <Reading {...reading} />;
  const chips = explainFirst ? null : <CardChips state={state} />;
  // The card's type, sentence level and sentence, for tests: the level gate (G3), the retry.
  return (
    <div
      key={state.index}
      className={styles.card}
      data-card={card && cardType(card)}
      data-level={card?.sentence.level}
      data-sentence={card?.sentence.id}
    >
      {/* ふ reaches every view of the card: intro, exercise, sheets (R12). */}
      <AllFuriganaContext value={all}>
        <ExerciseChips value={chips}>{body}</ExerciseChips>
      </AllFuriganaContext>
    </div>
  );
}

/**
 * A reading session (read.html): typed answers, feedback, furigana rules, audio, and drills mixed
 * in (R8). Offline.
 */
export function ReadScreen() {
  const request = useRequest();
  const round = roundOf(useLocation().state);
  // A new request (the next part of a lesson, from its end screen) or another round of the same
  // one starts a new session: the finished one must not stay on screen, or its end would
  // count the new part as done.
  return <RequestedSession key={`${JSON.stringify(request)}#${round}`} request={request} />;
}

function RequestedSession({ request }: { request: SessionRequest }) {
  const controls = useSession(request);
  const { cards, results, drills } = controls.state;
  if (cards === undefined) {
    return <EmptySession loading />;
  }
  if (cards.length === 0) return <EmptySession focus={request.focus} />;
  if (!currentCard(controls.state)) {
    return (
      <SessionEnd
        cards={cards}
        startedAt={controls.state.startedAt}
        results={results}
        drills={drills}
        unit={request.unit}
        scan={request.scan}
        lesson={lessonPart(request)}
        again={againPlan(request)}
      />
    );
  }
  return <ImmersedSession controls={controls} />;
}

/** The lesson part a session was, for its end screen (S3). */
function lessonPart(request: SessionRequest) {
  const { unit, section, part } = request;
  return unit && section ? { unit, section, part: part ?? 1 } : undefined;
}

/** The session with its copy in the immersion mode (M3). */
function ImmersedSession({ controls }: { controls: SessionControls }) {
  const mode = useCopyMode();
  return (
    <CopyModeContext value={mode}>
      <PeekProvider>
        <Session controls={controls} />
      </PeekProvider>
    </CopyModeContext>
  );
}
