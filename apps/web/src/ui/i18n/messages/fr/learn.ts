/** French messages: the Learn hub (IA4). */
import type { Messages } from '../../types.ts';

export const learn = {
  title: 'Apprendre',
  lookUp: 'Chercher',
  lookUpPlaceholder: 'Chercher un kanji, un mot ou une grammaire',
  words: 'Mots',
  grammarFound: 'Grammaire',
  nothingFound: 'Rien trouvé. Tapez un kanji, une lecture en kana ou en romaji, ou une structure.',
  lessons: 'Leçons',
  lessonsAt: 'Unité {order} sur {of} · N{level}',
  lessonsDetail: 'Le parcours des unités',
  kanji: 'Kanji',
  kanjiWeek: { one: '{n} kanji cette semaine', other: '{n} kanji cette semaine' },
  kanjiDetail: 'Chercher, cette semaine, dessiner',
  grammar: 'Grammaire',
  grammarDetail: 'Par niveau et par famille',
  learned: 'Ce que vous avez appris',
  learnedDetail: 'Kanji, mots, grammaire',
  notes: 'Notes',
  notesDetail: 'La lettre de la semaine, les notes gardées',
  draw: 'Dessiner un kanji',
  drawDetail: 'Le trouver à la main',
  mark: 'Marquer ce que vous savez déjà',
  markDetail: 'Listes JLPT, leçons de Minna ou votre propre liste',
} satisfies Messages['learn'];
