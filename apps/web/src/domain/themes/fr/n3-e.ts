/** French texts for N3 units 40–41 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N3_E: ById<UnitText> = {
  'entrance-exams': {
    theme: 'Les concours d’entrée et les cours du soir',
    summary:
      'Entrer dans un bon lycée ou une bonne université passe par des examens, et beaucoup d’élèves étudient tard en cours du soir.',
    sentences: [
      'Au Japon, il faut réussir un examen d’entrée pour intégrer un lycée ou une université.',
      'La concurrence pour les établissements prisés est rude, donc beaucoup d’élèves vont en cours du soir après l’école.',
      'Aux cours du soir, on étudie parfois jusqu’à dix heures, et pour les parents le coût est aussi un vrai problème.',
      'En dernière année de lycée, j’allais moi aussi aux cours du soir quatre jours par semaine.',
      'Mes notes ne montaient pas, et j’étais parfois inquiet.',
      'Mais grâce à mon professeur des cours du soir, qui m’a dit « l’effort finit toujours par payer », j’ai tenu jusqu’au bout.',
      'Et au printemps, quand j’ai été admis à l’université que je voulais, j’étais vraiment heureux.',
    ],
    questions: [
      'La ligne 2 donne la raison avec ので : 人気のある学校は競争が激しい, la concurrence rend les écoles prisées difficiles d’accès. Le coût est un problème pour les parents (ligne 3) ; ce n’est pas bon marché, et rien ne dit qu’il n’y a pas de cours ni que les parents y travaillent.',
      'Ligne 3 : 親にとっては費用も大きな問題だ.',
      'Ligne 4 : 週に四日じゅくに通っていた.',
      'Ligne 6 : 先生が「努力は必ず結果になる」と言ってくれたおかげで. La ligne 5 dit que les notes ne montaient pas facilement, donc le premier choix est faux.',
    ],
  },
  'rush-hour': {
    theme: 'Le train à l’heure de pointe',
    summary:
      'À huit heures du matin, les trains de Tokyo sont si pleins que le personnel pousse les passagers, même si le télétravail a allégé la cohue.',
    sentences: [
      'Le matin, les trains de Tokyo se remplissent de personnes allant au travail.',
      'Vers huit heures surtout, ils sont bondés, et il arrive que le personnel de la gare pousse les passagers à l’intérieur.',
      'Beaucoup de ceux qui travaillent à Tokyo vivent en banlieue, et bon nombre font plus d’une heure de trajet dans chaque sens.',
      'Prendre un train bondé tous les jours est pénible, donc certains partent de chez eux un peu plus tôt pour éviter la foule.',
      'Certaines entreprises ont aussi un système qui permet au personnel de choisir son heure d’arrivée.',
      'Récemment, grâce à l’augmentation du travail à domicile, les trains seraient moins bondés qu’avant.',
      'Si notre façon de travailler change, le train du matin continuera sans doute de changer lui aussi.',
    ],
    questions: [
      'Ligne 2 : 駅員が乗客を押して電車に乗せることもある, certains voyageurs sont donc poussés dans le train par le personnel. Les trains sont bondés, donc le premier choix dit le contraire, et rien ne dit que les trains ne viennent pas.',
      'Ligne 4 : 少し早く家を出て混雑を避ける人もいる, certains partent de chez eux un peu plus tôt. L’heure dans chaque sens de la ligne 3 est le trajet en train, pas à pied, et il n’est jamais question de déménager ni de prendre la voiture.',
      'Ligne 6 : 家で仕事をする人が増えたおかげで, davantage de gens travaillent chez eux au lieu d’aller au bureau. おかげで marque la cause d’un résultat favorable ; plus de trains, moins d’habitants en banlieue ou plus de personnel ne sont jamais mentionnés.',
    ],
  },
};
