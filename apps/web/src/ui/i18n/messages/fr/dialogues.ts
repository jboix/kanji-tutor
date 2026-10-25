/** French messages: grammar dialogues on the intro card, the grammar page and their drill. */
import type { Messages } from '../../types.ts';

export const dialogues = {
  introLabel: 'Dans une conversation',
  pageLabel: 'En conversation',
  between: 'Une conversation entre {a} et {b}',
  speaker: '{name} :',
  play: 'Écouter',
  playLabel: 'Écouter la conversation',
  showTranslation: 'Voir la traduction',
  settingFriends: 'Entre amis',
  settingFamily: 'En famille',
  settingWork: 'Au travail',
  settingSchool: 'À l’école',
  settingShop: 'En magasin',
  registerPlain: 'familier',
  registerPolite: 'poli',
  register: '{setting} · {register}',
  compare: 'Comparer avec {pattern}',
  prompt: 'Complétez la réplique',
  tutorExplain: 'Expliquer cette conversation',
  tutorWhy: 'Pourquoi {x} ici ?',
} satisfies Messages['dialogues'];
