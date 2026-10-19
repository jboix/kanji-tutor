/** Plain copy for the learned screen (P3): counts, never praise. */
import type { LearnedGroup, LearnedKind, LearnedState } from '../../domain/services/index.ts';
import type { Translate } from '../../ui/i18n/types.ts';

export const STATE_LABEL = {
  known: 'learned.stateKnown',
  learning: 'learned.stateLearning',
  'not-started': 'learned.stateNotStarted',
} as const satisfies Record<LearnedState, string>;

const OTHER = {
  kanji: 'learned.otherKanji',
  words: 'learned.otherWords',
  grammar: 'learned.otherGrammar',
} as const satisfies Record<LearnedKind, string>;

const AT_LEVEL = {
  kanji: 'learned.levelKanji',
  words: 'learned.levelWords',
  grammar: 'learned.levelGrammar',
} as const satisfies Record<LearnedKind, string>;

/** "N5 kanji", "Other words". */
export function groupName(t: Translate, level: LearnedGroup['level'], kind: LearnedKind): string {
  return level === 'other' ? t(OTHER[kind]) : t(AT_LEVEL[kind], { level });
}

/** "N5 kanji: 64 of 79 known" or, for other, "Other words: 12 known". */
export function coverageLine(t: Translate, group: LearnedGroup, kind: LearnedKind): string {
  const head = groupName(t, group.level, kind);
  const learning =
    group.learning > 0 ? t('learned.learningSuffix', { learning: group.learning }) : '';
  if (group.level === 'other') {
    return t('learned.coverageOther', { head, known: group.known, learning });
  }
  return t('learned.coverage', { head, known: group.known, total: group.total, learning });
}

/** "3 words marked as known; 11 words were already known." */
export function applyLine(t: Translate, marked: number, already: number): string {
  const head = marked > 0 ? t('learned.marked', { n: marked }) : t('learned.nothingNew');
  return already > 0
    ? t('learned.applyAlready', { head, n: already })
    : t('learned.applyDone', { head });
}
