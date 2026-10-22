/** French texts for N5 units 2–5 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N5_A: ById<UnitText> = {
  'self-introduction': {
    theme: 'Se présenter',
    summary:
      'Au Japon, une courte présentation codifiée ouvre chaque cours, chaque club et chaque nouvel emploi.',
    sentences: [
      'Enchantée.',
      'Je m’appelle Anna.',
      'Je viens des États-Unis.',
      'Je ne suis pas japonaise.',
      'Je suis maintenant étudiante dans une université japonaise.',
      'J’étudie le japonais à l’université.',
      'Ma professeure de japonais est Mme Yamamoto.',
      'Ravie de faire votre connaissance.',
    ],
    questions: [
      'La ligne 3 dit アメリカから来ました, « je viens des États-Unis ». Elle dit qu’elle n’est pas japonaise, et la Chine et la France ne sont jamais mentionnées.',
      'Ligne 5 : 今、日本の大学の学生です, « je suis maintenant étudiante dans une université japonaise », c’est-à-dire 大学生. Elle étudie à l’université, elle n’y enseigne pas : la professeure de japonais est Mme Yamamoto, et aucune entreprise n’est mentionnée.',
      'Ligne 7 : 日本語の先生は山本さんです, « ma professeure de japonais est Yamamoto » : elle est donc le 先生 d’Anna. Le texte ne la présente jamais comme une amie, une étudiante ou une camarade de classe.',
    ],
  },
  family: {
    theme: 'Ma famille',
    summary:
      'Le japonais a deux séries de mots pour la famille : des mots humbles pour sa propre famille, des mots polis pour celle des autres.',
    sentences: [
      'Voici une photo de ma famille.',
      'Nous sommes quatre dans ma famille.',
      'Mon père travaille dans une entreprise.',
      'Ma mère est médecin et travaille dans un hôpital.',
      'Je n’ai pas de grand frère, mais j’ai une petite sœur.',
      'Ma sœur est lycéenne et aime la musique et le dessin.',
      'Et nous avons aussi un chien blanc.',
      'Mes parents habitent maintenant à Osaka.',
    ],
    questions: [
      'Ligne 4 : 母は医者で, « ma mère est médecin ». L’emploi en entreprise est celui du père, et l’élève est la sœur.',
      'Ligne 5 : pas de grand frère, mais une petite sœur (妹が一人います). Quatre, c’est la taille de toute la famille, pas le nombre de frères et sœurs.',
      'これ désigne ce que l’auteur montre : le 写真 nommé dans la même ligne, une photo de la famille. Le chien blanc et les dessins de la sœur viennent dans les lignes suivantes, et l’hôpital est l’endroit où travaille la mère.',
    ],
  },
  'my-day': {
    theme: 'Une journée de ma vie',
    summary:
      'Les longs trajets en train rythment la journée japonaise, du premier train au dernier.',
    sentences: [
      'Je me lève à six heures tous les matins.',
      'Après m’être lavé le visage, je prends le petit déjeuner.',
      'Vers sept heures et demie, je vais à l’université en train.',
      'Dans le train, je lis un livre pendant environ une heure.',
      'Les cours ont lieu de 9 h à 15 h.',
      'Après les cours, je fais mes devoirs à la bibliothèque.',
      'Avant le dîner, je fais une petite promenade.',
      'Le soir, je me couche vers onze heures.',
    ],
    questions: [
      'Ligne 4 : 電車の中で…本を読みます. Les devoirs se font à la bibliothèque, et le petit déjeuner se prend à la maison avant de partir.',
      'Ligne 5 : les cours durent 午前九時から午後三時まで, ils finissent donc à trois heures de l’après-midi. Neuf heures, c’est le début ; sept heures et demie, le train ; onze heures, le coucher.',
      'Ligne 7 : 晩ご飯を食べる前に、少し散歩します. Le lavage du visage a lieu avant le petit déjeuner, pas avant le dîner.',
    ],
  },
  'convenience-store': {
    theme: 'Au konbini',
    summary:
      'Les supérettes japonaises vendent des plats chauds, encaissent des factures et expédient des colis, jour et nuit.',
    sentences: [
      'Il y a une supérette près de chez moi.',
      'Elle est ouverte la nuit aussi, c’est donc très pratique.',
      'Aujourd’hui, j’ai acheté un bento, un onigiri et une boisson.',
      'Le vendeur m’a demandé : « Je vous réchauffe le bento ? »',
      'J’ai répondu : « Oui, s’il vous plaît. »',
      'En tout, ça faisait 800 yens.',
      'Je n’avais pas besoin de sac, alors j’ai tout mis dans mon propre sac.',
    ],
    questions: [
      'Ligne 4 : le vendeur propose お弁当をあたためましょうか et l’auteur accepte. Rien n’est dit sur le fait de réchauffer l’onigiri ou la boisson.',
      'La ligne 2 donne la raison avec ので : 夜もあいているので、とても便利です, le magasin est ouvert aussi la nuit, on peut donc y faire ses courses même le soir. Le texte ne dit rien des prix ni d’une gare, et se passer de sac est le choix de l’auteur à la ligne 7.',
      'Ligne 7 : l’auteur n’a pas besoin du sac du magasin (ふくろはいらない) et met ses achats dans une かばん, son propre sac. Il n’est jamais question de réfrigérateur ni de voiture.',
    ],
  },
};
