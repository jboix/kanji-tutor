/** French texts for N4 units 14–16 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N4_A: ById<UnitText> = {
  'hot-springs': {
    theme: 'Une nuit dans une source chaude',
    summary:
      'Les auberges thermales ont leur propre étiquette : se laver d’abord, garder la serviette hors de l’eau.',
    sentences: [
      'Le mois dernier, je suis allé pour la première fois dans une source chaude avec ma famille.',
      'Nous avons logé dans une vieille auberge à la montagne et dîné le soir en yukata.',
      'Les sources chaudes japonaises ont quelques règles.',
      'D’abord, il faut bien se laver avant d’entrer dans le bain.',
      'Ensuite, il ne faut pas mettre sa serviette dans l’eau.',
      'Certaines sources chaudes refusent les personnes tatouées.',
      'Depuis le bain en plein air, on voyait les montagnes, et c’était merveilleux.',
      'Si vous venez au Japon, essayez absolument une source chaude au moins une fois.',
    ],
    questions: [
      'Ligne 4 : 入る前に、体をよく洗わなければなりません, on se lave donc à l’avance (〜ておく). Le yukata et le dîner font partie du séjour à l’auberge, ce ne sont pas des règles du bain, et la serviette doit rester hors de l’eau.',
      'Ligne 5 : タオルをおんせんの中に入れてはいけません : la serviette ne doit pas aller dans l’eau (おゆ). Le bain en plein air et la vue sont ce que l’auteur a apprécié, et le dîner en yukata faisait partie du séjour à l’auberge.',
      'À la ligne 7, 気持ちがいい décrit la sensation du bain : agréable et relaxante, l’auteur a donc pu se détendre et en était content. Rien ne dit que l’eau était trop chaude ni l’endroit bruyant, et la vue était visible (見えて), la dernière option dit donc le contraire du texte.',
    ],
  },
  'summer-festival': {
    theme: 'La fête d’été du quartier',
    summary:
      'Chaque quartier a sa fête : stands de nourriture, sanctuaire portatif, tambours et feux d’artifice.',
    sentences: [
      'Ma ville a une fête chaque année en août.',
      'Les jours de fête, les rues sont bordées de stands de nourriture.',
      'Les enfants portent un yukata, achètent à manger aux stands et jouent.',
      'L’après-midi, les gens du quartier portent le sanctuaire portatif dans les rues.',
      'Le sanctuaire est très lourd, alors une vingtaine de personnes le portent.',
      'Le soir, il y a la danse de bon ; quand le tambour résonne, tout le monde danse en suivant son rythme.',
      'Quand le grand feu d’artifice éclate à la fin, la fête est terminée.',
      'L’an dernier, on m’a laissé aider à porter le sanctuaire, moi aussi.',
    ],
    questions: [
      'Ligne 5 : みこしはとても重いので、二十人ぐらいでかつぎます : une vingtaine de personnes, beaucoup de monde ensemble. Il est trop lourd pour une seule personne, il se porte sur les épaules et non en voiture, et les enfants sont occupés aux stands pendant que les adultes le portent.',
      'その renvoie, dans la ligne 6, à たいこが鳴ると : les danseurs bougent au son du tambour. Le feu d’artifice ne vient qu’à la fin.',
      'Ligne 7 : 最後に大きい花火が上がると、お祭りは終わりです. La danse et le sanctuaire ont lieu plus tôt dans la journée.',
    ],
  },
  'sorting-rubbish': {
    theme: 'Trier les déchets',
    summary:
      'Les déchets se trient par type et ne se sortent que le jour prévu ; les voisins remarquent quand on se trompe.',
    sentences: [
      'Au Japon, il faut trier ses déchets quand on les jette.',
      'On les sort séparés en combustibles, non combustibles, canettes, bouteilles, etc.',
      'Le jour de collecte de chaque type est fixé, lui aussi.',
      'Dans ma ville, les déchets combustibles se sortent le lundi et le jeudi.',
      'Les canettes et les bouteilles sont recyclées, il vaut donc mieux les rincer avant de les sortir.',
      'Quand je venais d’arriver au Japon, j’ai sorti mes déchets le mauvais jour.',
      'Une voisine m’a alors gentiment expliqué les règles.',
      'Maintenant, je suis tout à fait habitué au tri.',
    ],
    questions: [
      'Ligne 4 : もえるゴミは月曜日と木曜日に出します, le lundi et le jeudi, soit deux fois par semaine. La ligne 3 ajoute que chaque type de déchet a ses jours fixes, donc pas tous les jours.',
      'La ligne 5 donne la raison avec ので : しげんになる, elles deviennent une ressource, elles seront donc utilisées de nouveau. Les canettes ne sont pas des déchets combustibles, la voisine ne s’est jamais fâchée, et les jours fixes sont une autre règle.',
      'Ligne 7 : 近所の人が親切に教えてくれました : 親切に veut dire gentiment (やさしく). Personne ne s’est fâché, n’a rapporté les déchets ni ne s’est tu ; la voisine a expliqué les règles.',
    ],
  },
};
