/** Spanish messages: session labels, feedback and the end-of-session summary (M3). */
import type { Messages } from '../../types.ts';

export const readSession = {
  missingKana: '(sin {kana})',
  whatYouSaid: 'Lo que dijiste',
  hear: 'Escuchar',
  slipLongVowel: 'vocal larga',
  slipSokuon: 'っ pequeña',
  slipRendaku: 'sonorización',
  prompt: 'Escribe la lectura',
  right: 'Correcto',
  notQuite: 'No del todo',
  almost: 'Casi: {slip}',
  almostPlain: 'Casi',
  readAs: 'Se lee',
  youWrote: 'Escribiste',
  expected: 'Esperado',
  skip: 'No lo sé',
  hereItIs: 'Aquí está:',
  alsoCorrect: 'También es correcto.',
  moreCommonReading: 'es la lectura más común.',
  nextWord: 'Siguiente palabra',
  nextSentence: 'Siguiente frase',
} satisfies Messages['readSession'];
