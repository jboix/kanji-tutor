/**
 * "Complete the line" on a grammar dialogue: the conversation with one line's form blanked, the
 * tutor, Play and the context lines' translations in reach before the answer; once answered,
 * every translation, the right form in the line, and why it fits this conversation (static,
 * written with the dialogue).
 */
import { useMemo, useState } from 'react';
import { dialogueText, spokenLines } from '../../domain/dialogues/index.ts';
import type { DialogueDrill } from '../../domain/drills/index.ts';
import { AnswerState, answerLook } from '../../ui/answer-state.tsx';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { DialogueLines, type FocusLook, PlayDialogue } from '../../ui/dialogue.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { StruckAnswer } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { TutorChip, useTutor } from '../../ui/tutor.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './drill.module.css';
import { dialogueTopic } from './drill-tutor.ts';
import read from './read.module.css';
import type { DrillAnswer } from './use-drill.ts';

const LOOK = { correct: 'correct', wrong: 'missed', skipped: 'shown' } as const;

/** The blanked line's look: the blank, then the right form in the answer's colour. */
function lookOf(drill: DialogueDrill, answer: DrillAnswer | undefined) {
  const blank = drill.dialogue.blank.line;
  return (i: number): FocusLook => {
    if (i !== blank) return 'focus';
    return answer ? LOOK[answerLook(answer.grade)] : 'blank';
  };
}

/** "Explain this conversation", before the answer: the tutor sees the blank, not the answer. */
function TutorBefore({ drill }: { drill: DialogueDrill }) {
  const { t, language } = useI18n();
  const options = useMemo(
    () => ({
      topic: dialogueTopic(drill, language, false),
      starters: [t('dialogues.tutorExplain')],
    }),
    [drill, language, t],
  );
  const tutor = useTutor(options);
  return tutor ? <TutorChip tutor={tutor} label={t('dialogues.tutorExplain')} /> : null;
}

/** Why the form fits, in the learner's language: Japanese runs in Klee One. */
function Why({ drill }: { drill: DialogueDrill }) {
  const { language } = useContentLanguage();
  const why = dialogueText(drill.dialogue.blank.why, language);
  return (
    <p className={read.line}>
      <span className={styles.why}>
        <JaRuns text={why.value} />
        <EnMark english={why.english} />
      </span>
    </p>
  );
}

/** "Not quite · You chose ~~ことにした~~ · Fits ことになった", or the right card, then why. */
function DialogueFeedback({ drill, answer }: { drill: DialogueDrill; answer: DrillAnswer }) {
  const t = useT();
  const look = answerLook(answer.grade);
  return (
    <AnswerState look={look} title={look === 'wrong' ? t('readSession.notQuite') : undefined}>
      {look === 'wrong' && (
        <p className={read.line}>
          <span className={read.muted}>{t('drills.youChose')}</span>
          <StruckAnswer>{answer.grade.given}</StruckAnswer>
        </p>
      )}
      <p className={read.line}>
        <span className={read.muted}>
          {look === 'skipped' ? t('readSession.hereItIs') : t('drills.fits')}
        </span>
        <span lang="ja" className={read.answer}>
          {drill.answer}
        </span>
      </p>
      <Why drill={drill} />
    </AnswerState>
  );
}

export interface DialogueViewProps {
  drill: DialogueDrill;
  answer: DrillAnswer | undefined;
}

/** The drill's body (see the module comment); its choices are the footer's. */
export function DialogueView({ drill, answer }: DialogueViewProps) {
  const t = useT();
  const [translated, setTranslated] = useState(false);
  const blank = drill.dialogue.blank.line;
  const shows = (i: number) => answer !== undefined || (translated && i !== blank);
  return (
    <>
      <p className={styles.prompt}>{t('dialogues.prompt')}</p>
      <ChipRow>
        {!answer && <TutorBefore drill={drill} />}
        <PlayDialogue lines={spokenLines(drill.dialogue, !answer)} />
        {!answer && (
          <Chip aria-pressed={translated} onClick={() => setTranslated((was) => !was)}>
            {t('dialogues.showTranslation')}
          </Chip>
        )}
      </ChipRow>
      <div className={styles.bubbles}>
        <DialogueLines
          dialogue={drill.dialogue}
          lookOf={lookOf(drill, answer)}
          translated={shows}
        />
      </div>
      {answer && <DialogueFeedback drill={drill} answer={answer} />}
    </>
  );
}
