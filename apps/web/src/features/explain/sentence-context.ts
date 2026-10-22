import type { FollowUpChip, FollowUpKind, SentenceContext } from '../../ai/types.ts';
import { answerSpan } from '../../domain/services/index.ts';
import type { Sentence } from '../../domain/types.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/** What the AI is told about a sentence. */
export function contextOf(sentence: Sentence): SentenceContext {
  return sentence.translation
    ? { text: sentence.text, translation: sentence.translation }
    : { text: sentence.text };
}

/** Token indices of the word at `tokenIndex` with its attached endings (待っ + て). */
export function wordSpan(sentence: Sentence, tokenIndex: number): number[] {
  return answerSpan(sentence, tokenIndex);
}

/** The written word at `tokenIndex` with its endings, e.g. 待って. */
export function spanSurface(sentence: Sentence, span: readonly number[]): string {
  return span.map((i) => sentence.tokens[i]?.surface ?? '').join('');
}

/** The tokenizer's reading of the span, e.g. まって (dictionary-checked for session sentences). */
export function spanReading(sentence: Sentence, span: readonly number[]): string {
  return span.map((i) => sentence.tokens[i]?.reading ?? '').join('');
}

const BREAK_DOWN = /break\s*down/i;

/** Every explanation offers these, in this order (A3). */
const KINDS: readonly FollowUpKind[] = ['compare', 'example', 'simpler', 'quiz', 'keep'];

/** The label of a chip the model did not word itself. */
export function defaultChipLabel(t: Translate, kind: FollowUpKind, surface: string): string {
  const labels: Record<FollowUpKind, string> = {
    compare: t('explain.chipCompare', { surface }),
    example: t('explain.chipExample', { surface }),
    simpler: t('explain.chipSimpler'),
    quiz: t('explain.chipQuiz', { surface }),
    keep: t('explain.chipKeep'),
  };
  return labels[kind];
}

/**
 * One chip of each `kinds` (all five by default, A3): the model's label when it gave one,
 * else a default about `surface`. A model "break down" chip is left out (the mistake note
 * adds its own, which opens the word sheet).
 */
export function followUpChips(
  t: Translate,
  chips: readonly FollowUpChip[],
  surface: string,
  kinds: readonly FollowUpKind[] = KINDS,
): FollowUpChip[] {
  const usable = chips.filter((chip) => !BREAK_DOWN.test(chip.label));
  return kinds.map(
    (kind) =>
      usable.find((chip) => chip.kind === kind) ?? {
        kind,
        label: defaultChipLabel(t, kind, surface),
      },
  );
}
