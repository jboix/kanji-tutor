/** Spanish messages: the known-words fields shared by the wizard and the import page. */
import type { Messages } from '../../types.ts';

export const knownImport = {
  lists: 'Listas',
  n5: 'JLPT N5 (lista aproximada)',
  n4: 'JLPT N4 (lista aproximada)',
  minnaUpTo: 'Minna no Nihongo hasta la lección',
  minnaLast: 'Última lección de Minna',
  listsHint:
    'La app no incluye listas de manuales, así que las lecciones 1–25 cuentan como JLPT N5 y las 26–50 como N4.',
  pastedKnown: 'Ya las conozco',
  pastedNew: 'Palabras nuevas de clase',
  pastedAs: 'Estas palabras son',
  newHint:
    'Empiezan como palabras nuevas de la lección y de esta semana, así que tus próximas sesiones las presentan.',
  lessonTag: 'Etiqueta de lección para estas palabras (opcional)',
  lessonPlaceholder: 'p. ej. Minna 第12課',
  ownList: 'Tu propia lista',
  ownListLabel: 'Una palabra por línea, en kanji o kana',
} satisfies Messages['knownImport'];
