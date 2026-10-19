/** French texts for N3 units 28–30 (N9, D53). Written for this app. */
import type { ById, UnitText } from '../../content-types.ts';

export const FR_N3_A: ById<UnitText> = {
  'honorific-speech': {
    theme: 'Le langage honorifique',
    summary:
      'Le keigo change le verbe lui-même selon qui agit et qui écoute, et les Japonais le réapprennent au travail.',
    sentences: [
      'Le japonais a une façon de parler particulière appelée keigo.',
      'Le keigo doit changer selon la relation avec l’interlocuteur.',
      'Par exemple, quand un supérieur mange, on dit meshiagaru, et quand on mange soi-même, on dit itadaku.',
      'Autrement dit, il y a des formes qui élèvent l’autre et des formes qui abaissent soi-même.',
      'Le keigo n’est pas facile, même pour les Japonais, et bon nombre le réétudient une fois entrés dans la vie active.',
      'Cependant, se tromper de keigo ne suffit pas à rendre impoli.',
      'L’important est moins de parler parfaitement que d’essayer de traduire en mots son respect pour l’autre.',
    ],
    questions: [
      'Ligne 3 : 自分が食べるときは「いただく」と言う. 召し上がる s’emploie quand un supérieur mange : il élève l’autre.',
      'Ligne 5 : après un radical de verbe, 〜直す signifie refaire l’action. Les actifs réapprennent le keigo ; ils n’arrêtent pas et ne l’enseignent pas.',
      'La dernière ligne énonce l’idée avec 大切なのは : essayer de montrer son respect pour l’autre compte plus que des mots parfaits. La ligne 6 dit qu’une erreur seule n’est pas impolie, et la ligne 5 que le keigo est difficile même pour les Japonais.',
    ],
  },
  dialects: {
    theme: 'Les dialectes régionaux',
    summary:
      'Dans le Kansai, naosu peut signifier « ranger », ce qui a un jour poussé un étudiant de Tokyo à réparer un livre qui n’était pas abîmé.',
    sentences: [
      'Le Japon est un petit pays, mais la langue varie beaucoup d’une région à l’autre.',
      'Le parler régional s’appelle hōgen, et la langue des journaux télévisés s’appelle hyōjungo, la langue standard.',
      'Dans le Kansai, par exemple, on dit parfois naosu pour « ranger ».',
      'Quand je suis parti de Tokyo pour une université d’Osaka, un ami m’a dit : « Naoshite oite ce livre. »',
      'Le livre n’était abîmé nulle part, alors je ne savais vraiment plus quoi faire.',
      'Plus tard, quand j’ai appris que naosu voulait dire « ranger », nous avons ri tous les deux.',
      'Parler en dialecte semble rapprocher des gens.',
      'Maintenant, même quand je revois mes amis de chez moi, des mots du Kansai m’échappent sans que je m’en rende compte.',
    ],
    questions: [
      'Ligne 3 : 「片付ける」という意味で「なおす」と言う. 片付ける, c’est remettre les choses à leur place. « Réparer » est le sens standard, et c’est justement ce qui a dérouté l’auteur.',
      'Ligne 5 : 本はどこも壊れていなかったので. L’auteur a compris なおす comme « réparer », mais le livre n’était pas abîmé, donc il n’y avait rien à réparer. Le livre était là, pas perdu.',
      'La ligne 2 le définit : テレビのニュースで使われる言葉を「標準語」と言う, la langue qu’on entend aux informations télévisées. Le parler du Kansai et les autres parlers régionaux sont des 方言.',
      'Ligne 7 : 相手とのきょりが近くなるような気がする : la distance avec l’autre semble diminuer, on se sent plus proche. L’auteur ne dit pas que le dialecte est rapide, impoli ou difficile.',
    ],
  },
  earthquakes: {
    theme: 'Les séismes et la prévention',
    summary:
      'Les exercices commencent dès l’école primaire, et chaque foyer est censé garder de l’eau et un point de rendez-vous prévus.',
    sentences: [
      'Le Japon connaît beaucoup de séismes ; les petits se produisent presque tous les jours.',
      'Comme de grands séismes ont frappé à maintes reprises, écoles et entreprises organisent des exercices de prévention une ou deux fois par an.',
      'Quand la secousse commence, il faut d’abord se mettre sous une table et se protéger la tête.',
      'Même une fois le séisme terminé, il ne faut pas se précipiter dehors.',
      'Il est aussi sage de garder chez soi de l’eau, de la nourriture, une radio, etc.',
      'Au cas où la famille serait dispersée, il faut aussi décider où se retrouver.',
      'Au lieu de se dire « ça ira pour l’instant », il est important de se préparer au quotidien.',
    ],
    questions: [
      'Ligne 3 : まず机の下に入って頭を守る. La ligne 4 met en garde contre le fait de se précipiter dehors, et la radio est à préparer à l’avance.',
      'Ligne 6 : 家族が別々の場所にいるときのために, pour le cas où la famille serait séparée au moment du séisme, afin de pouvoir se retrouver. L’eau et la nourriture sont à garder à la maison (ligne 5), et la ligne 4 met en garde contre le fait de se précipiter dehors.',
      '普段 désigne le quotidien, les temps ordinaires. La ligne l’oppose à l’idée まだ大丈夫だろう : on se prépare à l’avance, pas après le séisme.',
    ],
  },
};
