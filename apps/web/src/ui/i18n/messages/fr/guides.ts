/** French messages: the guides (verb groups, the て-form, plain and polite, adjectives, keigo). */
import type { Messages } from '../../types.ts';

export const guides = {
  title: 'Guides',
  tile: 'Guides',
  tileDetail: 'Groupes de verbes, forme en て, keigo, conjugaison',
  intro:
    'Des références à consulter pendant votre apprentissage. Chaque leçon qui en a besoin y renvoie.',
  back: 'Retour',
  missing: 'Il n’y a pas de guide nommé {id}.',
  levelTag: 'N{level}',
  readGuide: 'Guide : {title}',
  tutorMore: 'Donne-moi d’autres exemples pour {x}',
  tutorQuiz: 'Interroge-moi sur {x}',
  colDict: 'Dictionnaire',
  colMasu: 'ます',
  colNai: 'ない',
  colPlain: 'Neutre',
  colPolite: 'Polie',
  colSonkei: 'Respectueux',
  colKenjou: 'Humble',
  colVerb: 'Verbe',

  'verb-groups': 'Groupes de verbes',
  'verb-groupsDetail': 'À quel groupe appartient un verbe, et comment le savoir',
  'verb-groupsLead':
    'Tous les verbes sauf deux appartiennent au groupe 1 ou au groupe 2, et le groupe décide de leur conjugaison. Au dictionnaire, tout verbe se termine par un son en u.',
  godanTitle: 'Groupe 1 · 五段 (verbes en う)',
  godanText:
    'Le dernier kana se déplace le long de sa ligne du tableau des kana : 書か・書き・書く・書け・書こ. Devant ます il prend le son en i (書きます), devant ない le son en a (書かない).',
  ichidanTitle: 'Groupe 2 · 一段 (verbes en る)',
  ichidanText:
    'Ils se terminent en -iru ou -eru, et る tombe tout simplement : 食べる → 食べます, 食べない.',
  irregularTitle: 'Groupe 3 · irréguliers',
  irregularText:
    'Seulement する et 来る (くる), avec tout nom + する (勉強する). Apprenez leurs formes par cœur.',
  tellTitle: 'Comment le savoir',
  tellText:
    'Ne finit pas par る : groupe 1. Finit par る après un son en a, u ou o (分かる, 作る, 乗る) : groupe 1. Finit en -iru ou -eru : en général groupe 2, mais quelques verbes courants sont du groupe 1 :',

  'plain-polite': 'Forme du dictionnaire et forme polie',
  'plain-politeDetail': '辞書形 et ます形, et quand employer chacune',
  'plain-politeLead':
    'Chaque verbe a une forme neutre (la forme du dictionnaire, 辞書形, et ses dérivées) et une forme polie en ます. Elles ont le même sens ; la forme polie s’emploie avec les personnes dont on n’est pas proche.',
  pairsTitle: 'Les quatre paires',
  pairsText: 'Présent et passé, affirmatif et négatif, la forme neutre à côté de la forme polie :',
  whenTitle: 'Quand on emploie la forme neutre',
  whenText:
    'Entre amis et en famille, dans les journaux intimes et les articles, et à l’intérieur d’une phrase : devant 〜と思います, 〜ことができます, 〜前に ou un nom (読む本), le verbe reste à la forme neutre, même dans une phrase polie.',

  'te-form': 'La forme en て et la forme en た',
  'te-formDetail': 'Les changements de son, en un seul tableau',
  'te-formLead':
    'La forme en て relie des actions (〜て、〜), sert à demander (〜てください) et forme 〜ている. La forme en た est le passé neutre. Les deux changent de la même façon : た et だ suivent て et で.',
  rulesTitle: 'Groupe 1, selon le dernier kana',
  rulesText:
    'Récitez-le comme une comptine : う・つ・る → って, む・ぶ・ぬ → んで, く → いて, ぐ → いで, す → して.',
  othersTitle: 'Groupe 2, irréguliers, et 行く',
  othersText:
    'Le groupe 2 remplace simplement る par て. する et 来る sont irréguliers, et 行く est le seul verbe en く qui prend って.',

  adjectives: 'Formes des adjectifs',
  adjectivesDetail: 'Adjectifs en い et en な, forme neutre et forme polie',
  adjectivesLead:
    'Les adjectifs en い se conjuguent eux-mêmes : leur い change. Les adjectifs en な fonctionnent comme des noms : c’est ce qui les suit qui change.',
  iTitle: 'Adjectifs en い',
  iText:
    'い devient くない, かった, くなかった, くて. いい est irrégulier : ses formes viennent de よい (よくない, よかった).',
  naTitle: 'Adjectifs en な',
  naText:
    'L’adjectif ne change pas ; だ, じゃない, だった et で le suivent. Devant un nom, il prend な : 静かな部屋.',
  rowPresent: 'Présent',
  rowNegative: 'Négatif',
  rowPast: 'Passé',
  rowNegativePast: 'Passé négatif',
  rowTe: 'Forme en て',

  conjugation: 'Tableau de conjugaison',
  conjugationDetail: 'N’importe quel verbe, à toutes les formes',
  conjugationLead:
    'Choisissez un verbe, ou tapez n’importe quel verbe à la forme du dictionnaire, pour le voir à toutes les formes. Le niveau indique quand chaque forme est enseignée.',
  pickVerb: 'Un verbe',
  typeVerb: 'N’importe quel verbe',
  typeVerbPlaceholder: 'Forme du dictionnaire, par ex. 遊ぶ ou あそぶ',
  notAVerb:
    '{text} n’est pas un verbe que nous connaissons. Tapez sa forme du dictionnaire, comme 泳ぐ.',
  groupOf: 'Groupe {n}',
  formDict: 'Forme du dictionnaire',
  formMasu: 'Polie',
  formNai: 'Négative',
  formTa: 'Passée',
  formNakatta: 'Passée négative',
  formTe: 'Forme en て',
  formTai: 'Vouloir',
  formVolitional: 'Faisons (neutre)',
  formPotential: 'Pouvoir (potentielle)',
  formPassive: 'Passive',
  formCausative: 'Causative',
  formImperative: 'Ordre',
  formBa: 'Si (ば)',
  formTara: 'Si, quand (たら)',

  keigo: 'Keigo',
  keigoDetail: 'Langage poli, respectueux et humble',
  keigoLead:
    'Le keigo a trois niveaux. 丁寧語 est le です et le ます polis. 尊敬語 élève la personne dont vous parlez, pour ce qu’elle fait. 謙譲語 vous abaisse, pour ce que vous faites pour elle.',
  verbsTitle: 'Les verbes qui ont leurs propres mots',
  verbsText: 'Les verbes les plus courants deviennent un tout autre mot :',
  patternsTitle: 'Les tournures pour les autres verbes',
  patternsText: 'La plupart des verbes suivent plutôt une tournure :',
  patternoNiNaru: 'Respectueux, pour ce qu’ils font',
  patternreru: 'Respectueux, plus léger : la forme passive',
  patternoSuru: 'Humble, pour ce que vous faites pour eux',
  patterngoSuru: 'Humble, avec un nom en する',
  sentencesTitle: 'Dans des phrases',
  sentenceirassharu: 'À quelle heure le professeur viendra-t-il ?',
  sentenceoKaeri: 'Le directeur est déjà rentré.',
  sentenceokuri: 'Je vous accompagne à la gare.',
  sentencemoushimasu: 'Je m’appelle Tanaka.',
} satisfies Messages['guides'];
