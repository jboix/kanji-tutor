/** Copy for Find my level (A11): plain, no score, no praise. */
import type { PlacementAnswer } from '../../ai/types.ts';
import type { AreaNote, PlacementQuestion } from '../../domain/placement/index.ts';
import type { LearnerLevel } from '../../domain/types.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

/** The optional written answer, at the level the staircase ended on. */
export const WRITING_PROMPT: Readonly<Record<LearnerLevel, string>> = {
  5: '自己紹介を書いてください。',
  4: '週末にしたことを書いてください。',
  3: '最近うれしかったことを書いてください。',
};

const AREA_NAME: Readonly<Record<AreaNote['kind'], PlainKey>> = {
  'kanji-reading': 'placement.areaKanjiReading',
  orthography: 'placement.areaOrthography',
  'grammar-form': 'placement.areaGrammarForm',
  comprehension: 'placement.areaComprehension',
};

/** "Kanji readings: steady at N5; N4 not yet." */
export function areaText(t: Translate, note: AreaNote): string {
  const area = t(AREA_NAME[note.kind]);
  if (note.status === 'steady-shaky') {
    return t('placement.steadyShaky', { area, steady: note.steady, shaky: note.shaky });
  }
  if (note.status === 'steady') return t('placement.steady', { area, level: note.steady });
  return t('placement.notYet', { area, level: note.level });
}

/** What a question asked, for the tutor's summary (English: it is part of the request). */
function askedText(item: PlacementQuestion): string {
  const { question } = item;
  return 'stem' in question ? question.stem.target : question.question;
}

/** One answer as the tutor reads it (assessLevel), e.g. "紹介: chose しょかい; right is しょうかい". */
export function answerSummary(item: PlacementQuestion, chosen: number): PlacementAnswer {
  const { question } = item;
  const right = question.options[question.answer]?.text ?? '';
  const picked = chosen < 0 ? "didn't know" : `chose ${question.options[chosen]?.text ?? ''}`;
  return {
    kind: item.kind,
    level: item.level,
    right: chosen === question.answer,
    item: `${askedText(item)}: ${picked}; right is ${right}`,
  };
}
