/** French messages: the reading session screens. */
import type { Messages } from '../../types.ts';

export const read = {
  backToUnit: 'Retour à l’unité',
  nextSection: 'Ensuite : {section} · {name}',
  partDone: '{section} · partie {part} sur {parts} faite',
  backToToday: 'Retour à l’accueil',
  noFocusSentence:
    'Aucune phrase avec {kanji} lu {reading} ne correspond encore à ce que vous savez.',
  nothingToRead:
    'Rien à lire pour l’instant : aucune phrase ne correspond encore à ce que vous savez. Ajoutez les mots de la semaine, ou {link}.',
  markKnownWords: 'indiquez les mots que vous connaissez déjà',
  title: 'Lire',
  choosing: 'Choix des phrases…',
  answerByVoice: 'Répondre à voix haute',
  newGrammarChip: 'Grammaire nouvelle : {pattern}',
  newGrammarLabel: 'Grammaire nouvelle : {pattern}',
  endSession: 'Terminer la session',
  furiganaAll: 'Afficher les furigana sur les mots connus',
  tapToAsk: 'touchez un mot pour poser une question',
  tapToLookUp: 'touchez un mot pour le chercher',
  tapToAskFirst: 'Touchez un mot pour poser une question',
  tapToLookUpFirst: 'Touchez un mot pour le chercher',
  playSentence: 'Écouter la phrase',
  inDictionary: '{word} dans le dictionnaire',
  notInDictionary: 'Absent du dictionnaire.',
} satisfies Messages['read'];
