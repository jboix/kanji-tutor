/** French messages: weekly notes (A7). Counts and real examples, never praise. */
import type { Messages } from '../../types.ts';

export const notes = {
  thisWeek: 'Cette semaine',
  counting: 'Calcul de la semaine…',
  letterRegion: 'Lettre sur la semaine',
  aiLetter: 'La lettre du tuteur',
  writing: 'Rédaction de la lettre de la semaine…',
  askLetter: 'Demander au tuteur d’écrire la lettre de la semaine',
  ungrounded:
    'La lettre rédigée citait des éléments absents de vos données ({claims}) ; voici donc la version simple.',
  noKey:
    'Ajoutez une clé Gemini dans les {settings} pour une lettre rédigée. Voici les chiffres simples.',
  settings: 'Réglages',
  offline: 'Vous êtes hors ligne ; voici la lettre simple tirée de vos chiffres.',
  failed: 'Pas de lettre rédigée cette fois ({reason}). Voici les chiffres simples.',
  nothingRead: 'Rien de lu cette semaine pour l’instant.',
  read: {
    one: 'Vous avez lu {n} phrase et trouvé la bonne lecture dans {right}.',
    other: 'Vous avez lu {n} phrases et trouvé la bonne lecture dans {right}.',
  },
  rightNone: 'aucune',
  missOne: 'La seule erreur portait sur {what}.',
  missAll: 'Les {n} erreurs portaient toutes sur {what}.',
  missSome: '{count} erreurs sur {n} portaient sur {what}.',
  missed: '{lead} Erreurs de la semaine : {examples}.',
  missedAs: '{surface} lu {given}',
  manyLongVowel: 'les voyelles longues',
  manySokuon: 'le petit っ',
  manyRendaku: 'les changements de sonorisation',
  manyWrongKanji: 'des kanji semblables',
  manyKanaVariant: 'des variantes de kana',
  manyOther: 'des lectures entièrement fausses, pas un simple écart',
  unusedOne: 'Vous n’avez pas encore employé {first} vous-même.',
  unusedTwo: 'Vous n’avez pas encore employé {first} ni {second} vous-même.',
  keptOn: 'Gardée le {date}',
  keptNotes: 'Notes gardées',
  keptEmpty: 'Les explications que vous gardez pendant une lecture apparaissent ici.',
  deleteNamed: 'Supprimer {title}',
  delete: 'Supprimer',
  deleteAsk: 'Supprimer cette note ?',
  keep: 'Garder',
} satisfies Messages['notes'];
