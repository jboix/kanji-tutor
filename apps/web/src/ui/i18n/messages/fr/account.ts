/** French messages: logging in to bring progress from another device (cloud saves). */
import type { Messages } from '../../types.ts';

export const account = {
  logInTitle: 'Se connecter',
  logInLead: 'Reprenez la progression enregistrée sur un autre appareil.',
  linkPhone: 'Lier depuis votre téléphone',
  linkPhoneDetail: 'Scannez un code avec l’appareil qui a votre progression',
  passkey: 'Utiliser une clé d’accès',
  passkeyDetail: 'Face ID, Windows Hello ou votre gestionnaire de mots de passe',
  emailCode: 'Recevoir un code par e-mail',
  emailCodeDetail: 'Si vous n’avez plus l’autre appareil',
  notYet:
    'Les sauvegardes en ligne ne sont pas encore disponibles. Choisissez Commencer pour l’instant ; votre progression reste sur cet appareil.',
  backToWelcome: 'Retour à l’accueil',
} satisfies Messages['account'];
