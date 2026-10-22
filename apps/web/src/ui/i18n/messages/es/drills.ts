/** Spanish messages: drills in the reading session (R8). */
import type { Messages } from '../../types.ts';

export const drills = {
  promptLookalike: '¿Qué kanji encaja?',
  promptCloze: '¿Qué estructura encaja?',
  promptReadings: 'Un kanji, varias lecturas',
  promptFamily: 'Misma parte, mismo sonido',
  read: 'Se lee',
  asWord: 'En una palabra',
  known: 'conocido',
  guessIt: 'adivínalo',
  familyHint: '{guess} comparte {part} con kanji que ya lees. Adivina su on’yomi.',
  youChose: 'Elegiste',
  fits: 'Encaja',
  readings: 'Lecturas',
  swappedRecently: 'confundidos hace poco',
  choices: 'Opciones',
  onyomiOf: 'On’yomi de {kanji}',
  readingOf: 'Lectura de {word}',
  guessReading: 'Adivina la lectura',
} satisfies Messages['drills'];
