/** French texts for N3 units 34–36 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N3_C: ById<UnitText> = {
  souvenirs: {
    theme: 'Les souvenirs pour le bureau',
    summary:
      'De retour de voyage, on rapporte des douceurs emballées individuellement pour chaque collègue, pour remercier de la relève.',
    sentences: [
      'Au Japon, beaucoup de gens rapportent des souvenirs non seulement pour leur famille et leurs amis, mais aussi pour leurs collègues.',
      'Ce serait une façon de remercier pour le dérangement causé pendant leur absence.',
      'Pour le bureau, les douceurs emballées individuellement sont appréciées.',
      'C’est parce qu’on peut les distribuer à tout le monde de façon égale.',
      'Les produits en édition limitée, vendus seulement dans la région, se vendent bien aussi.',
      'Les aéroports et les gares sont bordés de boutiques de douceurs locales, ce qui permet d’en acheter à la hâte avant de partir.',
      'Choisir des souvenirs demande des efforts, mais imaginer le visage ravi de ses collègues en les choisissant fait partie des plaisirs du voyage.',
    ],
    questions: [
      'Ligne 2 : 迷惑をかけたので、そのお礼という気持ちがある, le cadeau remercie les collègues pour le dérangement causé pendant l’absence. Rien ne dit que les collègues en réclament, que les aéroports les vendent bon marché ni qu’une règle l’impose.',
      'La ligne 4 se termine par からだ et donne la raison de la ligne 3 : みんなに同じように配ることができる, chacun peut en recevoir un. La vente locale concerne les produits 限定 (ligne 5), et le goût ou le prix ne sont jamais cités comme raison.',
      'La ligne 5 l’explique : その地方だけで売っている「限定」の商品, des produits vendus seulement dans cette région, introuvables ailleurs. Les aéroports vendent des douceurs locales (ligne 6), mais ce n’est pas le sens de 限定 ici, et le prix n’est pas mentionné.',
    ],
  },
  kimono: {
    theme: 'Porter le kimono',
    summary:
      'Le kimono est désormais réservé aux grandes occasions, et l’obi est si difficile à nouer que la plupart des gens ont besoin d’aide.',
    sentences: [
      'Autrefois, les Japonais portaient le kimono tous les jours, mais aujourd’hui ils ne le portent que les jours spéciaux.',
      'On le porte souvent, par exemple, pour la cérémonie de la majorité, les mariages et le Nouvel An.',
      'Un kimono est difficile à enfiler seul, et nouer l’obi, en particulier, est difficile à bien faire sans entraînement.',
      'Pour ma propre cérémonie de la majorité, j’ai enfin réussi à en mettre un avec l’aide de ma grand-mère.',
      'C’était un kimono que ma grand-mère portait dans sa jeunesse, avec un joli motif floral.',
      'Aujourd’hui, de plus en plus de jeunes et de visiteurs louent un kimono dans les sites touristiques pour se promener en ville.',
      'Les occasions de porter le kimono se raréfient, mais de nouvelles façons d’en profiter voient le jour.',
    ],
    questions: [
      'La ligne 2 énumère les occasions : 成人式や結婚式、お正月など, toutes des jours de fête. La ligne 1 dit que le port quotidien appartient au passé, et le travail ou les voyages ne sont jamais mentionnés.',
      'それ ouvre la ligne 5 et renvoie à la ligne 4 : le kimono que l’auteure a porté pour la cérémonie. La ligne 5 précise ensuite qu’il appartenait à la grand-mère dans sa jeunesse.',
      'Ligne 6 : 観光地で着物をレンタルして町を歩く若者や外国人も増えている, de plus en plus de gens louent un kimono pour se promener dans les lieux touristiques. Le port quotidien appartient au passé (ligne 1), et nouer l’obi seul est difficile (ligne 3).',
    ],
  },
  'packed-lunch': {
    theme: 'Le repas à emporter',
    summary:
      'Un bento japonais est pensé pour ses couleurs autant que pour sa valeur nutritive, et assaisonné pour rester bon froid.',
    sentences: [
      'Au Japon, beaucoup de gens emportent à l’école ou au travail une boîte-repas faite maison.',
      'Le riz et plusieurs accompagnements sont rangés soigneusement dans une petite boîte.',
      'Un bento japonais est préparé en pensant aux couleurs autant qu’à l’équilibre alimentaire.',
      'Par exemple, des tomates rouges ou de l’œuf jaune le rendent plus éclatant.',
      'On utilise aussi des astuces, comme assaisonner un peu plus fort, pour que les plats restent bons même froids.',
      'Certains parents préparent à leurs enfants des repas en forme de personnages d’anime.',
      'Se lever tôt pour le préparer est pénible, mais c’est moins cher que de manger dehors, donc cela permet aussi d’économiser.',
    ],
    questions: [
      'La ligne 3 nomme directement le 特徴 : 栄養のバランスだけでなく、色もよく考えて作る, on pense à la fois à la nutrition et aux couleurs. La ligne 2 parle de plusieurs accompagnements dans une petite boîte, donc le premier choix dit le contraire.',
      'Ligne 5 : 冷めてもおいしく食べられるように, pour que ce soit encore bon une fois froid. L’éclat vient des couleurs (ligne 4), les formes de personnages sont pour les enfants (ligne 6), et l’économie est une raison de préparer un bento (ligne 7), pas de l’assaisonner.',
      'Ligne 7 : 外で食べるより安いので、節約にもなる, c’est moins cher que de manger dehors, donc on économise. La même ligne dit qu’il est pénible de se lever tôt pour le préparer : ce n’est ni facile ni l’occasion de dormir plus.',
    ],
  },
};
