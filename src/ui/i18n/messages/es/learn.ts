/** Spanish messages: the Learn hub (IA4). */
import type { Messages } from '../../types.ts';

export const learn = {
  title: 'Aprender',
  lookUp: 'Buscar',
  lookUpPlaceholder: 'Busca un kanji, una palabra o una gramática',
  words: 'Palabras',
  grammarFound: 'Gramática',
  nothingFound:
    'No se ha encontrado nada. Escribe un kanji, una lectura en kana o rōmaji, o una estructura.',
  lessons: 'Lecciones',
  lessonsAt: 'Unidad {order} de {of} · N{level}',
  lessonsDetail: 'El camino de unidades',
  kanji: 'Kanji',
  kanjiWeek: { one: '{n} kanji esta semana', other: '{n} kanji esta semana' },
  kanjiDetail: 'Buscar, esta semana, dibujar',
  grammar: 'Gramática',
  grammarDetail: 'Por nivel y por familia',
  learned: 'Lo que has aprendido',
  learnedDetail: 'Kanji, palabras, gramática',
  notes: 'Notas',
  notesDetail: 'La carta de la semana, las notas guardadas',
  draw: 'Dibujar un kanji',
  drawDetail: 'Encontrarlo a mano',
  mark: 'Marcar lo que ya sabes',
  markDetail: 'Listas JLPT, lecciones de Minna o tu propia lista',
} satisfies Messages['learn'];
