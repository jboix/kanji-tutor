/** French texts for N5 grammar, part C (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N5_C: ById<GrammarText> = {
  'ku-naru': {
    meaning: 'devenir',
    formation: 'adj-い (〜く) / adj-な, N + に + なる',
    explanation:
      'なる décrit un changement d’état. Un adjectif en い prend sa forme en く devant lui ; un nom ou un adjectif en な prend に.',
  },
  'ku-suru': {
    meaning: 'rendre (quelque chose) …',
    formation: 'adj-い (〜く) / adj-な + に + する',
    explanation:
      'する après une forme adverbiale dit qu’on change volontairement une chose. Comparez 静かになる, « devenir calme », et 静かにする, « rendre calme ».',
  },
  'ni-iku': {
    meaning: 'aller (quelque part) pour faire',
    formation: 'V-radical + に + 行く / 来る / 帰る',
    explanation:
      'Le radical de la forme polie suivi de に donne le but d’un déplacement. 飲みに行く, c’est « sortir boire un verre ».',
  },
  'no-ga-suki': {
    meaning: 'aimer faire',
    formation: 'V-dictionnaire + のが好き / 嫌い',
    explanation:
      'の transforme un groupe verbal en nom, qui peut alors prendre が devant 好き. Le même cadre fonctionne avec 嫌い et 大好き.',
  },
  'no-ga-jouzu': {
    meaning: 'être doué pour faire',
    formation: 'V-dictionnaire + のが上手 / 下手 / 得意 / 苦手',
    explanation:
      '上手 fait l’éloge du talent d’autrui ; pour soi-même, 得意 paraît moins vantard. 下手 et 苦手 sont les contraires.',
  },
  'amari-nai': {
    meaning: 'pas très, pas beaucoup',
    formation: 'あまり + négatif',
    explanation:
      'あまり avec un négatif l’atténue en « pas très » ou « pas souvent ». Avec un verbe affirmatif, le sens change : attention à la terminaison.',
  },
  'zenzen-nai': {
    meaning: 'pas du tout',
    formation: '全然 + négatif',
    explanation:
      '全然 avec un négatif le rend total : « pas du tout ». Il est plus fort que あまり.',
  },
  'adj-kute': {
    meaning: 'et (pour relier des adjectifs) ; parce que c’est …',
    formation: 'adj-い (〜い → 〜くて)',
    explanation:
      'くて est la forme en て d’un adjectif en い. Il relie une description à la suivante, et en donne parfois la raison.',
  },
  'adj-katta': {
    meaning: 'était (passé des adjectifs en い)',
    formation: 'adj-い (〜い → 〜かった)',
    explanation:
      'Un adjectif en い a sa propre forme passée : 寒い devient 寒かった. On n’y met pas でした ; on ajoute です après かった pour être poli.',
  },
  'adj-ku-nai': {
    meaning: 'n’est pas (négatif des adjectifs en い)',
    formation: 'adj-い (〜い → 〜くない)',
    explanation:
      'Le négatif d’un adjectif en い remplace い par くない. いい fait exception : il devient よくない.',
  },
  ne: {
    meaning: 'n’est-ce pas ? hein ? (recherche d’accord)',
    formation: 'phrase + ね',
    explanation:
      'ね en fin de phrase invite l’interlocuteur à approuver, ou vérifie qu’il partage un sentiment. Il rend le propos amical.',
  },
  yo: {
    meaning: 'je te dis (information nouvelle)',
    formation: 'phrase + よ',
    explanation:
      'よ marque une chose que l’interlocuteur ne sait pas encore. Employé trop souvent, il peut paraître insistant.',
  },
  'ka-question': {
    meaning: 'marqueur de question',
    formation: 'phrase + か',
    explanation:
      'か en fin de phrase transforme une phrase polie en question, sans besoin de point d’interrogation. Dans un registre familier, c’est l’intonation montante qui remplit ce rôle.',
  },
  'ga-aru': {
    meaning: 'il y a (une chose) ; avoir',
    formation: 'lieu + に + N + があります',
    explanation:
      'ある s’emploie pour ce qui ne bouge pas de soi-même, comme les livres et les bâtiments. Il signifie aussi « avoir » une chose ou un événement.',
  },
  'ga-iru': {
    meaning: 'il y a (un être vivant)',
    formation: 'lieu + に + N + がいます',
    explanation:
      'いる s’emploie pour les personnes et les animaux, y compris la famille : 兄がいます signifie « j’ai un grand frère ».',
  },
  ageru: {
    meaning: 'donner (à quelqu’un d’autre)',
    formation: 'personne + に + N + をあげる',
    explanation:
      'あげる, c’est donner depuis le côté du locuteur vers quelqu’un d’autre. Pour un cadeau qui vous parvient, on emploie くれる.',
  },
  kureru: {
    meaning: 'donner (à moi ou à mon entourage)',
    formation: 'personne + が + N + をくれる',
    explanation:
      'くれる, c’est donner vers le locuteur ou sa famille. Celui qui donne est le sujet.',
  },
  morau: {
    meaning: 'recevoir',
    formation: 'personne + に / から + N + をもらう',
    explanation:
      'もらう regarde le même cadeau du côté de celui qui reçoit. Celui qui donne est marqué par に ou から.',
  },
  deshou: {
    meaning: 'sans doute ; n’est-ce pas ?',
    formation: 'forme neutre (N / adj-な sans だ) + でしょう',
    explanation:
      'でしょう exprime une supposition sur l’avenir ou sur ce qu’on ne voit pas. Avec une intonation montante, il demande plutôt l’approbation.',
  },
};
