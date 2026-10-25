/**
 * Write the kanji: the sentence with a word blanked and its reading, the kanji drawn on the
 * handwriting pad one after the other. Typed (Settings, or "I can't draw now"), the word's
 * meaning is shown instead and its reading typed in kana. Once answered, the word in place.
 */
import { blankedWord, KANJI_BLANK, type WriteDrill } from '../../domain/drills/index.ts';
import { glossesIn } from '../../domain/localized.ts';
import { answerSpan } from '../../domain/services/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import { maskSentence } from '../../ui/word-tap-data.ts';
import styles from './drill.module.css';
import { Outcome } from './drill-exercises.tsx';
import { FormRuby } from './drill-forms.tsx';
import { TypedActions } from './drill-typed.tsx';
import type { DrillAnswer } from './use-drill.ts';

/** What stands in for the word until the answer: a box per kanji, its kana kept (〇べ). */
export const writeBlank = (drill: WriteDrill) => blankedWord(drill.word.written, KANJI_BLANK);

/** The word's range in its sentence and what stands in for it, for the help's masked sentence. */
export function writeRange(drill: WriteDrill) {
  return { from: drill.at, to: drill.at + drill.word.written.length, fill: writeBlank(drill) };
}

function BlankedWord({ drill }: { drill: WriteDrill }) {
  const { from, to, fill } = writeRange(drill);
  const masked = maskSentence(drill.sentence, from, to, fill);
  return (
    <TapSentence
      sentence={masked.sentence}
      target={[masked.blank]}
      locked={masked.locked}
      beforeAnswer
    />
  );
}

function Meaning({ drill, className }: { drill: WriteDrill; className: string | undefined }) {
  const { language } = useI18n();
  const local = glossesIn(drill.meaning, language);
  return (
    <p className={className} data-write-meaning="">
      {local.value.slice(0, 2).join('; ')}
      <EnMark english={local.fallback} />
    </p>
  );
}

/** Drawn: the reading to write, with the meaning under it. Typed: the meaning alone. */
function WriteCue({ drill }: { drill: WriteDrill }) {
  if (drill.typed) return <Meaning drill={drill} className={styles.meaningCue} />;
  return (
    <div className={styles.writeCue}>
      <p className={styles.cue} data-write-reading="">
        <Ja>{drill.word.reading}</Ja>
      </p>
      <Meaning drill={drill} className={styles.text} />
    </div>
  );
}

export interface WriteViewProps {
  drill: WriteDrill;
  answer: DrillAnswer | undefined;
  /** "I can't draw now": the reading is typed instead. */
  onTyped?: (() => void) | undefined;
}

/** The blanked sentence and its cue; once answered, the sentence and the word with its reading. */
export function WriteView({ drill, answer, onTyped }: WriteViewProps) {
  const t = useT();
  const word = <FormRuby written={drill.word.written} reading={drill.word.reading} />;
  return (
    <>
      <p className={styles.prompt}>
        {t(drill.typed ? 'exercises.promptWriteTyped' : 'exercises.promptWrite')}
      </p>
      {answer ? (
        <TapSentence
          sentence={drill.sentence}
          target={answerSpan(drill.sentence, drill.tokenIndex)}
        />
      ) : (
        <BlankedWord drill={drill} />
      )}
      {!answer && <WriteCue drill={drill} />}
      {!answer && !drill.typed && onTyped && (
        <ChipRow>
          <Chip onClick={onTyped} title={t('exercises.cantDrawHint')}>
            {t('exercises.cantDraw')}
          </Chip>
        </ChipRow>
      )}
      {answer && (
        <Outcome
          answer={answer}
          right={word}
          chosen={<Ja>{answer.answer}</Ja>}
          chosenLabel={drill.typed ? undefined : t('exercises.drawnAs')}
        />
      )}
    </>
  );
}

/** The drawing pad from the handwrite feature, or the reading typed when typed or not wired. */
export function WriteActions(props: { drill: WriteDrill; onAnswer: (value: string) => void }) {
  const { drill, onAnswer } = props;
  const Draw = useSlot('kanjiDraw');
  const t = useT();
  if (drill.typed || !Draw) {
    return (
      <TypedActions
        label={t('exercises.typeReading')}
        placeholder={t('exercises.typeHint')}
        onAnswer={onAnswer}
      />
    );
  }
  return (
    <ActionBar>
      <Draw kanji={drill.kanji} onAnswer={onAnswer} />
    </ActionBar>
  );
}
