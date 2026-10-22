/** French messages: drills in the reading session (R8). */
import type { Messages } from '../../types.ts';

export const drills = {
  promptLookalike: 'Quel kanji convient ?',
  promptCloze: 'Quelle structure convient ?',
  promptReadings: 'Un kanji, plusieurs lectures',
  promptFamily: 'Même élément, même son',
  read: 'Se lit',
  asWord: 'Dans un mot',
  known: 'connu',
  guessIt: 'à deviner',
  familyHint: '{guess} partage {part} avec des kanji que vous lisez. Devinez son on’yomi.',
  youChose: 'Vous avez choisi',
  fits: 'Convient',
  readings: 'Lectures',
  swappedRecently: 'confondus récemment',
  choices: 'Choix',
  onyomiOf: 'On’yomi de {kanji}',
  readingOf: 'Lecture de {word}',
  guessReading: 'Devinez la lecture',
} satisfies Messages['drills'];
