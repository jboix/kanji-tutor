/** French messages: common words and the English-fallback mark (N9). */
import type { Messages } from '../../types.ts';

export const common = {
  enMark: '(en)',
  inEnglish: 'en anglais',
  back: 'Retour',
  next: 'Suivant',
  close: 'Fermer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  retry: 'Réessayer',
  skip: 'Passer',
  done: 'Terminé',
  loading: 'Chargement',
  errorTitle: 'Un problème est survenu',
  errorBody: 'L’app a rencontré une erreur en ouvrant cet écran. Recharger suffit en général.',
  reload: 'Recharger',
} satisfies Messages['common'];
