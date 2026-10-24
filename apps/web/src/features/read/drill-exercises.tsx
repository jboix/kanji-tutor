/**
 * The S4 exercises with choices: a meaning check (and its reverse, the word for a meaning), a
 * particle fill and listening. The prompts, the word or sentence, and after the answer what was
 * right, with the reading or the sentence itself.
 */
import { type ReactNode, useEffect } from 'react';
import {
  type ListeningDrill,
  type MeaningDrill,
  type MeaningOption,
  PATTERN_BLANK,
  type ParticleDrill,
} from '../../domain/drills/index.ts';
import { glossesIn, translationIn } from '../../domain/localized.ts';
import { answerSpan } from '../../domain/services/index.ts';
import { speak, stopSpeaking } from '../../lang/speech.ts';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Ruby } from '../../ui/ruby.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import { maskSentence } from '../../ui/word-tap-data.ts';
import styles from './drill.module.css';
import type { Choice } from './drill-choices.tsx';
import read from './read.module.css';
import type { DrillAnswer } from './use-drill.ts';

/** An option's meaning in the learner's language, two glosses at most. */
export function optionMeaning(option: MeaningOption, language: string) {
  const local = glossesIn(option, language);
  return { text: local.value.slice(0, 2).join('; '), english: local.fallback };
}

/** What was right, and what was chosen when it was not (U2, L4). */
export function Outcome(props: { answer: DrillAnswer; right: ReactNode; chosen: ReactNode }) {
  const look = answerLook(props.answer.grade);
  const t = useT();
  return (
    <AnswerState look={look}>
      {look === 'wrong' && (
        <p className={read.line}>
          <span className={read.muted}>{t('drills.youChose')}</span>
          <del className={styles.struckText}>{props.chosen}</del>
        </p>
      )}
      <p className={read.line}>
        <span className={read.muted}>
          {look === 'skipped' ? t('readSession.hereItIs') : t('exercises.itIs')}
        </span>
        <span className={styles.outcome}>{props.right}</span>
      </p>
    </AnswerState>
  );
}

function MeaningText({ option }: { option: MeaningOption | undefined }) {
  const { language } = useI18n();
  if (!option) return null;
  const { text, english } = optionMeaning(option, language);
  return (
    <>
      {text}
      <EnMark english={english} />
    </>
  );
}

/** The word, or for a reversed check its meaning; after the answer, the word with its reading. */
export function MeaningView(props: { drill: MeaningDrill; answer: DrillAnswer | undefined }) {
  const { drill, answer } = props;
  const t = useT();
  const own = drill.options[drill.answer];
  const chosen = drill.options[Number(answer?.answer)];
  const word = <Ruby base={drill.word.written} reading={drill.word.reading} />;
  const shown = answer ? word : <Ja>{drill.word.written}</Ja>;
  return (
    <>
      <p className={styles.prompt}>
        {t(drill.reverse ? 'exercises.promptWordChoice' : 'exercises.promptMeaning')}
      </p>
      <p className={drill.reverse ? styles.meaningCue : styles.cue}>
        {drill.reverse ? <MeaningText option={own} /> : shown}
      </p>
      {answer && drill.reverse && <p className={styles.cue}>{word}</p>}
      {answer && (
        <Outcome
          answer={answer}
          right={drill.reverse ? <Ja>{own?.written}</Ja> : <MeaningText option={own} />}
          chosen={drill.reverse ? <Ja>{chosen?.written}</Ja> : <MeaningText option={chosen} />}
        />
      )}
    </>
  );
}

/** The choices of a meaning check: meanings, or words when reversed. */
export function meaningChoices(drill: MeaningDrill, language: string): Choice[] {
  return drill.options.map((option, i) => ({
    value: String(i),
    label: drill.reverse ? option.written : optionMeaning(option, language).text,
  }));
}

/** The sentence with the particle blanked, before the answer: the blank shut. */
function BlankedParticle({ drill }: { drill: ParticleDrill }) {
  const to = drill.at + drill.answer.length;
  const masked = maskSentence(drill.sentence, drill.at, to, PATTERN_BLANK);
  return (
    <TapSentence
      sentence={masked.sentence}
      target={[masked.blank]}
      locked={masked.locked}
      beforeAnswer
    />
  );
}

/** The sentence with its particle blanked; once answered, the sentence with it underlined. */
export function ParticleView(props: { drill: ParticleDrill; answer: DrillAnswer | undefined }) {
  const { drill, answer } = props;
  const t = useT();
  const span = answerSpan(drill.sentence, drill.tokenIndex);
  return (
    <>
      <p className={styles.prompt}>{t('exercises.promptParticle')}</p>
      {answer ? (
        <TapSentence sentence={drill.sentence} target={span} />
      ) : (
        <BlankedParticle drill={drill} />
      )}
      {answer && (
        <Outcome
          answer={answer}
          right={<Ja>{drill.answer}</Ja>}
          chosen={<Ja>{answer.answer}</Ja>}
        />
      )}
    </>
  );
}

function ListeningText({ drill, index }: { drill: ListeningDrill; index: number }) {
  const { language } = useI18n();
  const option = drill.options[index];
  if (!option) return null;
  const local = translationIn(option, language);
  return (
    <>
      {local.value}
      <EnMark english={local.fallback} />
    </>
  );
}

/**
 * Play and Play again; the sentence is spoken once when the drill shows. Before the answer,
 * "I can't listen now" turns the exercise into its written twin.
 */
function PlayChip(props: { text: string; again: boolean; onWritten?: (() => void) | undefined }) {
  const { text, again, onWritten } = props;
  const t = useT();
  useEffect(() => {
    void speak(text);
  }, [text]);
  const written = () => {
    stopSpeaking();
    onWritten?.();
  };
  return (
    <ChipRow>
      <Chip onClick={() => void speak(text)}>
        {t(again ? 'exercises.playAgain' : 'exercises.play')}
      </Chip>
      {!again && onWritten && (
        <Chip onClick={written} title={t('exercises.cantListenHint')}>
          {t('exercises.cantListen')}
        </Chip>
      )}
    </ChipRow>
  );
}

export interface ListeningViewProps {
  drill: ListeningDrill;
  answer: DrillAnswer | undefined;
  /** "I can't listen now": shows the sentence to read instead. */
  onWritten?: (() => void) | undefined;
}

/**
 * The sentence spoken (on show and on Play), or shown for a sentence meaning check; once
 * answered, the sentence itself and its meaning.
 */
export function ListeningView({ drill, answer, onWritten }: ListeningViewProps) {
  const t = useT();
  const read = drill.read === true;
  return (
    <>
      <p className={styles.prompt}>
        {t(read ? 'exercises.promptSentenceMeaning' : 'exercises.promptListening')}
      </p>
      {!read && (
        <PlayChip text={drill.sentence.text} again={answer !== undefined} onWritten={onWritten} />
      )}
      {(read || answer) && <TapSentence sentence={drill.sentence} target={[]} />}
      {answer && (
        <Outcome
          answer={answer}
          right={<ListeningText drill={drill} index={drill.answer} />}
          chosen={<ListeningText drill={drill} index={Number(answer.answer)} />}
        />
      )}
    </>
  );
}

/** The choices of a listening drill: the meanings in the learner's language. */
export function listeningChoices(drill: ListeningDrill, language: string): Choice[] {
  return drill.options.map((option, i) => ({
    value: String(i),
    label: translationIn(option, language).value ?? '',
  }));
}
