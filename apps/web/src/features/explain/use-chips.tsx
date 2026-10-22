import { type ReactNode, useRef } from 'react';
import type { AiClient, FollowUpChip, Result } from '../../ai/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { Chip } from '../../ui/chip.tsx';
import { useServices } from '../../ui/services.tsx';
import {
  type ChipContext,
  type ChipDeps,
  type ChipOutcome,
  chipSendsRequest,
  runChip,
  writeNewSentences,
} from './chip-actions.ts';
import { JaText } from './ja-text.tsx';
import { type AiState, useAiState } from './use-ai.ts';

/** A chip's action with the client of the press that started it (none for local chips). */
type Make = (client: AiClient | undefined) => () => Promise<Result<ChipOutcome>>;

export interface Chips {
  /** The chip buttons, for a `ChipRow` or `AiNote chips`. */
  buttons: ReactNode;
  state: AiState<ChipOutcome>;
  /** "Write a new one" under the pack examples: the tutor's generateSentences (A15). */
  onWriteNew: (client: AiClient) => void;
  /** Runs the last chip again, after a rate limit (A14), with the client of the retry press. */
  retry: (client: AiClient) => void;
}

function useChipRunner() {
  const { repos, lang } = useServices();
  const [state, begin] = useAiState<ChipOutcome>();
  const last = useRef<Make>(undefined);
  const deps = (client: AiClient | undefined): ChipDeps => ({ repos, lang, client });
  const start = (make: Make, client?: AiClient) => {
    last.current = make;
    begin(make(client));
  };
  const retry = (client: AiClient) => last.current && begin(last.current(client));
  return { state, deps, start, retry };
}

/**
 * Follow-up chips (A3) acting on `context`; the last tapped one's outcome is in `state`. A chip
 * that asks the tutor is an `AiAction`; keep and the pack examples stay plain (A18).
 */
export function useChips(chips: readonly FollowUpChip[], context: ChipContext | undefined): Chips {
  const { state, deps, start, retry } = useChipRunner();
  const busy = !context || state.status === 'loading';
  const kept = state.status === 'done' && state.value.type === 'kept';
  const button = (chip: FollowUpChip): ReactNode => {
    const make: Make = (client) => () => runChip(deps(client), context as ChipContext, chip.kind);
    const key = `${chip.kind}:${chip.label}`;
    const text = <JaText text={chip.label} emph={false} />;
    if (chipSendsRequest(chip.kind, context)) {
      const run = (client: AiClient) => start(make, client);
      return <AiAction key={key} label={chip.label} content={text} run={run} disabled={busy} />;
    }
    const off = busy || (chip.kind === 'keep' && kept);
    return (
      <Chip key={key} aria-label={chip.label} disabled={off} onClick={() => start(make)}>
        {text}
      </Chip>
    );
  };
  const onWriteNew = (client: AiClient) =>
    context && start((c) => () => writeNewSentences(deps(c), context), client);
  return { buttons: chips.map(button), state, onWriteNew, retry };
}
