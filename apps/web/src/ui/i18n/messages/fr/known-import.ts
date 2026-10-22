/** French messages: the known-words fields shared by the wizard and the import page. */
import type { Messages } from '../../types.ts';

export const knownImport = {
  lists: 'Listes',
  n5: 'JLPT N5 (liste approximative)',
  n4: 'JLPT N4 (liste approximative)',
  minnaUpTo: 'Minna no Nihongo jusqu’à la leçon',
  minnaLast: 'Dernière leçon de Minna',
  listsHint:
    'Aucune liste de manuel n’est fournie avec l’app : les leçons 1 à 25 comptent comme JLPT N5 et 26 à 50 comme N4.',
  pastedKnown: 'Je les connais déjà',
  pastedNew: 'Mots nouveaux du cours',
  pastedAs: 'Ces mots sont',
  newHint:
    'Ils commencent comme mots nouveaux de la leçon et de la semaine : vos prochaines séances les présentent.',
  lessonTag: 'Étiquette de leçon pour ces mots (facultatif)',
  lessonPlaceholder: 'p. ex. Minna 第12課',
  ownList: 'Votre propre liste',
  ownListLabel: 'Un mot par ligne, en kanji ou en kana',
} satisfies Messages['knownImport'];
