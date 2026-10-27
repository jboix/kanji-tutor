/**
 * "I can't draw now" on a writing exercise, and "Draw it again" once it was pressed, so drawing
 * comes back in the same session.
 */
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';

export interface DrawSwitch {
  /** Writing is typed for a while. */
  onTyped: () => void;
  /** Drawing again, when it was only paused (not typed by the settings). */
  onDraw?: (() => void) | undefined;
}

/** The chip that pauses drawing, or brings it back; nothing when neither applies. */
export function DrawChip({ typed, draw }: { typed: boolean; draw: DrawSwitch | undefined }) {
  const t = useT();
  if (!draw || (typed && !draw.onDraw)) return null;
  const chip = typed ? (
    <Chip onClick={draw.onDraw}>{t('exercises.drawAgain')}</Chip>
  ) : (
    <Chip onClick={draw.onTyped} title={t('exercises.cantDrawHint')}>
      {t('exercises.cantDraw')}
    </Chip>
  );
  return <ChipRow>{chip}</ChipRow>;
}
