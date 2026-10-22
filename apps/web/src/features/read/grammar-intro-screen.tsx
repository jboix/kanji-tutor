/** A grammar introduction card in the session (G4), through the `grammarIntro` slot. */
import { type ReactNode, useCallback, useEffect } from 'react';
import { introduceGrammar } from '../../domain/services/index.ts';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { useSlot } from '../../ui/slots.tsx';

export interface GrammarIntroScreenProps {
  grammarId: string;
  topBar: ReactNode;
  onDone: () => void;
}

/**
 * The introduction of a new grammar point before its first exercise. "Got it" records the
 * point as introduced (it joins FSRS) and goes on; without the slot the card is passed over.
 */
export function GrammarIntroScreen({ grammarId, topBar, onDone }: GrammarIntroScreenProps) {
  const Intro = useSlot('grammarIntro');
  const { repos } = useServices();
  const done = useCallback(
    () => void introduceGrammar(repos, grammarId, Date.now()).then(onDone),
    [repos, grammarId, onDone],
  );
  useEffect(() => {
    if (!Intro) onDone();
  }, [Intro, onDone]);
  if (!Intro) return null;
  return (
    <Screen topBar={topBar} gap={22} enter={false}>
      <Intro grammarId={grammarId} onDone={done} />
    </Screen>
  );
}
