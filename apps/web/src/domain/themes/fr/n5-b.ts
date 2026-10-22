/** French texts for N5 units 6–9 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N5_B: ById<UnitText> = {
  'at-the-station': {
    theme: 'À la gare',
    summary:
      'Les grandes gares de Tokyo ont des dizaines de sorties, et le personnel a l’habitude d’indiquer le chemin.',
    sentences: [
      'Samedi, je suis allé à Ueno avec un ami.',
      'La gare de Shinjuku est très grande et a beaucoup de sorties.',
      'Après avoir acheté nos billets, nous avons demandé le chemin à un agent de la gare.',
      'L’agent a dit : « Prenez le train du quai 3, s’il vous plaît. »',
      'Il a aussi dit : « Ensuite, prenez le métro, s’il vous plaît. »',
      'Nous sommes descendus à la gare d’Ueno et sommes sortis par la sortie 1.',
      'Près de la gare, il y avait un grand et beau parc.',
    ],
    questions: [
      'Ligne 6 : 上野駅で降りて, ils sont descendus à Ueno. Ils sont partis de Shinjuku, et Nakano et Meguro ne sont jamais mentionnées.',
      'Ligne 3 : 駅の人に道を聞きました, ils ont demandé le chemin. Ils avaient déjà acheté leurs billets, et le parc n’apparaît qu’à la fin.',
      'Ligne 7 : 駅の近くに大きくてきれいな公園がありました, un grand et beau parc. La grande gare du texte est Shinjuku, pas Ueno, et aucun grand magasin n’est mentionné.',
    ],
  },
  'weather-and-seasons': {
    theme: 'La météo et les quatre saisons',
    summary:
      'Au Japon, on parle sans cesse de la saison, et les pluies de juin ont leur propre nom.',
    sentences: [
      'Le Japon a quatre saisons.',
      'Le printemps est doux, et les cerisiers en fleur sont magnifiques.',
      'En juin, il y a beaucoup de jours de pluie.',
      'Cette saison des pluies s’appelle tsuyu.',
      'L’été est très chaud, mais beaucoup de gens vont à la mer ou à la montagne.',
      'L’automne est frais, et la nourriture est délicieuse.',
      'L’hiver est froid, et il tombe beaucoup de neige à Hokkaidō.',
      'Des quatre saisons, c’est l’automne que je préfère.',
    ],
    questions: [
      'この renvoie à la ligne précédente : 六月には雨の日が多いです. Le mois pluvieux est juin ; les autres mois ne sont jamais mentionnés.',
      'Ligne 7 : 冬は寒くて、北海道では雪がたくさん降ります. La neige appartient à l’hiver.',
      'Dernière ligne : 秋が一番好きです. Le printemps est décrit comme magnifique, mais la saison préférée de l’auteur est l’automne.',
    ],
  },
  'japanese-home': {
    theme: 'Dans une maison japonaise',
    summary:
      'On enlève ses chaussures au genkan, on sort les futons sur les tatamis, et l’eau du bain est partagée.',
    sentences: [
      'Quand on entre dans une maison japonaise, on enlève ses chaussures dans l’entrée.',
      'On ne doit pas entrer dans les pièces avec ses chaussures.',
      'La maison où j’habite est ancienne et a une pièce à tatamis.',
      'Dans la pièce à tatamis, le soir, nous sortons les futons et nous dormons.',
      'La cuisine et la salle de bain sont au rez-de-chaussée, et il y a deux pièces à l’étage.',
      'Toute la famille partage le bain, alors on se lave le corps avant d’y entrer.',
    ],
    questions: [
      'Ligne 1 : 玄関で靴を脱ぎます. La ligne 2 ajoute qu’il est interdit d’entrer dans les pièces avec ses chaussures, on les enlève donc avant.',
      'Ligne 4 : たたみの部屋では、夜、ふとんを出して寝ます, on sort les futons dans la pièce à tatamis. On enlève ses chaussures dans l’entrée, le bain sert à se laver, et personne ne dort dans la cuisine du rez-de-chaussée.',
      'La ligne 6 donne la raison avec ので : お風呂は家族みんなが使う, toute la famille entre dans le même bain. La chaleur de l’eau et la taille du bain ne sont jamais mentionnées, et le bain est au rez-de-chaussée.',
    ],
  },
  'vending-machine': {
    theme: 'Au distributeur automatique',
    summary:
      'Le Japon compte des millions de distributeurs automatiques, et en hiver beaucoup vendent des boissons chaudes en canette.',
    sentences: [
      'Il y a beaucoup de distributeurs automatiques dans les villes japonaises.',
      'On en trouve devant les gares, dans les parcs, et même en montagne.',
      'Ils vendent des boissons froides en été et des boissons chaudes en hiver.',
      'Les boutons bleus sont pour les boissons froides, les boutons rouges pour les chaudes.',
      'Hier, il faisait très froid, alors j’ai acheté un thé chaud.',
      'J’ai mis l’argent et j’ai appuyé sur un bouton rouge.',
      'La canette était très chaude.',
    ],
    questions: [
      'Ligne 4 : 赤いボタンはあたたかい物です, le rouge est pour les boissons chaudes, et la ligne 7 confirme que la canette du bouton rouge était très chaude. Le bleu est pour les boissons froides ; les prix ne sont pas mentionnés.',
      'Ligne 5 : 昨日はとても寒かったので, « parce qu’il faisait très froid hier » : c’était une journée froide. Les prix ne sont jamais mentionnés, et par une journée chaude on prendrait plutôt une boisson froide.',
      'La ligne 2 cite les gares, les parcs et même les montagnes (〜にも、〜にも) : on en trouve donc dans beaucoup d’endroits, pas un seul. Les maisons ne sont pas mentionnées.',
    ],
  },
};
