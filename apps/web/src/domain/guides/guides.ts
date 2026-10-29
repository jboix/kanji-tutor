/**
 * Guides: static references to come back to (the verb groups, the て-form, plain and polite
 * forms, adjectives, a conjugation table, keigo). Each names the grammar points it backs, so the
 * intro and page of the first of them can point to it. Pure.
 */
import type { LearnerLevel } from '../types.ts';

export type GuideId =
  | 'verb-groups'
  | 'te-form'
  | 'plain-polite'
  | 'adjectives'
  | 'conjugation'
  | 'keigo';

export interface Guide {
  id: GuideId;
  /** Its name in Japanese, as a textbook heads it. */
  titleJa: string;
  /** The level it is first needed at. */
  level: LearnerLevel;
  /** The grammar points whose intro and page link to it, the first met first. */
  grammarIds: readonly string[];
}

/** In the order they are needed. */
export const GUIDES: readonly Guide[] = [
  {
    id: 'verb-groups',
    titleJa: '動詞のグループ',
    level: 5,
    grammarIds: ['masu', 'masen', 'mashita', 'masen-deshita', 'nai-form'],
  },
  {
    id: 'plain-polite',
    titleJa: '辞書形とます形',
    level: 5,
    grammarIds: ['da', 'koto-ga-dekiru', 'to-omou', 'mae-ni', 'koto-ga-aru', 'no-ga-suki'],
  },
  {
    id: 'te-form',
    titleJa: 'て形とた形',
    level: 5,
    grammarIds: [
      'te-kudasai',
      'te-iru',
      'te-mo-ii',
      'te-wa-ikenai',
      'te-kara',
      'ta-form',
      'mou-ta',
      'ta-koto-ga-aru',
      'tari-tari',
    ],
  },
  {
    id: 'adjectives',
    titleJa: '形容詞の活用',
    level: 5,
    grammarIds: ['adj-kute', 'adj-katta', 'adj-ku-nai'],
  },
  {
    id: 'conjugation',
    titleJa: '活用表',
    level: 4,
    grammarIds: [
      'passive',
      'causative',
      'causative-passive',
      'imperative',
      'you-to-omou',
      'ba',
      'tara',
    ],
  },
  {
    id: 'keigo',
    titleJa: '敬語',
    level: 4,
    grammarIds: [
      'sonkei-verbs',
      'o-ni-naru',
      'kenjou-verbs',
      'o-suru',
      'gozaimasu',
      'te-itadaku',
      'te-kudasaru',
      'sasete-itadaku',
    ],
  },
];

export function guideById(id: string): Guide | undefined {
  return GUIDES.find((guide) => guide.id === id);
}

/** The guide that backs a grammar point, if one does. */
export function guideFor(grammarId: string): Guide | undefined {
  return GUIDES.find((guide) => guide.grammarIds.includes(grammarId));
}
