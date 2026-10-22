/** French texts for the case particles (N9). Written for this app. */
import type { ById, FunctionWordText } from '../../content-types.ts';

export const FR_PARTICLES_A: ById<FunctionWordText> = {
  'particle-ga': {
    meaning: 'marqueur du sujet',
    explanation:
      'が marque qui ou quoi fait quelque chose, ou ce dont parle la phrase quand c’est une information nouvelle. Il répond à « qui ? » ou « quoi ? ».',
    uses: [
      { use: 'Le sujet, souvent une information nouvelle', translation: 'Il pleut.' },
      { use: 'Ce qui existe, avec ある et いる', translation: 'Il y a un chien dans le parc.' },
      { use: 'Ce qu’on aime, veut ou comprend', translation: 'J’aime les chats.' },
      { use: 'Qui, dans une question et sa réponse', translation: 'Qui est venu ?' },
    ],
  },
  'particle-wa': {
    meaning: 'marqueur du thème : quant à',
    explanation:
      'は pose le thème : ce dont parle le reste de la phrase. Il se lit わ. Le thème est généralement déjà connu.',
    uses: [
      { use: 'Le thème de la phrase', translation: 'Je suis étudiant.' },
      {
        use: 'Le contraste avec autre chose',
        translation: 'Je mange de la viande, mais pas de poisson.',
      },
      {
        use: 'Après une autre particule, pour en faire le thème',
        translation: 'Au Japon, les voitures roulent à gauche.',
      },
    ],
  },
  'particle-wo': {
    meaning: 'marqueur du complément d’objet',
    explanation:
      'を marque la chose sur laquelle porte une action. Il se lit お. Avec les verbes de mouvement, il marque le lieu qu’on traverse ou qu’on quitte.',
    uses: [
      { use: 'Le complément d’objet d’un verbe', translation: 'Je bois du café tous les matins.' },
      { use: 'Le lieu que l’on parcourt', translation: 'Je me suis promené dans le parc.' },
      { use: 'Le lieu que l’on quitte', translation: 'Je pars de chez moi à huit heures.' },
    ],
  },
  'particle-ni': {
    meaning: 'à, dans, vers (un point)',
    explanation:
      'に désigne un point précis : un moment, le lieu où se trouve une chose, une destination, ou la personne qui reçoit quelque chose. Le contexte indique lequel.',
    uses: [
      { use: 'Un moment précis', translation: 'Je me lève à sept heures.' },
      {
        use: 'Où se trouve une chose, avec ある et いる',
        translation: 'Il y a un livre sur le bureau.',
      },
      { use: 'Une destination', translation: 'Je vais à Kyoto la semaine prochaine.' },
      { use: 'Qui reçoit ou à qui l’on demande', translation: 'J’ai écrit une lettre à un ami.' },
    ],
  },
  'particle-de': {
    meaning: 'à, dans, en, avec',
    explanation:
      'で marque le lieu où se déroule une action, ou son moyen ou sa cause. Contrairement à に, le lieu avec で est celui où l’on fait quelque chose, pas celui où une chose se trouve.',
    uses: [
      { use: 'Le lieu d’une action', translation: 'J’étudie à la bibliothèque.' },
      { use: 'Un moyen ou un outil', translation: 'Je vais à l’école en bus.' },
      { use: 'Une cause', translation: 'J’ai manqué le travail à cause d’un rhume.' },
      { use: 'Un ensemble ou un groupe', translation: 'C’est le plus grand de la classe.' },
    ],
  },
  'particle-to': {
    meaning: 'et, avec ; citation',
    explanation:
      'と entre des noms les énumère tous (« A et B »). Après une personne, il signifie « avec ». Après des mots ou une phrase, il les cite.',
    uses: [
      { use: 'Et, en citant tous les éléments', translation: 'J’ai acheté du pain et des œufs.' },
      { use: 'Avec quelqu’un', translation: 'Je suis allé faire des courses avec ma mère.' },
      {
        use: 'Citer ce qui a été dit ou pensé',
        translation: 'La professeure a dit qu’elle serait absente demain.',
      },
    ],
  },
  'particle-mo': {
    meaning: 'aussi ; même',
    explanation:
      'も remplace は, が ou を pour dire « aussi ». Après une quantité, il souligne son importance, et avec un mot interrogatif et un négatif, il signifie « aucun ».',
    uses: [
      { use: 'Aussi', translation: 'J’y vais aussi.' },
      {
        use: 'Jusqu’à, pour souligner une quantité',
        translation: 'J’ai attendu trois bonnes heures.',
      },
      {
        use: 'Aucun, avec un mot interrogatif',
        translation: 'Je n’ai rien mangé aujourd’hui.',
      },
    ],
  },
  'particle-no': {
    meaning: 'de (appartenance)',
    explanation:
      'の relie deux noms : le premier décrit ou possède le second. Après un verbe, il transforme la proposition en nom.',
    uses: [
      { use: 'À qui', translation: 'C’est le sac de ma sœur.' },
      { use: 'Quel genre', translation: 'J’ai rencontré le professeur de japonais.' },
      { use: 'Où ou quand', translation: 'J’attends devant la gare.' },
      { use: 'Transformer un verbe en nom', translation: 'J’aime lire des livres.' },
    ],
  },
  'particle-e': {
    meaning: 'vers, en direction de',
    explanation:
      'へ marque la direction d’un mouvement. Il se lit え. Proche de に pour les destinations, il met davantage l’accent sur le trajet.',
    uses: [
      {
        use: 'La direction d’un mouvement',
        translation: 'Je vais à Hokkaido pendant les vacances d’été.',
      },
      {
        use: 'Le destinataire d’une lettre ou d’un cadeau, sous la forme への',
        translation: 'J’ai écrit une lettre à ma mère.',
      },
    ],
  },
  'particle-kara-from': {
    meaning: 'de, depuis, à partir de',
    explanation:
      'から après un nom marque où ou quand quelque chose commence, ou de qui vient une chose. Après une phrase, il signifie plutôt « parce que ».',
    uses: [
      { use: 'Un lieu de départ', translation: 'C’est à dix minutes à pied de la gare.' },
      { use: 'Un moment de départ', translation: 'Le cours commence à neuf heures.' },
      { use: 'De qui cela vient', translation: 'J’ai reçu un e-mail d’un ami.' },
    ],
  },
  'particle-kara-because': {
    meaning: 'parce que, donc',
    explanation:
      'から après une phrase donne la raison de ce qui suit. Il paraît direct et personnel.',
    uses: [
      {
        use: 'Une raison, avant le résultat',
        translation: 'Il fait froid, donc je ferme la fenêtre.',
      },
      {
        use: 'Une raison donnée après coup, avec です',
        translation: 'Je n’irai pas. Je suis occupé.',
      },
    ],
  },
  'particle-made': {
    meaning: 'jusqu’à',
    explanation:
      'まで marque un point d’arrivée dans le temps ou l’espace. Avec から, il donne les deux bornes : 九時から五時まで.',
    uses: [
      { use: 'Jusqu’à un moment', translation: 'Je travaille jusqu’à cinq heures.' },
      { use: 'Jusqu’à un lieu', translation: 'Je vais vous raccompagner jusqu’à la gare.' },
      { use: 'Même, pour un extrême', translation: 'Même les enfants le savent.' },
    ],
  },
};
