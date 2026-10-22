/** French texts for the other particles (N9, D53). Written for this app. */
import type { ById, FunctionWordText } from '../../content-types.ts';

export const FR_PARTICLES_B: ById<FunctionWordText> = {
  'particle-ya': {
    meaning: 'et (entre autres)',
    explanation:
      'や cite quelques exemples et sous-entend qu’il y en a d’autres. と cite tous les éléments ; や se termine souvent par など, « etc. ».',
    uses: [
      {
        use: 'Quelques exemples parmi d’autres',
        translation: 'J’ai acheté des pommes, des mandarines, etc.',
      },
      {
        use: 'Avec など à la fin',
        translation: 'Il y a des livres, des stylos et d’autres choses sur le bureau.',
      },
    ],
  },
  'particle-ka': {
    meaning: 'marqueur de question ; ou',
    explanation:
      'か en fin de phrase la transforme en question, sans besoin de point d’interrogation. Entre des noms, il signifie « ou ».',
    uses: [
      { use: 'Une question', translation: 'Tu viens demain ?' },
      { use: 'Ou', translation: 'Je prendrai du thé ou du café.' },
      { use: 'Quelque-, après un mot interrogatif', translation: 'Quelqu’un est venu.' },
    ],
  },
  'particle-ne': {
    meaning: 'n’est-ce pas ?, hein ?',
    explanation:
      'ね en fin de phrase invite l’interlocuteur à approuver ou vérifie une chose que tous deux savent. Il rend le propos plus chaleureux.',
    uses: [
      { use: 'Chercher l’accord', translation: 'Il fait chaud aujourd’hui, n’est-ce pas ?' },
      {
        use: 'Vérifier un détail',
        translation: 'La réunion est à partir de trois heures, c’est ça ?',
      },
    ],
  },
  'particle-yo': {
    meaning: 'je te dis, tu sais',
    explanation:
      'よ en fin de phrase apprend à l’interlocuteur une chose qu’il ignore peut-être, ou appuie un propos. Employé trop souvent, il peut paraître insistant.',
    uses: [
      {
        use: 'Une information nouvelle pour l’interlocuteur',
        translation: 'Ce gâteau est bon, tu sais.',
      },
      { use: 'Insister sur un conseil', translation: 'Tu devrais te coucher tôt.' },
    ],
  },
  'particle-kedo': {
    meaning: 'mais, bien que',
    explanation:
      'けど relie deux propositions au sens de « mais » dans la langue courante. En fin de phrase, il laisse quelque chose en suspens et adoucit une demande.',
    uses: [
      { use: 'Mais', translation: 'C’était cher, mais je l’ai acheté.' },
      {
        use: 'Adoucir, en fin de phrase',
        translation: 'J’aurais voulu vous demander quelque chose…',
      },
    ],
  },
  'particle-ga-but': {
    meaning: 'mais',
    explanation:
      'が après une phrase complète signifie « mais », un peu plus soutenu que けど. Il peut aussi introduire poliment une question.',
    uses: [
      { use: 'Mais', translation: 'Il pleut, mais je sors.' },
      {
        use: 'Une introduction polie',
        translation: 'Je peux vous demander quelque chose ? Où est la gare ?',
      },
    ],
  },
  'particle-yori': {
    meaning: 'que (comparaison)',
    explanation:
      'より marque ce à quoi l’on compare : A は B より… signifie « A est plus … que B ».',
    uses: [
      { use: 'Que, dans une comparaison', translation: 'Le train est plus rapide que le bus.' },
      { use: 'Plutôt que', translation: 'Je préfère le poisson à la viande.' },
    ],
  },
  'particle-shika': {
    meaning: 'seulement (avec un négatif)',
    explanation:
      'しか s’emploie toujours avec un verbe négatif : しか…ない signifie « seulement », en soulignant que c’est moins qu’espéré.',
    uses: [
      {
        use: 'Seulement, et pas assez',
        translation: 'Je n’ai que cent yens dans mon portefeuille.',
      },
      { use: 'Rien que', translation: 'Dimanche, je ne suis pas sorti de chez moi.' },
    ],
  },
  'particle-dake': {
    meaning: 'seulement, juste',
    explanation: 'だけ limite une chose à ce qu’il suit, sans la nuance négative de しか.',
    uses: [
      { use: 'Seulement, juste', translation: 'Juste de l’eau, s’il vous plaît.' },
      { use: 'Seulement, après un verbe', translation: 'Je regarde seulement.' },
    ],
  },
  'particle-node': {
    meaning: 'parce que, comme',
    explanation:
      'ので présente une raison comme un fait. Plus doux que から, il convient aux excuses polies.',
    uses: [
      {
        use: 'Une raison présentée comme un fait',
        translation: 'Il pleut, donc je reste à la maison.',
      },
      {
        use: 'Une excuse polie',
        translation: 'J’ai quelque chose à faire, alors je rentre avant vous.',
      },
    ],
  },
  'particle-noni': {
    meaning: 'bien que, alors que',
    explanation:
      'のに relie deux faits dont le second n’est pas celui qu’on attendait, souvent avec surprise ou regret.',
    uses: [
      {
        use: 'Bien que, contre toute attente',
        translation: 'J’ai pris un médicament, mais j’ai encore mal à la tête.',
      },
      { use: 'Le regret, en fin de phrase', translation: 'Tu aurais dû venir plus tôt.' },
    ],
  },
};
