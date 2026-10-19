/** French texts for N3 grammar, part E (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N3_E: ById<GrammarText> = {
  zu: {
    meaning: 'ne pas …, et ; sans',
    formation: 'V-ない (radical) + ず (する → せず)',
    explanation:
      'ず est un négatif écrit qui relie des propositions : 成績が上がらず、不安になった signifie « mes notes n’ont pas monté, et je me suis inquiété ». Suivi de に, il devient 〜ずに, « sans faire ».',
  },
  'to-yobareru': {
    meaning: 's’appeler … ; être connu sous le nom de …',
    explanation:
      'Le passif de と呼ぶ, « appeler … », sert à nommer ou à définir quelque chose : これは「落ち」と呼ばれる. Il est courant dans les explications et les manuels.',
  },
  'ni-kakete': {
    meaning: 'de … à … ; sur la période de',
    explanation:
      'にかけて marque une étendue de temps ou d’espace aux limites floues : 六月から七月にかけて, « de juin jusqu’en juillet ». Contrairement à 〜から〜まで, les limites sont approximatives.',
  },
};
