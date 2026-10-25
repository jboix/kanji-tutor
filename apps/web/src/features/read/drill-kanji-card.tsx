/**
 * Kanji cards (Start → Kanji): a kanji to read, typed in kana; or its readings and meaning to
 * write it, drawn on the handwriting pad, or chosen among lookalikes when drawing is off.
 */
import type { KanjiCardDrill } from '../../domain/drills/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { useSlot } from '../../ui/slots.tsx';
import styles from './drill.module.css';
import { ChoiceActions } from './drill-choices.tsx';
import { Outcome } from './drill-exercises.tsx';
import { TypedActions } from './drill-typed.tsx';
import type { DrillAnswer } from './use-drill.ts';

/** A dictionary reading as a learner reads it: い.きる as い(きる), the okurigana in brackets. */
export const shownReading = (reading: string) =>
  reading.replace(/\.(.+)$/u, '($1)').replaceAll('-', '');

const readingLine = (readings: readonly string[]) => readings.map(shownReading).join('・');

function Meanings({ drill }: { drill: KanjiCardDrill }) {
  return (
    <p className={styles.text} data-card-meaning="">
      {drill.meanings.join('; ')}
    </p>
  );
}

function BigKanji({ drill }: { drill: KanjiCardDrill }) {
  return (
    <p lang="ja" className={styles.cardKanji} data-card-kanji="">
      {drill.kanji}
    </p>
  );
}

/** Before the answer: the kanji to read, or the readings to write it from. */
function CardFront({
  drill,
  onTyped,
}: {
  drill: KanjiCardDrill;
  onTyped?: (() => void) | undefined;
}) {
  const t = useT();
  if (drill.direction === 'read') {
    return (
      <>
        <BigKanji drill={drill} />
        <Meanings drill={drill} />
      </>
    );
  }
  return (
    <>
      <p className={styles.cue} data-card-readings="">
        <Ja>{readingLine(drill.cue)}</Ja>
      </p>
      <Meanings drill={drill} />
      {!drill.typed && onTyped && (
        <ChipRow>
          <Chip onClick={onTyped} title={t('exercises.cantDrawHint')}>
            {t('exercises.cantDraw')}
          </Chip>
        </ChipRow>
      )}
    </>
  );
}

function promptOf(drill: KanjiCardDrill) {
  if (drill.direction === 'read') return 'exercises.promptCardRead';
  return drill.typed ? 'exercises.promptCardChoose' : 'exercises.promptWrite';
}

export interface KanjiCardViewProps {
  drill: KanjiCardDrill;
  answer: DrillAnswer | undefined;
  /** "I can't draw now": writing cards become a choice. */
  onTyped?: (() => void) | undefined;
}

/** The card; once answered, the kanji with all its readings and what was given when wrong. */
export function KanjiCardView({ drill, answer, onTyped }: KanjiCardViewProps) {
  const t = useT();
  const drawn = drill.direction === 'write' && !drill.typed;
  return (
    <>
      <p className={styles.prompt}>{t(promptOf(drill))}</p>
      {answer ? <BigKanji drill={drill} /> : <CardFront drill={drill} onTyped={onTyped} />}
      {answer && (
        <Outcome
          answer={answer}
          right={<Ja>{drill.direction === 'read' ? readingLine(drill.readings) : drill.kanji}</Ja>}
          chosen={<Ja>{answer.answer}</Ja>}
          chosenLabel={drawn ? t('exercises.drawnAs') : undefined}
        />
      )}
      {answer && <Meanings drill={drill} />}
    </>
  );
}

/** A reading typed in kana; the kanji drawn on the pad; or, typed, chosen among others. */
export function KanjiCardActions(props: { drill: KanjiCardDrill; onAnswer: (v: string) => void }) {
  const { drill, onAnswer } = props;
  const Draw = useSlot('kanjiDraw');
  const t = useT();
  if (drill.direction === 'read') {
    return (
      <TypedActions
        label={t('exercises.typeAReading')}
        placeholder={t('exercises.typeHint')}
        onAnswer={onAnswer}
      />
    );
  }
  if (drill.typed || !Draw) {
    const choices = drill.choices.map((c) => ({ value: c, label: c }));
    return <ChoiceActions choices={choices} stacked={false} onChoose={onAnswer} />;
  }
  return (
    <ActionBar>
      <Draw kanji={[drill.kanji]} onAnswer={onAnswer} />
    </ActionBar>
  );
}
