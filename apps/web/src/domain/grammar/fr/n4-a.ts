/** French texts for N4 grammar, part A (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N4_A: ById<GrammarText> = {
  'nakereba-naranai': {
    meaning: 'devoir, être obligé de',
    formation: 'V-ない (sans い) + ければならない / いけない',
    explanation:
      'Littéralement « si on ne le fait pas, ça ne va pas ». Exprime un devoir ou une règle ; ならない sonne plus formel que いけない.',
  },
  'nakute-wa-ikenai': {
    meaning: 'devoir, être tenu de',
    formation: 'V-ない (sans い) + くてはいけない / ならない',
    explanation:
      'Proche parent de なければならない, un peu plus parlé. En langage familier, il se réduit à なくちゃ.',
  },
  'nai-to-ikenai': {
    meaning: 'devoir (besoin personnel)',
    explanation:
      'ないといけない exprime souvent un besoin ressenti par le locuteur, comme « il faut que je rentre maintenant ». Très courant dans la langue de tous les jours.',
  },
  'nakute-mo-ii': {
    meaning: 'ne pas être obligé de',
    formation: 'V-ない (sans い) + くてもいい',
    explanation:
      'C’est l’inverse d’une obligation : « même si on ne le fait pas, ça va ». かまわない peut remplacer いい.',
  },
  kamoshirenai: {
    meaning: 'peut-être, il se peut que',
    formation: 'forme neutre (N / adj-な sans だ) + かもしれない',
    explanation:
      'かもしれない admet une possibilité dont le locuteur n’est pas sûr, une chance sur deux ou moins. La forme polie est かもしれません.',
  },
  darou: {
    meaning: 'probablement ; je suppose',
    formation: 'forme neutre (N / adj-な sans だ) + だろう',
    explanation:
      'だろう est la forme neutre de でしょう. Les hommes l’emploient à l’oral, et tout le monde l’emploie à l’écrit et devant 〜と思う.',
  },
  hazu: {
    meaning: 'devrait (normalement), être censé',
    formation: 'forme neutre (adj-な + な / N + の) + はずだ',
    explanation:
      'はず est une attente confiante fondée sur des faits : « il est parti il y a une heure, il devrait être arrivé ». Ce n’est pas un conseil ; pour cela, on utilise べき ou ほうがいい.',
  },
  'you-da': {
    meaning: 'il semble que, on dirait que',
    formation: 'forme neutre (adj-な + な / N + の) + ようだ',
    explanation:
      'ようだ tire une conclusion de ce que le locuteur voit ou perçoit. Il est plus mesuré que みたいだ, qui a le même sens en langage familier.',
  },
  mitai: {
    meaning: 'on dirait ; comme',
    formation: 'forme neutre / N + みたいだ',
    explanation:
      'みたい est la forme orale de ようだ. Il suit directement un nom, sans の, et sert aussi aux comparaisons : 子供みたい, « comme un enfant ».',
  },
  'sou-look': {
    meaning: 'on dirait que ça va ; avoir l’air …',
    formation: 'V-radical / adj-い (sans い) / adj-な + そうだ',
    explanation:
      'Ce そう juge d’après l’apparence : おいしそう, « ça a l’air bon », ou 降りそう, « on dirait qu’il va pleuvoir ». いい devient よさそう.',
  },
  'sou-hearsay': {
    meaning: 'il paraît que, on dit que',
    formation: 'forme neutre + そうだ',
    explanation:
      'Après une forme neutre complète, そうだ rapporte une information entendue ou lue. On peut en indiquer la source avec によると.',
  },
  rashii: {
    meaning: 'apparemment, il semble que',
    formation: 'forme neutre / N + らしい',
    explanation:
      'らしい transmet une conclusion fondée sur ce qu’on a entendu, avec une certaine distance. Il se conjugue comme un adjectif en い.',
  },
  'ta-koto-ga-aru': {
    meaning: 'avoir déjà fait (au moins une fois)',
    explanation:
      'Ce schéma parle d’une expérience vécue, pas d’une action récente. La forme négative ことがない signifie « n’avoir jamais fait ».',
  },
  'koto-ga-aru': {
    meaning: 'il arrive que (l’on fasse)',
    formation: 'V-dictionnaire / V-ない + ことがある',
    explanation:
      'Avec la forme du dictionnaire, ことがある signifie qu’une chose arrive de temps en temps. À ne pas confondre avec le passé たことがある.',
  },
  'koto-ga-dekiru': {
    meaning: 'pouvoir, être capable de',
    formation: 'V-dictionnaire + ことができる',
    explanation:
      'ことができる indique qu’on est capable de faire quelque chose, ou que c’est possible. C’est un peu plus formel que la forme potentielle.',
  },
  'you-ni-naru': {
    meaning: 'en venir à (pouvoir)',
    formation: 'V-dictionnaire / potentiel / V-ない + ようになる',
    explanation:
      'ようになる décrit un changement progressif de capacité ou d’habitude : 話せるようになった, « je suis devenu capable de parler ». Comparer avec なる après un nom, qui est un simple changement.',
  },
  tsumori: {
    meaning: 'avoir l’intention de, compter',
    formation: 'V-dictionnaire / V-ない + つもりだ',
    explanation:
      'つもり désigne un projet ferme que le locuteur a arrêté. Interroger un supérieur sur sa つもり peut paraître abrupt.',
  },
  'you-to-omou': {
    meaning: 'je pense que je vais',
    formation: 'V-volitif + と思う',
    explanation:
      'La forme volitive suivie de と思う partage une décision encore récente ou un peu ouverte. Avec と思っている, c’est un projet nourri depuis un certain temps.',
  },
  yotei: {
    meaning: 'être prévu, avoir prévu de',
    formation: 'V-dictionnaire / N + の + 予定だ',
    explanation:
      '予定 est un projet arrêté, souvent inscrit dans un agenda. Il est plus officiel que つもり.',
  },
  'you-ni-suru': {
    meaning: 'faire en sorte de, veiller à',
    formation: 'V-dictionnaire / V-ない + ようにする',
    explanation:
      'ようにする est un effort conscient pour continuer à faire, ou à ne pas faire, quelque chose. Avec している, c’est une habitude que le locuteur entretient.',
  },
  'ni-suru': {
    meaning: 'se décider pour, choisir',
    explanation:
      'Nom + にする retient une option, comme au moment de commander : コーヒーにします. C’est le choix du locuteur lui-même.',
  },
  'koto-ni-suru': {
    meaning: 'décider de',
    formation: 'V-dictionnaire / V-ない + ことにする',
    explanation:
      'ことにする rapporte une décision prise par le locuteur. ことにした est la façon habituelle de l’annoncer.',
  },
  'koto-ni-naru': {
    meaning: 'il a été décidé que',
    formation: 'V-dictionnaire / V-ない + ことになる',
    explanation:
      'ことになる présente une décision comme prise par d’autres ou par les circonstances. C’est une façon modeste d’annoncer une nouvelle qui nous concerne.',
  },
  'te-ageru': {
    meaning: 'faire (quelque chose) pour quelqu’un',
    explanation:
      'てあげる, c’est rendre un service à quelqu’un d’autre. Envers un supérieur, cela peut sembler condescendant ; mieux vaut l’éviter.',
  },
  'te-kureru': {
    meaning: 'quelqu’un fait (quelque chose) pour moi',
    explanation:
      'てくれる montre que le locuteur bénéficie de l’action de quelqu’un et lui en est reconnaissant. Celui qui agit est le sujet.',
  },
  'te-morau': {
    meaning: 'se faire faire (quelque chose) par quelqu’un',
    formation: 'personne + に + V-て + もらう',
    explanation:
      'てもらう voit le service du côté de celui qui le reçoit, et implique souvent qu’il l’a demandé. Celui qui agit prend に.',
  },
  'te-itadaku': {
    meaning: 'recevoir humblement un service',
    formation: 'personne + に + V-て + いただく',
    explanation:
      'いただく est la forme humble de もらう. Elle marque le respect envers un professeur, un client ou toute personne au-dessus de soi.',
  },
  'te-kudasaru': {
    meaning: 'quelqu’un (respecté) a la gentillesse de',
    explanation:
      'くださる est la forme honorifique de くれる, pour un service venant de quelqu’un au-dessus de soi. Sa forme polie en -masu est くださいます.',
  },
};
