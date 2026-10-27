/** French messages: In the wild, a photo of Japanese out in the world read by the tutor. */
import type { Messages } from '../../types.ts';

export const wild = {
  title: 'Sur le vif',
  intro:
    'Photographiez un panneau, un menu ou une étiquette. Le tuteur le lit, et vous voyez quels kanji vous connaissez déjà.',
  takePhoto: 'Prendre une photo',
  choosePhoto: 'Choisir une photo',
  read: 'Lire cette photo',
  reading: 'Lecture de la photo…',
  photoLabel: 'Votre photo, ses kanji entourés',
  summary: 'Vous pouvez lire {known} des {total} kanji ici.',
  summaryNone: 'Aucun kanji trouvé sur cette photo.',
  keyKnown: 'Ceux que vous connaissez',
  keyNew: 'Nouveaux pour vous',
  yours: 'Déjà à vous',
  fresh: 'Nouveaux pour vous',
  add: 'Ajouter',
  added: 'Ajouté',
  addAll: 'Tout ajouter ({n})',
  addLabel: 'Ajouter {word} à vos mots',
  checked: 'Lecture vérifiée',
  unchecked: 'Lecture pas encore vérifiée',
  more: 'Et aussi :',
  tutorLabel: 'Ce que le tuteur a lu',
  another: 'Une autre photo',
  note: 'Utilise l’IA · une requête par photo',
  tutorAsk: 'Que dit ce panneau ?',
  tutorAbout: 'cette photo',
  notWord: 'Absent du dictionnaire, il ne peut pas être ajouté',
} satisfies Messages['wild'];
