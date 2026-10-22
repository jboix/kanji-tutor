/** Spanish messages: the import page (K6). */
import type { Messages } from '../../types.ts';

export const importScreen = {
  heading: 'Marcar lo que ya sabes',
  intro:
    'Las palabras que marques empiezan como leídas entre palabras familiares, así las sesiones pueden elegir frases con solo una o dos palabras nuevas. Las palabras escritas solo en kana, como {example}, se omiten. Puedes volver a aplicar una lista cuando quieras: las palabras que sabes conservan su progreso y nada se añade dos veces.',
  import: 'Importar',
  finding: 'Buscando las palabras…',
  marking: 'Marcando {done} de {total}',
  marked: {
    one: '{n} palabra marcada como conocida',
    other: '{n} palabras marcadas como conocidas',
  },
  added: { one: '{n} palabra añadida como nueva', other: '{n} palabras añadidas como nuevas' },
  toLesson: 'a {lesson}',
  notFound: { one: '; {n} línea no encontrada:', other: '; {n} líneas no encontradas:' },
  already: { one: '{n} palabra ya era conocida.', other: '{n} palabras ya eran conocidas.' },
  tracked: {
    one: '{n} palabra ya estaba en seguimiento y se quedó como estaba.',
    other: '{n} palabras ya estaban en seguimiento y se quedaron como estaban.',
  },
  backToToday: 'Volver a Inicio',
  markMore: 'Marcar más',
  failed: 'La importación no terminó. No se perdió nada de lo que tenías; inténtalo de nuevo.',
} satisfies Messages['importScreen'];
