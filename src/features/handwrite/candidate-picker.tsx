import { useState } from 'react';
import type { CheckedReading } from '../../ai/types.ts';
import { AiBlock } from '../../ui/ai-block.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { CandidateDetail, CandidateRow, Segments } from './candidates.tsx';
import { jaSegments } from './detail-text.ts';
import { UncheckedLine } from './unchecked-line.tsx';

type Failed = readonly CheckedReading[];

export interface PickerProps {
  chars: readonly string[];
  /** Marks AI candidates with the 解 seal: a fixed line, or a reason per kanji (describe). */
  aiNote?: string | undefined;
  reasons?: Readonly<Record<string, string>>;
  /** Unconfirmed readings in each reason, listed under it. */
  unchecked?: Readonly<Record<string, Failed>>;
}

function PickedNote(props: { shown: string; note: string; reason: boolean; failed: Failed }) {
  const { shown, note, reason, failed } = props;
  const t = useT();
  const detail = failed.length > 0 ? <UncheckedLine readings={failed} /> : undefined;
  return (
    <AiBlock
      size="xs"
      label={reason ? t('handwrite.whyChar', { char: shown }) : t('handwrite.fromAi')}
      detail={detail}
    >
      <Segments parts={jaSegments(note)} />
    </AiBlock>
  );
}

/** Candidate row plus the detail strip of the picked one (the first until another is tapped). */
export function Picker({ chars, aiNote, reasons, unchecked }: PickerProps) {
  const [picked, setPicked] = useState<string>();
  const shown = picked !== undefined && chars.includes(picked) ? picked : chars[0];
  if (shown === undefined) return null;
  const reason = reasons?.[shown];
  const note = reason ?? aiNote;
  const failed = reason ? (unchecked?.[shown] ?? []) : [];
  return (
    <>
      <CandidateRow chars={chars} picked={shown} onPick={setPicked} />
      {note !== undefined && (
        <PickedNote shown={shown} note={note} reason={Boolean(reason)} failed={failed} />
      )}
      <CandidateDetail char={shown} />
    </>
  );
}
