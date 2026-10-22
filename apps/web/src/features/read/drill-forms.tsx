/**
 * The typed S4 drills, checked by the conjugation engine: a pattern drill as in 練習 A/B (a cue
 * and the shape to make, with a model line) and a conjugation drill (a verb and a form). The
 * cue keeps its reading, since the drill asks for the form, not the reading.
 */

import type { VerbForm } from '../../domain/conjugation/index.ts';
import type { ConjugationDrill, PatternDrill } from '../../domain/drills/index.ts';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { Ja, StruckAnswer } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { Ruby } from '../../ui/ruby.tsx';
import styles from './drill.module.css';
import read from './read.module.css';
import type { DrillAnswer } from './use-drill.ts';

/** Each form's name in the learner's language. */
export const FORM_NAME: Readonly<Record<VerbForm, PlainKey>> = {
  dict: 'exercises.formDict',
  masu: 'exercises.formMasu',
  masen: 'exercises.formMasen',
  mashita: 'exercises.formMashita',
  masenDeshita: 'exercises.formMasenDeshita',
  stem: 'exercises.formStem',
  te: 'exercises.formTe',
  ta: 'exercises.formTa',
  nai: 'exercises.formNai',
  nakatta: 'exercises.formNakatta',
  tai: 'exercises.formTai',
  mashou: 'exercises.formMashou',
  volitional: 'exercises.formVolitional',
  potential: 'exercises.formPotential',
  passive: 'exercises.formPassive',
  causative: 'exercises.formCausative',
  imperative: 'exercises.formImperative',
  ba: 'exercises.formBa',
  tara: 'exercises.formTara',
};

/** Each form's ending as a textbook shows it. */
const FORM_SHAPE: Readonly<Record<VerbForm, string>> = {
  dict: '〜る',
  masu: '〜ます',
  masen: '〜ません',
  mashita: '〜ました',
  masenDeshita: '〜ませんでした',
  stem: '〜',
  te: '〜て',
  ta: '〜た',
  nai: '〜ない',
  nakatta: '〜なかった',
  tai: '〜たい',
  mashou: '〜ましょう',
  volitional: '〜よう',
  potential: '〜える／〜られる',
  passive: '〜れる／〜られる',
  causative: '〜せる／〜させる',
  imperative: '〜え／〜ろ',
  ba: '〜ば',
  tara: '〜たら',
};

/** The model answer after the answer: green with a check, after the struck answer when wrong. */
function FormOutcome({
  answer,
  model,
}: {
  answer: DrillAnswer;
  model: { written: string; reading: string };
}) {
  const look = answerLook(answer.grade);
  const t = useT();
  return (
    <AnswerState look={look}>
      <p className={read.line}>
        {look === 'wrong' && <StruckAnswer>{answer.answer}</StruckAnswer>}
        <span className={read.muted}>
          {look === 'skipped' ? t('readSession.hereItIs') : t('exercises.itIs')}
        </span>
        <span className={styles.answer}>
          <FormRuby written={model.written} reading={model.reading} />
        </span>
      </p>
    </AnswerState>
  );
}

/** The kana a written form and its reading share at both ends, and the part between. */
export function splitForm(written: string, reading: string) {
  const room = Math.min(written.length, reading.length) - 1;
  let head = 0;
  while (head < room && written[head] === reading[head]) head++;
  let tail = 0;
  while (tail < room - head && written.at(-1 - tail) === reading.at(-1 - tail)) tail++;
  return {
    head: written.slice(0, head),
    base: written.slice(head, written.length - tail),
    reading: reading.slice(head, reading.length - tail),
    tail: written.slice(written.length - tail),
  };
}

/** A form with furigana over its kanji part only (お願いしたい: ねが over 願). */
export function FormRuby({ written, reading }: { written: string; reading: string }) {
  if (written === reading) return <Ja>{written}</Ja>;
  const part = splitForm(written, reading);
  return (
    <Ja>
      {part.head}
      <Ruby base={part.base} reading={part.reading} />
      {part.tail}
    </Ja>
  );
}

function Cue({ written, reading }: { written: string; reading: string }) {
  return (
    <p className={styles.cue} data-cue-reading={reading}>
      <FormRuby written={written} reading={reading} />
    </p>
  );
}

/** The shape to make, the model line with another cue, and the cue. */
export function PatternView(props: { drill: PatternDrill; answer: DrillAnswer | undefined }) {
  const { drill, answer } = props;
  const t = useT();
  return (
    <>
      <p className={styles.prompt}>
        {t('exercises.promptPattern')} ·{' '}
        <span data-shape="">
          <Ja>{drill.shape}</Ja>
        </span>
      </p>
      {drill.example && (
        <p className={styles.example} data-example="">
          <span className={read.muted}>{t('exercises.example')}</span>{' '}
          <Ja>
            {drill.example.cue} → {drill.example.answer}
          </Ja>
        </p>
      )}
      <Cue written={drill.cue.written} reading={drill.cue.reading} />
      {answer && <FormOutcome answer={answer} model={drill.answer} />}
    </>
  );
}

/** The verb and the form to put it in. */
export function ConjugationView(props: {
  drill: ConjugationDrill;
  answer: DrillAnswer | undefined;
}) {
  const { drill, answer } = props;
  const { t } = useI18n();
  return (
    <>
      <p className={styles.prompt}>
        {t('exercises.promptConjugation')} · <Ja>{FORM_SHAPE[drill.form]}</Ja>
      </p>
      <p className={styles.text}>
        <JaRuns text={t('exercises.toForm', { form: t(FORM_NAME[drill.form]) })} />
      </p>
      <Cue written={drill.cue.written} reading={drill.cue.reading} />
      {answer && <FormOutcome answer={answer} model={drill.answer} />}
    </>
  );
}
