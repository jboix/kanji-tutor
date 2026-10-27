/** French messages: session labels, feedback and the end-of-session summary (M3). */
import type { Messages } from '../../types.ts';

export const readSession = {
  missingKana: '(sans {kana})',
  whatYouSaid: 'Ce que vous avez dit',
  hear: 'Écouter',
  slipLongVowel: 'voyelle longue',
  slipSokuon: 'petit っ',
  slipRendaku: 'sonorisation',
  prompt: 'Tapez la lecture',
  right: 'Juste',
  notQuite: 'Pas tout à fait',
  almost: 'Presque : {slip}',
  almostPlain: 'Presque',
  readAs: 'Se lit',
  youWrote: 'Vous avez écrit',
  expected: 'Attendu',
  skip: 'Je ne sais pas',
  hereItIs: 'La voici :',
  alsoCorrect: 'Juste aussi.',
  moreCommonReading: 'est la lecture la plus courante.',
  nextWord: 'Mot suivant',
  nextSentence: 'Phrase suivante',
  whereUnit: 'Unité {order}',
  whereScan: 'Leçon scannée',
  whereExercises: 'Exercices',
} satisfies Messages['readSession'];
