/** French messages: cloud saves, logging in to them, and Settings → Cloud saves. */
import type { Messages } from '../../types.ts';

export const account = {
  logInTitle: 'Se connecter',
  logInLead: 'Reprenez la progression enregistrée sur un autre appareil.',
  linkPhone: 'Lier depuis votre téléphone',
  linkPhoneDetail: 'Tapez un code sur l’appareil qui a votre progression',
  passkey: 'Utiliser une clé d’accès',
  passkeyDetail: 'Face ID, Windows Hello ou votre gestionnaire de mots de passe',
  emailCode: 'Recevoir un code par e-mail',
  emailCodeDetail: 'Si vous n’avez plus l’autre appareil',
  backToWelcome: 'Retour à l’accueil',
  otherWays: 'Autres façons de se connecter',
  bringing: 'Récupération de votre progression…',

  linkSteps:
    'Sur l’appareil qui a votre progression, ouvrez Réglages → Sauvegardes en ligne → Lier un appareil, et tapez ce code. Il est valable deux minutes.',
  linkWaiting: 'En attente de l’autre appareil…',
  linkNewCode: 'Nouveau code',
  passkeyButton: 'Utiliser ma clé d’accès',
  passkeyWaiting: 'En attente de votre clé d’accès…',
  emailLabel: 'Votre e-mail de récupération',
  emailSend: 'Envoyer le code',
  emailSent:
    'Si un compte a cette adresse, un code à 6 chiffres est en route. Il est valable 10 minutes.',
  codeLabel: 'Code reçu par e-mail',
  codeSubmit: 'Se connecter',

  joinTitle: 'Activer les sauvegardes en ligne',
  joinLead:
    'Votre progression est gardée sur le serveur de Kanji Tutor, chiffrée, et reste à jour sur chaque appareil où vous vous connectez. Vous vous connectez avec une clé d’accès : il n’y a pas de mot de passe.',
  inviteLabel: 'Code d’invitation',
  joinButton: 'Créer une clé d’accès et activer',
  joinDone: 'Les sauvegardes en ligne sont activées, et votre progression est enregistrée.',
  joinContinue: 'Continuer',
  joinAlready: 'Les sauvegardes en ligne sont déjà activées sur cet appareil.',

  cloudTitle: 'Sauvegardes en ligne',
  cloudDetail: 'Votre progression sur chaque appareil',
  cloudOff:
    'Désactivées sur cet appareil. Avec une invitation, votre progression est enregistrée en ligne et reste à jour sur vos autres appareils.',
  cloudTurnOn: 'Activer',
  cloudLogIn: 'Me connecter plutôt',
  cloudLogInHint:
    'Se connecter récupère la progression enregistrée en ligne ; ce qui n’est que sur cet appareil est gardé aussi.',
  statusSaved: 'Enregistré à {time}.',
  statusUpToDate: 'À jour.',
  statusWaiting: 'Modifications en attente : elles sont enregistrées dans un instant.',
  statusSaving: 'Enregistrement…',
  statusOffline: 'Hors ligne : vos modifications seront enregistrées au retour de la connexion.',
  statusPaused:
    'Beaucoup d’enregistrements cette heure-ci : le prochain part dans quelques minutes.',
  statusFailed: 'Le dernier enregistrement n’a pas abouti. Il réessaie tout seul.',
  saveNow: 'Enregistrer maintenant',

  devicesTitle: 'Appareils',
  deviceThis: 'Cet appareil',
  deviceSeen: 'Utilisé le {date}',
  deviceRemove: 'Déconnecter',
  deviceRemoveQuestion:
    'Déconnecter « {name} » ? Il garde sa progression, mais n’enregistre plus rien avant de se reconnecter.',
  linkTitle: 'Lier un appareil',
  linkHint:
    'Sur le nouvel appareil, choisissez Se connecter, puis Lier depuis votre téléphone, et tapez ici le code qu’il affiche.',
  linkCodeLabel: 'Code du nouvel appareil',
  linkLookUp: 'Suivant',
  linkAsk: '« {name} » demande à utiliser votre progression.',
  linkApprove: 'L’accepter',
  linkApproved: 'Lié : « {name} » récupère votre progression.',

  emailTitle: 'E-mail de récupération',
  emailNone:
    'Aucun pour l’instant. Avec un e-mail, vous pouvez vous connecter avec un code si vous perdez vos appareils.',
  emailCurrent: 'Les codes vont à {email}.',
  emailNew: 'Adresse e-mail',
  emailSendCode: 'Envoyer un code',
  emailCodeSent: 'Un code est en route vers {email}.',
  emailConfirm: 'Confirmer',
  emailSaved: 'Enregistré : les codes vont maintenant à {email}.',

  passkeyTitle: 'Clé d’accès',
  passkeyHint:
    'Ajoutez une clé d’accès sur cet appareil, pour vous connecter avec Face ID, Windows Hello ou votre gestionnaire de mots de passe.',
  passkeyAdd: 'Ajouter une clé d’accès',
  passkeyAdded: 'Clé d’accès ajoutée.',

  thisDeviceTitle: 'Sur cet appareil',
  logOut: 'Se déconnecter',
  logOutQuestion:
    'Se déconnecter sur cet appareil ? Sa progression reste ici ; il cesse seulement d’enregistrer en ligne.',
  loggedOut: 'Déconnecté. Votre progression reste sur cet appareil.',
  deleteAccount: 'Supprimer le compte en ligne',
  deleteQuestion:
    'Supprimer votre compte en ligne et sa sauvegarde ? Chaque appareil garde sa progression, mais plus rien n’est enregistré en ligne. C’est définitif.',
  deleteConfirm: 'Supprimer',
  cancel: 'Annuler',

  errorOffline: 'Pas de connexion. Réessayez une fois en ligne.',
  errorServer: 'Le serveur n’a pas répondu comme prévu. Réessayez dans un instant.',
  errorSignedOut: 'Cet appareil a été déconnecté. Reconnectez-vous.',
  errorInviteNeeded:
    'Ce code d’invitation ne fonctionne pas : il est peut-être utilisé ou révoqué.',
  errorPasskeyCancelled: 'La clé d’accès n’a pas été utilisée. Réessayez quand vous voulez.',
  errorPasskeyRefused: 'La clé d’accès n’a pas fonctionné ici. Essayez une autre façon.',
  errorPasskeyUnknown: 'Cette clé d’accès n’appartient à aucun compte Kanji Tutor.',
  errorChallengeExpired: 'Cela a pris trop de temps. Réessayez.',
  errorCodeExpired: 'Ce code a expiré. Demandez-en un nouveau.',
  errorCodeUsed: 'Ce code a déjà été utilisé.',
  errorCodeWrong: 'Ce code n’est pas le bon. Vérifiez-le et réessayez.',
  errorEmailOff: 'Les codes par e-mail ne sont pas configurés sur ce serveur.',
  errorEmailFailed: 'L’e-mail n’a pas pu être envoyé. Réessayez plus tard.',
  errorEmailTaken: 'Cette adresse appartient à un autre compte.',
  errorTooManyCodes: 'Trop de codes pour cette adresse. Réessayez dans une heure.',
  errorSlowDown: 'Trop d’essais. Attendez une minute, puis réessayez.',
  errorBadRequest: 'Cela ne semble pas correct. Vérifiez ce que vous avez tapé.',
} satisfies Messages['account'];
