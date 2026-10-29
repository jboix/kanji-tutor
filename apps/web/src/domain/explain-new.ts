import type { Settings } from './types.ts';

/**
 * "Explain new grammar first" and "Explain new kanji first" (L7). Each follows the single
 * setting they replaced until it is set on its own, so a learner who had turned explanations off
 * keeps both off, and one who had them on keeps both on. Absent everywhere means on.
 */
export type ExplainSettings = Pick<Settings, 'explainFirst' | 'explainGrammar' | 'explainKanji'>;

export function explainsGrammar(settings: ExplainSettings): boolean {
  return (settings.explainGrammar ?? settings.explainFirst) !== false;
}

export function explainsKanji(settings: ExplainSettings): boolean {
  return (settings.explainKanji ?? settings.explainFirst) !== false;
}
