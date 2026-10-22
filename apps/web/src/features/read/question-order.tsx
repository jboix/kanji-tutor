/**
 * 文の組み立て (J5): the sentence with four slots, ★ on one, and the four pieces as chips. A
 * tapped chip fills the next empty slot; a tapped slot gives its piece back. Once all four are
 * placed, "Check" grades the piece in the ★ slot, as the exam does.
 */
import { useState } from 'react';
import { PATTERN_BLANK } from '../../domain/drills/index.ts';
import type { OrderQuestion } from '../../domain/questions/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { cx } from '../../ui/cx.ts';
import { blankHelpCard } from '../../ui/exercise-cards.ts';
import { ExerciseHelp } from '../../ui/exercise-help.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { StickyActions } from '../../ui/sticky-actions.tsx';
import { TapRun } from '../../ui/word-tap.tsx';
import { helpCard, looseSentence } from '../../ui/word-tap-data.ts';
import styles from './question.module.css';
import { AnswerLine, OptionNotes } from './question-parts.tsx';
import { aroundSpan, type StemRange, stemRange } from './question-tap.tsx';
import { SkipButton } from './skip-button.tsx';
import type { QuestionControls } from './use-question.ts';

type Slots = (number | undefined)[];

/** The four slots are fixed positions. */
const SLOT_KEYS = ['first', 'second', 'third', 'fourth'] as const;

interface SlotProps {
  question: OrderQuestion;
  slot: number;
  piece: number | undefined;
  onTap: () => void;
}

function SlotButton(props: SlotProps) {
  const { question, slot, piece } = props;
  const star = slot === question.star;
  const text = piece === undefined ? '' : (question.options[piece]?.text ?? '');
  const t = useT();
  const name = t('questions.slot', { n: slot + 1, star: star ? ' ★' : '' });
  return (
    <button
      type="button"
      className={cx(styles.slot, star && styles.star, piece !== undefined && styles.placed)}
      data-slot=""
      aria-label={text ? `${name}: ${text}` : t('questions.slotEmpty', { slot: name })}
      onClick={props.onTap}
    >
      {star && <span className={styles.starMark}>★</span>}
      {/* An empty slot keeps a line of text, so it sits on the baseline like a filled one. */}
      {text || '\u00a0'}
    </button>
  );
}

/** Closing punctuation at the start of the text after the slots: it stays with the last slot. */
const CLOSING = /^[、。，．・：；？！?!」』）)】〉》…]+/u;

function splitAfter(after: string): { glue: string; rest: string } {
  const glue = CLOSING.exec(after)?.[0] ?? '';
  return { glue, rest: after.slice(glue.length) };
}

/** A slot; the last one keeps the closing punctuation on its line, so ？ never wraps alone (U8). */
function Slot(props: SlotProps & { glue?: string | undefined }) {
  const { glue, ...slot } = props;
  if (!glue) return <SlotButton {...slot} />;
  return (
    <span className={styles.keep}>
      <SlotButton {...slot} />
      {glue}
    </span>
  );
}

