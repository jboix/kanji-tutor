/** French texts for N5 units 10–13 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N5_C: ById<UnitText> = {
  'ramen-shop': {
    theme: 'Dans un restaurant de ramen',
    summary:
      'Beaucoup de restaurants de ramen prennent la commande par un distributeur de tickets à l’entrée, et on peut aspirer bruyamment ses nouilles.',
    sentences: [
      'Il y a un restaurant de ramen célèbre près de la gare.',
      'À l’heure du déjeuner, il y a toujours une file de gens devant le restaurant.',
      'Dans ce restaurant, on achète un ticket repas au distributeur de l’entrée.',
      'On s’assoit et on donne le ticket au personnel.',
      'On se sert l’eau soi-même.',
      'Les ramen étaient très chauds et délicieux.',
      'Au Japon, on peut manger ses ramen en aspirant bruyamment.',
    ],
    questions: [
      'Ligne 3 : 入口のきかいでチケットを買います, au distributeur de l’entrée. Le personnel ne fait que prendre le ticket (ligne 4) ; il ne le vend pas, et la gare indique seulement où se trouve le restaurant.',
      'Ligne 5 : 水は自分で入れます, on se la sert soi-même : ce sont donc les clients qui se servent l’eau. On ne l’achète pas, et le personnel ne l’apporte pas.',
      'Ligne 2 : 店の前にいつも人が並んでいます, il y a toujours une file : beaucoup de gens attendent. Avec une file dehors, le restaurant n’est ni fermé ni vide, et le texte ne place jamais le personnel près du distributeur.',
    ],
  },
  'department-store': {
    theme: 'Faire les courses dans un grand magasin',
    summary:
      'Les grands magasins abritent tout un rayon alimentaire au sous-sol, appelé depachika.',
    sentences: [
      'La semaine prochaine, c’est l’anniversaire de mon père, alors je suis allé dans un grand magasin acheter un cadeau.',
      'Le sous-sol du magasin a un étage alimentaire.',
      'Le rayon des cravates est au cinquième étage, alors j’ai pris l’ascenseur.',
      'Il y avait une cravate bleue et une cravate noire.',
      'La bleue coûtait 3 000 yens et la noire 5 000 yens.',
      'La noire était plus belle, mais un peu chère.',
      'Mon père aime le bleu, alors j’ai acheté la cravate bleue.',
    ],
    questions: [
      'Ligne 1 : 父の誕生日なので、デパートへプレゼントを買いに行きました. L’étage alimentaire est seulement décrit ; l’auteur n’y fait pas d’achats.',
      'Ligne 5 : 黒いのは五千円でした. Trois mille yens, c’est le prix de la cravate bleue.',
      'Ligne 7 : 父は青い色が好きなので. La cravate bleue était aussi moins chère, mais la raison que le texte donne avec ので est la couleur préférée du père.',
    ],
  },
  'cherry-blossoms': {
    theme: 'Admirer les cerisiers en fleur',
    summary:
      'Pendant environ une semaine chaque printemps, amis et collègues pique-niquent sous les cerisiers.',
    sentences: [
      'Vers la fin mars, les cerisiers fleurissent au Japon.',
      'Quand ils fleurissent, beaucoup de gens vont dans les parcs admirer les fleurs.',
      'La semaine dernière, un ami m’a dit : « Si on allait voir les cerisiers samedi ? »',
      'Nous voulions une bonne place, alors nous sommes allés au parc tôt le matin.',
      'Sous un grand cerisier, nous avons mangé nos bentos et pris des photos.',
      'Les fleurs de cerisier ne durent qu’environ une semaine.',
    ],
    questions: [
      'Ligne 1 : 三月の終わりごろ, vers la fin mars, c’est-à-dire juste avant avril. Le début mars est trop tôt, et février et mai ne sont jamais mentionnés.',
      'Ligne 4 : いいばしょがほしかったので, ils voulaient une bonne place pour leur hanami. La courte vie des fleurs est un fait cité à la ligne 6, mais ce n’est pas pour cela qu’ils sont partis tôt, et le texte ne dit rien des fleurs le matin ni du temps libre de l’ami.',
      'La ligne 5 énumère les deux activités avec 〜たり〜たり : お弁当を食べたり、写真を撮ったり, manger des bentos et prendre des photos. Chanter, lire, dormir ou acheter des fleurs n’est jamais mentionné.',
    ],
  },
  weekend: {
    theme: 'Un week-end chez soi et dehors',
    summary:
      'Au Japon, le week-end se partage souvent entre les tâches ménagères le samedi matin et les sorties ensuite.',
    sentences: [
      'Dans mon entreprise, le samedi et le dimanche sont des jours de repos.',
      'Le samedi matin, je fais d’habitude le ménage de ma chambre et la lessive.',
      'L’après-midi, je vais voir des films ou faire du shopping avec des amis.',
      'Mais samedi dernier, il a plu toute la journée.',
      'Je suis resté à la maison, j’ai cuisiné et regardé la télé.',
      'Dimanche, il a fait beau.',
      'L’après-midi, je me suis promené tranquillement dans un parc voisin.',
    ],
    questions: [
      'Ligne 2 : 土曜日の朝は、たいてい部屋の掃除や洗濯をします, le ménage et la lessive, c’est-à-dire les tâches de la maison. Les films, c’est pour l’après-midi, la cuisine, c’était le samedi pluvieux, et la promenade au parc, le dimanche.',
      'La ligne 4 dit qu’il a plu toute la journée, et la ligne 5 montre la conséquence : l’auteur est resté à la maison. Le beau temps est arrivé le dimanche.',
      'Ligne 7 : 近くの公園をゆっくり散歩しました, une promenade tranquille dans un parc voisin : l’auteur a donc marché dehors. La télé, c’était le samedi pluvieux, et le shopping et la lessive sont des activités du samedi.',
    ],
  },
};
