/** French messages: answering by voice (I2). */
import type { Messages } from '../../types.ts';

export const voice = {
  prompt: 'Dites le mot souligné à voix haute',
  hint: 'Maintenez pour parler · transcrit tel que vous l’avez dit, sans correction',
  tooShort: 'Maintenez le bouton pendant que vous parlez, puis relâchez.',
  nothingHeard: 'Aucune lecture n’a été entendue. Réessayez, un peu plus près du micro.',
  noRecorder:
    'Ce navigateur ne peut pas enregistrer le son. Vous pouvez taper la lecture à la place.',
  offline: 'Répondre à voix haute demande une connexion. Vous pouvez taper la lecture à la place.',
  noKey:
    'Répondre à voix haute demande une clé Gemini, à ajouter dans les Réglages. Vous pouvez taper la lecture à la place.',
  rateLimit: 'Trop de requêtes pour l’instant. Réessayez dans une minute, ou tapez la lecture.',
  invalid: 'Impossible de transcrire cela en kana. Réessayez, ou tapez la lecture.',
  provider: 'La transcription n’a pas fonctionné cette fois. Réessayez, ou tapez la lecture.',
  failed: 'Un problème est survenu. Réessayez.',
  starting: 'Démarrage du micro…',
  recording: 'À l’écoute… relâchez quand vous l’avez dit',
  transcribing: 'Transcription de ce que vous avez dit…',
  typeReadingInstead: 'Taper la lecture à la place',
  sentToTutor: 'Chaque réponse est envoyée au tuteur',
  hold: 'Maintenir pour parler',
  typeInstead: 'Taper à la place',
} satisfies Messages['voice'];
