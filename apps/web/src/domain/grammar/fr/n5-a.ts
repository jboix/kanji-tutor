/** French texts for N5 grammar, part A (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N5_A: ById<GrammarText> = {
  desu: {
    meaning: 'c’est, être (poli)',
    explanation:
      'です relie un thème à un nom et rend l’énoncé poli. Il joue le rôle de « être » en français, mais se place en fin de phrase.',
  },
  da: {
    meaning: 'c’est, être (neutre)',
    explanation:
      'だ est l’équivalent neutre de です. On l’entend entre amis à l’oral, et il est courant à l’écrit et à l’intérieur des phrases longues.',
  },
  'ja-nai': {
    meaning: 'ce n’est pas, ne pas être',
    explanation:
      'C’est le négatif de です et de だ. じゃ est la contraction orale de では, et ありません est la terminaison polie.',
  },
  deshita: {
    meaning: 'c’était, être au passé (poli)',
    explanation:
      'でした est la forme passée de です. On l’emploie avec un nom ou un adjectif en -na qui décrivait quelque chose dans le passé.',
  },
  masu: {
    meaning: 'terminaison verbale polie du non-passé',
    formation: 'V-radical + ます',
    explanation:
      'ます rend un verbe poli. La même forme exprime l’habitude, le présent et le futur : c’est le contexte qui tranche.',
  },
  masen: {
    meaning: 'négatif poli : ne pas faire, ne fera pas',
    formation: 'V-radical + ません',
    explanation:
      'ません est le négatif de ます. Il dit poliment que quelqu’un ne fait pas ou ne fera pas quelque chose.',
  },
  mashita: {
    meaning: 'passé poli : a fait',
    formation: 'V-radical + ました',
    explanation:
      'ました est la forme passée de ます. Il rapporte une action achevée dans un registre poli.',
  },
  'masen-deshita': {
    meaning: 'passé négatif poli : n’a pas fait',
    formation: 'V-radical + ませんでした',
    explanation:
      'On ajoute でした après ません pour dire que quelque chose n’a pas eu lieu. C’est la façon polie de nier une action passée.',
  },
  'nai-form': {
    meaning: 'négatif neutre : ne pas faire',
    explanation:
      'La forme en ない est le négatif neutre d’un verbe. C’est ce qu’on dit entre amis à la place de ません, et beaucoup de structures en dérivent.',
  },
  'ta-form': {
    meaning: 'passé neutre : a fait',
    explanation:
      'La forme en た est le passé neutre d’un verbe. Ses changements de son suivent les mêmes règles que la forme en て : 読む devient 読んだ.',
  },
  mashou: {
    meaning: 'faisons…, allons…',
    formation: 'V-radical + ましょう',
    explanation:
      'ましょう invite l’interlocuteur à faire quelque chose ensemble, ou accepte un projet. C’est chaleureux et poli.',
  },
  'masen-ka': {
    meaning: 'et si on… ? voulez-vous… ?',
    formation: 'V-radical + ませんか',
    explanation:
      'Poser la question au négatif est une manière douce d’inviter. On laisse à l’autre la possibilité de refuser, ce qui est plus doux que ましょう.',
  },
  'mashou-ka': {
    meaning: 'voulez-vous que je… ? si on… ?',
    formation: 'V-radical + ましょうか',
    explanation:
      'ましょうか propose de faire quelque chose pour l’interlocuteur, ou demande s’il faut le faire ensemble. La question en fait une offre, pas un projet.',
  },
  tai: {
    meaning: 'vouloir (faire)',
    formation: 'V-radical + たい',
    explanation:
      'たい transforme un verbe en adjectif en -i de désir. Il parle du locuteur ou interroge l’interlocuteur ; pour une tierce personne, le japonais préfère たがる.',
  },
  hoshii: {
    meaning: 'vouloir (une chose)',
    explanation:
      'ほしい est un adjectif en -i qui dit qu’on veut quelque chose. L’objet désiré est marqué par が, et on ne l’emploie pas pour le désir d’autrui.',
  },
  'te-kudasai': {
    meaning: 'faites…, s’il vous plaît',
    explanation:
      'てください demande à quelqu’un de faire quelque chose. C’est poli, mais cela reste une demande : les enseignants et les panneaux l’emploient souvent.',
  },
  'naide-kudasai': {
    meaning: 'ne faites pas…, s’il vous plaît',
    explanation:
      'On place でください après la forme en ない pour demander de ne pas faire quelque chose. C’est la façon polie d’interdire ou de mettre en garde.',
  },
  'o-kudasai': {
    meaning: 'donnez-moi…, s’il vous plaît',
    explanation:
      'Avec un nom, ください demande la chose elle-même. C’est ce qu’on dit pour commander dans un magasin ou un café.',
  },
  'te-iru': {
    meaning: 'être en train de ; être dans un état',
    explanation:
      'ている indique une action en cours ou un état issu d’un changement. 食べている, c’est « être en train de manger », mais 結婚している, c’est « être marié ».',
  },
  'mada-te-inai': {
    meaning: 'pas encore',
    explanation:
      'まだ avec ている au négatif dit que quelque chose n’a pas encore eu lieu mais peut encore arriver. Le japonais emploie ici ている, pas le passé.',
  },
  'mou-ta': {
    meaning: 'avoir déjà fait',
    explanation:
      'もう avec un verbe au passé dit que quelque chose est déjà fait. Pour répondre « pas encore » à une telle question, on dit まだです.',
  },
};
