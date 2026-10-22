/** Spanish messages: weekly notes (A7). Counts and real examples, never praise. */
import type { Messages } from '../../types.ts';

export const notes = {
  thisWeek: 'Esta semana',
  counting: 'Contando esta semana…',
  letterRegion: 'Carta sobre la semana',
  aiLetter: 'La carta del tutor',
  writing: 'Escribiendo la carta de esta semana…',
  askLetter: 'Pedir al tutor que escriba la carta de esta semana',
  ungrounded:
    'La carta redactada citaba cosas que no están en tus registros ({claims}), así que esta es la versión simple.',
  noKey:
    'Añade una clave de Gemini en {settings} para una carta redactada. Estas son las cifras simples.',
  settings: 'Ajustes',
  offline: 'Estás sin conexión, así que esta es la carta simple con tus cifras.',
  failed: 'Esta vez no hay carta redactada ({reason}). Estas son las cifras simples.',
  nothingRead: 'Aún no has leído nada esta semana.',
  read: {
    one: 'Leíste {n} frase y acertaste la lectura en {right}.',
    other: 'Leíste {n} frases y acertaste la lectura en {right}.',
  },
  rightNone: 'ninguna',
  missOne: 'El único fallo fue en {what}.',
  missAll: 'Los {n} fallos fueron en {what}.',
  missSome: '{count} de {n} fallos fueron en {what}.',
  missed: '{lead} Fallos de esta semana: {examples}.',
  missedAs: '{surface} leído {given}',
  manyLongVowel: 'vocales largas',
  manySokuon: 'la っ pequeña',
  manyRendaku: 'cambios de sonorización',
  manyWrongKanji: 'kanji parecidos',
  manyKanaVariant: 'variantes de kana',
  manyOther: 'lecturas totalmente erróneas, no un simple desliz',
  unusedOne: 'Aún no has usado {first} por tu cuenta.',
  unusedTwo: 'Aún no has usado {first} ni {second} por tu cuenta.',
  keptOn: 'Guardada el {date}',
  keptNotes: 'Notas guardadas',
  keptEmpty: 'Las explicaciones que guardes durante una lectura aparecen aquí.',
  deleteNamed: 'Borrar {title}',
  delete: 'Borrar',
  deleteAsk: '¿Borrar esta nota?',
  keep: 'Conservar',
} satisfies Messages['notes'];
