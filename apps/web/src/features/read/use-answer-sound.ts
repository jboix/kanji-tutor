import { useCallback, useEffect, useRef } from 'react';
import type { Grade } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';
import { sound } from '../../ui/sound.ts';

/**
 * The answer tones (U2): a soft rising two-note when right, a low note for a miss, nothing for a
 * skip (L4) or when sounds are off in Settings. Gestures on the page unlock Web Audio (iOS).
 */
export function useAnswerSound(): (grade: Grade) => void {
  const { repos } = useServices();
  const on = useRef(true);
  useEffect(() => {
    let live = true;
    void repos.settings.get().then((settings) => {
      if (live) on.current = settings.sound !== false;
    });
    const stop = sound.listen(window);
    return () => {
      live = false;
      stop();
    };
  }, [repos]);
  return useCallback((grade: Grade) => {
    if (!on.current || grade.skipped) return;
    sound.play(grade.verdict === 'correct' ? 'correct' : 'wrong');
  }, []);
}

/** Plays the tone once when `grade` appears. */
export function useGradeSound(grade: Grade | undefined) {
  const cue = useAnswerSound();
  useEffect(() => {
    if (grade) cue(grade);
  }, [grade, cue]);
}
