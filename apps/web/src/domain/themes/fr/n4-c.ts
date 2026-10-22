/** French texts for N4 units 20–22 (N9). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N4_C: ById<UnitText> = {
  'table-manners': {
    theme: 'La cuisine japonaise et les manières à table',
    summary:
      'Les repas commencent et finissent par des formules de remerciement, et les baguettes obéissent à quelques règles strictes.',
    sentences: [
      'Les Japonais disent « itadakimasu » avant de manger et « gochisōsama deshita » après.',
      'Cela veut dire remercier les personnes qui ont préparé le repas, et la nourriture elle-même.',
      'Il y a quelques points auxquels il faut faire attention quand on mange japonais.',
      'Par exemple, on tient son bol de riz à la main pour manger.',
      'Planter ses baguettes dans la nourriture ou passer de la nourriture de baguettes à baguettes est impoli.',
      'De plus, on n’utilise pas de cuillère pour la soupe miso.',
      'C’était difficile au début, mais maintenant je sais bien me servir des baguettes.',
    ],
    questions: [
      'これ, à la ligne 2, renvoie aux deux formules de la ligne 1, les salutations dites avant et après le repas. La ligne 2 explique ensuite leur sens ; la cuisine japonaise et les baguettes ne viennent que plus tard.',
      'Ligne 5 : 箸を食べ物にさしたり…するのは失礼です. Tenir le bol et boire la soupe sans cuillère sont les bonnes manières.',
      'Ligne 6 : みそしるを飲むときは、スプーンを使いません.',
    ],
  },
  'shrines-and-temples': {
    theme: 'Sanctuaires et temples',
    summary:
      'Sanctuaires shintō et temples bouddhiques se côtoient, et chacun a sa propre façon de prier.',
    sentences: [
      'Le Japon compte beaucoup de sanctuaires et de temples, mais ce sont deux choses différentes.',
      'Le sanctuaire appartient au shintō et a un torii rouge à l’entrée.',
      'Le temple appartient au bouddhisme.',
      'Quand on prie dans un sanctuaire, on dépose d’abord une petite pièce et on fait sonner la cloche.',
      'Ensuite, on s’incline deux fois, on frappe deux fois dans ses mains et on fait son vœu.',
      'Au temple, on ne frappe pas dans ses mains ; on les joint en silence.',
      'Au sanctuaire, on peut aussi acheter un porte-bonheur.',
    ],
    questions: [
      'Ligne 2 : 入口に赤いとりいがあります. La cloche se trouve là où l’on prie, et les porte-bonheur se vendent à l’intérieur.',
      'La ligne 4 commence par まず, « d’abord » : 小さいお金を入れて, on met un peu d’argent. S’incliner et frapper dans ses mains viennent après, à la ligne 5.',
      'Ligne 6 : お寺では手をたたかないで : on ne frappe pas dans ses mains (手を鳴らす) au temple. On frappe dans ses mains au sanctuaire ; au temple, on joint les mains en silence.',
    ],
  },
  'japanese-school': {
    theme: 'Une école japonaise',
    summary:
      'Les élèves nettoient eux-mêmes leur classe, se servent le déjeuner entre eux et restent tard pour les activités de club.',
    sentences: [
      'L’année scolaire japonaise commence en avril.',
      'Au collège et au lycée, la plupart des élèves vont à l’école en uniforme.',
      'Après les cours, les élèves nettoient eux-mêmes les salles de classe et les couloirs.',
      'À l’école primaire, le déjeuner est servi à l’école.',
      'Les élèves de service à la cantine enfilent une blouse blanche et servent le repas à tout le monde.',
      'Après l’école, il y a les clubs, où les élèves font ce qu’ils aiment, comme du sport ou de la musique.',
      'Au collège, j’étais au club de tennis, alors je devais m’entraîner tard tous les jours.',
      'Les familles viennent aussi voir la fête sportive d’automne.',
    ],
    questions: [
      'Ligne 1 : 日本の学校は四月に始まります. C’est en automne qu’a lieu la fête sportive.',
      'Ligne 3 : 生徒たちが自分で教室や廊下を掃除します. 自分で souligne que ce sont les élèves, les enfants eux-mêmes, qui le font : ni les professeurs, ni une entreprise de nettoyage, ni leurs familles.',
      'Ligne 5 : 白い服を着て、みんなに料理を配ります : ils distribuent le repas à tout le monde. Le texte ne dit pas qu’ils le préparent ni qu’ils l’apportent au professeur, et le ménage a lieu après les cours.',
    ],
  },
};
