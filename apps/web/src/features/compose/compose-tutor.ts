/**
 * The tutor on Use it (Compose-*): about the grammar point and the sentence, before the check
 * and after it. Once corrected, it suggests asking about the first fix, or for a natural
 * sentence, another way to say it.
 */
import { useMemo } from 'react';
import type { Correction, CorrectionMark } from '../../ai/index.ts';
import type { ComposeTarget } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { useTutor } from '../../ui/tutor.tsx';

/** "Why 見ました, not 見ます?", "Why add な?" or "Why drop は?". */
function fixQuestion(t: Translate, mark: CorrectionMark, text: string): string {
  const was = text.slice(mark.start, mark.end);
  if (!was) return t('compose.tutorWhyAdd', { fix: mark.text });
  if (!mark.text) return t('compose.tutorWhyDrop', { was });
  return t('compose.tutorWhyFix', { fix: mark.text, was });
}

function starters(t: Translate, pattern: string, text: string, correction?: Correction) {
  if (!correction) return [t('grammar.tutorWhen', { x: pattern }), t('compose.tutorIdeas')];
  const fix = correction.marks.find((mark) => mark.severity === 'error');
  if (fix) return [fixQuestion(t, fix, text), t('compose.tutorMore', { x: pattern })];
  return [t('compose.tutorAnother'), t('grammar.tutorCasual', { x: pattern })];
}

export function useComposeTutor(target: ComposeTarget, text: string, correction?: Correction) {
  const t = useT();
  const options = useMemo(() => {
    const { pattern, meaning } = target.grammar;
    const sentence = correction?.corrected ?? (text.trim() || pattern);
    return {
      topic: { about: pattern, sentence: { text: sentence }, grammar: { pattern, meaning } },
      starters: starters(t, pattern, text, correction),
    };
  }, [target, text, correction, t]);
  return useTutor(options);
}
