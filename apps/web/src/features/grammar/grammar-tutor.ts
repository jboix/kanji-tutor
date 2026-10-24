import { useMemo } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useTutor } from '../../ui/tutor.tsx';
import type { Point } from './grammar-data.ts';

/** The tutor on a grammar point: its introduction and its page (Tutor-grammar-*). */
export function useGrammarTutor(entry: Point) {
  const t = useT();
  const options = useMemo(() => {
    const grammar = { pattern: entry.pattern, meaning: entry.meaning };
    return {
      topic: { about: entry.pattern, sentence: { text: entry.pattern }, grammar },
      starters: [
        t('grammar.tutorWhen', { x: entry.pattern }),
        t('grammar.tutorCasual', { x: entry.pattern }),
      ],
    };
  }, [entry, t]);
  return useTutor(options);
}
