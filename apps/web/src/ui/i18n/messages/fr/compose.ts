/** French messages: compose (Use it, A6). Plain, never praise. */
import type { Messages } from '../../types.ts';

export const compose = {
  title: 'Employer',
  titleCount: 'Employer · grammaire {position} sur {total}',
  meaningQuoted: '« {meaning} »',
  prompt: 'Dites quelque chose de vrai sur vous avec ce point.',
  saved: 'Enregistrée dans vos phrases.',
  errorOffline:
    'Les corrections demandent une connexion. Votre phrase est gardée ici comme brouillon.',
  errorNoKey:
    'Ajoutez une clé Gemini dans les Réglages pour obtenir des corrections. Votre phrase est gardée comme brouillon.',
  errorRateLimit:
    'Gemini signale trop de requêtes. Réessayez dans une minute ; votre brouillon est gardé.',
  errorSave: 'La phrase n’a pas pu être enregistrée. Réessayez.',
  errorOther: 'Pas de correction pour le moment. Votre brouillon est gardé ; réessayez.',
  openSettings: 'Ouvrir les Réglages',
  check: 'Vérifier',
  checking: 'Vérification…',
  rewrite: 'Réécrire',
  accept: 'Accepter les corrections',
  acceptHint: 'Votre phrase corrigée rejoint vos révisions',
  addLead:
    'Ajoutez un point de grammaire de votre leçon pour écrire une phrase avec. Les points de vos captures apparaissent aussi ici.',
  pattern: 'Structure',
  meaning: 'Sens',
  meaningPlaceholder: 'Ce n’est pas que…',
  lesson: 'Leçon',
  addPoint: 'Ajouter le point de grammaire',
  yourSentence: 'Votre phrase',
  dictate: 'Dicter votre phrase',
  placeholder: 'Tapez ou dictez en japonais',
  instead: 'À la place : ',
  styleNote: 'Note de style',
  correction: 'Correction',
  markedLabel: 'Votre phrase, corrigée par le tuteur',
  unverified: 'Lectures de ces notes que le dictionnaire n’a pas pu confirmer : ',
  unverifiedEnd: 'Cette phrase reste hors des séances de lecture.',
  notTarget: 'Cette phrase n’emploie pas encore {pattern} ; elle ne compte donc pas.',
} satisfies Messages['compose'];
