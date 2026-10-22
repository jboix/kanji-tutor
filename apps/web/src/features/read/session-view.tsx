import { useEffect, useState } from 'react';
import { answerSpan } from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { Token } from '../../domain/types.ts';
import { canSpeak, speak } from '../../lang/index.ts';
import { type AnswerLook, answerLook } from '../../ui/answer-state.tsx';
import { ExerciseHelp } from '../../ui/exercise-help.tsx';
import { hasKanji } from '../../ui/furigana.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { SpeakerIcon } from '../../ui/icons.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { RuledSentence, type TargetResult } from '../../ui/ruled-sentence.tsx';
import { useServices } from '../../ui/services.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { Feedback } from './feedback.tsx';
import styles from './read.module.css';
import type { Answered } from './session-state.ts';
import { WordSheet } from './word-sheet.tsx';

/** Words open the word sheet; particles (no dictionary entry) open their static note (G5). */
const isWord = (token: Token) =>
  token.pos !== 'symbol' && (token.wordId !== undefined || token.pos === 'particle');

/**
 * Token marks for the sentence: underline the current target, dot the other targets. Targets
 * not yet answered are `locked`: tapping them would reveal the reading before the answer.
 */
function marks(card: SessionCard, step: number, answered: boolean, all: boolean) {
  const spans = card.targets.map((t) => answerSpan(card.sentence, t.tokenIndex));
  const read = new Set(card.targets.slice(0, answered ? step + 1 : step).map((t) => t.tokenIndex));
  const unread = new Set(card.targets.map((t) => t.tokenIndex).filter((i) => !read.has(i)));
  const furigana = card.sentence.tokens.flatMap((token, i) => {
    const show = read.has(i) || (all && !unread.has(i) && hasKanji(token.surface));
    return show ? [i] : [];
  });
  const ask = spans.filter((_, i) => i !== step).flat();
  const locked = new Set(spans.filter((_, i) => i > step || (i === step && !answered)).flat());
  return { target: spans[step] ?? [], ask, furigana, locked };
}

/** How the answered target looks in the sentence (D105). */
const RESULT: Record<AnswerLook, TargetResult> = {
  correct: 'correct',
  wrong: 'missed',
  skipped: 'shown',
};

/** The lesson the card's first target came from, for the line above the sentence. */
function useLesson(card: SessionCard): string | undefined {
  const { repos } = useServices();
  const [lesson, setLesson] = useState<string>();
  const itemId = card.targets[0]?.itemId;
  useEffect(() => {
    if (!itemId) return;
    void repos.items.get(itemId).then((item) => setLesson(item?.source.lesson));
  }, [repos, itemId]);
  return lesson;
}

function LessonLine({ card }: { card: SessionCard }) {
  const lesson = useLesson(card);
  const t = useT();
  const wired = useSlot('wordSheet') !== undefined;
  return (
    <div className={styles.lessonRow}>
      <p className={styles.lesson}>
        {lesson ? (
          <>
            <JaRuns text={lesson} /> · {t(wired ? 'read.tapToAsk' : 'read.tapToLookUp')}
          </>
        ) : (
          t(wired ? 'read.tapToAskFirst' : 'read.tapToLookUpFirst')
        )}
      </p>
      {canSpeak() && (
        <IconButton
          aria-label={t('read.playSentence')}
          muted
          onClick={() => void speak(card.sentence.text)}
        >
          <SpeakerIcon />
        </IconButton>
      )}
    </div>
  );
}

export interface SessionViewProps {
  card: SessionCard;
  step: number;
  answered: Answered | undefined;
  allFurigana: boolean;
  /** "I don't know" for the current target, offered by the hint sheet as "Show the reading". */
  onSkip?: (() => void) | undefined;
}

/** The target whose answer span holds token `i`, as an index into `card.targets`. */
function targetAt(card: SessionCard, i: number): number {
  return card.targets.findIndex((t) => answerSpan(card.sentence, t.tokenIndex).includes(i));
}

interface HintProps {
  card: SessionCard;
  hint: number | undefined;
  step: number;
  onSkip: (() => void) | undefined;
  onClose: () => void;
}

/** The no-reading hint for a target not answered yet (teach slot, L2). */
function HintSheet({ card, hint, step, onSkip, onClose }: HintProps) {
  const Hint = useSlot('targetHint');
  const target = hint === undefined ? undefined : card.targets[hint];
  if (!Hint || !target) return null;
  const show = hint === step && onSkip ? { onShowReading: onSkip } : {};
  return <Hint card={card} target={target} onClose={onClose} {...show} />;
}

/**
 * Under the sentence: the help bar (U6), with "Explain this sentence" hiding the readings still
 * to answer (L3); after the last target, the translation and grammar line (L5). "I don't know"
 * sits under the answer field instead (AnswerActions).
 */
function SentenceTeach({ card, step, answered }: Omit<SessionViewProps, 'allFurigana' | 'onSkip'>) {
  const WrapUp = useSlot('sentenceWrapUp');
  const last = step + 1 >= card.targets.length;
  const wrapped = answered !== undefined && last && WrapUp !== undefined;
  const help = (
    <ExerciseHelp
      // After the last target the wrap-up shows the translation already (L5).
      sentence={wrapped ? undefined : card.sentence}
      explain={{ card, step: answered ? step + 1 : step }}
      answered={answered !== undefined}
    />
  );
  if (!(wrapped && WrapUp)) return help;
  return (
    <>
      <WrapUp sentence={card.sentence} />
      {help}
    </>
  );
}

/**
 * The sentence being read (read.html), its feedback, and the tapped-word sheet (R2–R4, R7).
 * A target not answered yet opens the no-reading hint when the teach slot is wired (L2);
 * without it, it can't be tapped (D26 "no peeking").
 */
export function SessionView({ card, step, answered, allFurigana, onSkip }: SessionViewProps) {
  const [tapped, setTapped] = useState<number>();
  const [hint, setHint] = useState<number>();
  const hints = useSlot('targetHint') !== undefined;
  const { target, ask, furigana, locked } = marks(card, step, answered !== undefined, allFurigana);
  const tap = (i: number) => (locked.has(i) ? setHint(targetAt(card, i)) : setTapped(i));
  const closeHint = () => setHint(undefined);
  return (
    <>
      <LessonLine card={card} />
      <RuledSentence
        sentence={card.sentence}
        target={target}
        ask={ask}
        furigana={furigana}
        result={answered && RESULT[answerLook(answered.grade)]}
        onTokenTap={tap}
        tappable={(token, i) => isWord(token) && (hints || !locked.has(i))}
      />
      {answered && <Feedback card={card} answered={answered} onOpenWord={setTapped} />}
      <SentenceTeach card={card} step={step} answered={answered} />
      {tapped !== undefined && (
        <WordSheet
          sentence={card.sentence}
          tokenIndex={tapped}
          noSpoil={{ card, from: answered ? step + 1 : step }}
          onClose={() => setTapped(undefined)}
        />
      )}
      <HintSheet card={card} hint={hint} step={step} onSkip={onSkip} onClose={closeHint} />
    </>
  );
}