/** The pieces not placed yet, numbered 1–4 like the exam's options. */
function Chips(props: { question: OrderQuestion; slots: Slots; onPlace: (piece: number) => void }) {
  const t = useT();
  return (
    <ol className={styles.chips} aria-label={t('questions.pieces')}>
      {props.question.options.map((option, i) => (
        <li key={option.text}>
          <button
            type="button"
            className={styles.chip}
            disabled={props.slots.includes(i)}
            onClick={() => props.onPlace(i)}
          >
            <span className={styles.number}>{i + 1}</span>
            <span lang="ja">{option.text}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Character ranges of the pieces in the sentence's order, from the end of `before`. */
function pieceRanges(question: OrderQuestion, from: number) {
  let at = from;
  return question.order.map((piece) => {
    const start = at;
    at += question.options[piece]?.text.length ?? 0;
    return { piece, from: start, to: at };
  });
}

interface PiecesProps {
  question: OrderQuestion;
  sentence: Sentence;
  range: StemRange;
}

/** The pieces' ranges in the sentence, when the pieces rebuild it exactly. */
function solvedRanges(question: OrderQuestion, sentence: Sentence | undefined) {
  const range = stemRange(sentence, question.before, question.after);
  if (!range) return undefined;
  const pieces = pieceRanges(question, range.from);
  return pieces.at(-1)?.to === range.to ? pieces : undefined;
}

function SolvedPieces({ question, sentence, range }: PiecesProps) {
  const pieces = solvedRanges(question, sentence) ?? [];
  return (
    <p lang="ja" className={styles.stem}>
      <TapRun sentence={sentence} from={0} to={range.from} />
      {pieces.map((p, slot) => (
        <span key={p.from} className={cx(slot === question.star && styles.underline)}>
          <TapRun sentence={sentence} from={p.from} to={p.to} />
        </span>
      ))}
      <TapRun sentence={sentence} from={range.to} to={sentence.text.length} />
    </p>
  );
}

/** The sentence put back in order, the ★ piece underlined; its words open (U5). */
function Solved({
  question,
  sentence,
}: {
  question: OrderQuestion;
  sentence?: Sentence | undefined;
}) {
  const range = stemRange(sentence, question.before, question.after);
  if (sentence && range && solvedRanges(question, sentence)) {
    return <SolvedPieces question={question} sentence={sentence} range={range} />;
  }
  return (
    <p lang="ja" className={styles.stem}>
      {question.before}
      {question.order.map((piece, slot) => (
        <span
          key={question.options[piece]?.text}
          className={cx(slot === question.star && styles.underline)}
        >
          {question.options[piece]?.text}
        </span>
      ))}
      {question.after}
    </p>
  );
}

interface BodyProps {
  question: OrderQuestion;
  controls: QuestionControls;
  sentence?: Sentence | undefined;
}

/**
 * The text around the slots: tappable from the masked sentence, the slots' words shut.
 * Closing punctuation after the slots comes apart as `glue`, to stay with the last slot (U8).
 */
function around(question: OrderQuestion, sentence: Sentence | undefined) {
  const { glue, rest } = splitAfter(question.after);
  const range = stemRange(sentence, question.before, question.after);
  if (!sentence || !range) return { before: question.before, glue, after: rest };
  return { ...aroundSpan(sentence, range, false, undefined, glue.length), glue };
}

/** The sentence the help explains: the slots as one blank until the answer. */
function helpFor(question: OrderQuestion, sentence: Sentence | undefined, answered: boolean) {
  const range = stemRange(sentence, question.before, question.after);
  if (sentence && range) {
    return blankHelpCard(sentence, { ...range, fill: PATTERN_BLANK }, answered);
  }
  const middle = answered ? question.order.map((p) => question.options[p]?.text ?? '') : [];
  const text = question.before + (answered ? middle.join('') : PATTERN_BLANK) + question.after;
  return { card: helpCard(looseSentence(`${question.id}#stem`, text, [])), step: 0 };
}

function OrderHelp({ question, controls, sentence }: BodyProps) {
  const answered = controls.answer !== undefined;
  return (
    <ExerciseHelp
      sentence={sentence}
      question={question}
      explain={helpFor(question, sentence, answered)}
      answered={answered}
      meaningOnAnswer
      skip={<SkipButton onSkip={controls.skip} />}
    />
  );
}

function Unsolved({ question, controls, sentence }: BodyProps) {
  const [slots, setSlots] = useState<Slots>([undefined, undefined, undefined, undefined]);
  const place = (piece: number) => {
    const at = slots.indexOf(undefined);
    if (at >= 0) setSlots(slots.map((p, i) => (i === at ? piece : p)));
  };
  const free = (slot: number) => setSlots(slots.map((p, i) => (i === slot ? undefined : p)));
  const full = slots.every((p) => p !== undefined);
  const text = around(question, sentence);
  const t = useT();
  return (
    <>
      <p lang="ja" className={cx(styles.stem, styles.orderStem)}>
        {text.before}
        {SLOT_KEYS.map((key, slot) => (
          <Slot
            key={key}
            question={question}
            slot={slot}
            piece={slots[slot]}
            onTap={() => free(slot)}
            glue={slot === SLOT_KEYS.length - 1 ? text.glue : undefined}
          />
        ))}
        {text.after}
      </p>
      <Chips question={question} slots={slots} onPlace={place} />
      <StickyActions>
        <PillButton disabled={!full} onClick={() => controls.choose(slots[question.star] ?? -1)}>
          {t('questions.check')}
        </PillButton>
      </StickyActions>
      <OrderHelp question={question} controls={controls} sentence={sentence} />
    </>
  );
}

/** A ★ order question: slots and chips, then the sentence in order and why each piece goes where. */
export function OrderBody({ question, controls, sentence }: BodyProps) {
  const { answer } = controls;
  if (!answer) return <Unsolved question={question} controls={controls} sentence={sentence} />;
  return (
    <>
      <Solved question={question} sentence={sentence} />
      <OrderHelp question={question} controls={controls} sentence={sentence} />
      <AnswerLine question={question} answer={answer} />
      <OptionNotes question={question} />
    </>
  );
}
