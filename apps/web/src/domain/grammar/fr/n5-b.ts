/** French texts for N5 grammar, part B (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N5_B: ById<GrammarText> = {
  'te-mo-ii': {
    meaning: 'on peut, il est permis de',
    explanation:
      'てもいい donne ou demande une permission : « même si tu le fais, c’est bien ». On ajoute ですか pour demander si l’on peut faire quelque chose.',
  },
  'te-wa-ikenai': {
    meaning: 'il ne faut pas',
    explanation:
      'てはいけない interdit une action : « si tu le fais, ça ne va pas ». Règlements, parents et panneaux l’emploient ; à l’oral, だめ peut remplacer いけない.',
  },
  'te-kara': {
    meaning: 'après avoir fait ; depuis',
    explanation:
      'てから ordonne deux actions : la première est terminée avant que la seconde commence. Il insiste davantage sur l’ordre qu’une simple forme en て.',
  },
  'mae-ni': {
    meaning: 'avant de faire',
    formation: 'V-dictionnaire + 前に',
    explanation:
      'Le verbe devant 前に reste à la forme du dictionnaire, même quand toute la phrase est au passé. L’action qui suit 前に a lieu en premier.',
  },
  'ato-de': {
    meaning: 'après avoir fait',
    explanation:
      'Après un verbe, 後で demande la forme passée, car la première action est déjà accomplie. Avec un nom, on le relie par の.',
  },
  toki: {
    meaning: 'quand ; au moment où',
    formation: 'V-neutre / adj-い / adj-な + な / N + の + とき',
    explanation:
      'とき est un nom qui signifie « moment » : une proposition entière peut donc le décrire. Le temps du verbe qui précède indique si cette action vient en premier.',
  },
  nagara: {
    meaning: 'tout en faisant',
    formation: 'V-radical + ながら',
    explanation:
      'ながら relie deux actions faites en même temps par la même personne. L’action principale vient en dernier ; celle avec ながら est l’arrière-plan.',
  },
  'kara-made': {
    meaning: 'de … à / jusqu’à …',
    explanation:
      'から marque où ou quand quelque chose commence, et まで où ou quand cela se termine. La paire s’emploie pour le temps comme pour les lieux.',
  },
  goro: {
    meaning: 'vers (un moment)',
    formation: 'heure + ごろ',
    explanation:
      'ごろ après une heure la rend approximative : 三時ごろ, c’est « vers trois heures ». Pour les quantités et les durées, on emploie plutôt ぐらい.',
  },
  'kara-reason': {
    meaning: 'parce que, donc',
    formation: 'forme neutre ou polie + から',
    explanation:
      'から après une phrase donne la raison de ce qui suit. Il paraît plus personnel et plus direct que ので.',
  },
  node: {
    meaning: 'parce que, comme',
    formation: 'forme neutre (adj-な / N + な) + ので',
    explanation:
      'ので présente une raison comme un simple fait. Plus doux que から, il convient aux excuses et aux explications polies.',
  },
  'ga-but': {
    meaning: 'mais ; et (adoucissant)',
    formation: 'phrase + が、phrase',
    explanation:
      'が après une phrase complète la relie à la suivante au sens de « mais ». Il peut aussi adoucir une introduction avant une demande ou une question.',
  },
  kedo: {
    meaning: 'mais, bien que',
    formation: 'phrase + けど / けれど',
    explanation:
      'けど est le « mais » courant de l’oral. けれど et けれども sont un peu plus soignés ; tous trois relient deux propositions.',
  },
  demo: {
    meaning: 'mais, pourtant (en début de phrase)',
    formation: 'でも、phrase',
    explanation:
      'でも ouvre une nouvelle phrase qui s’oppose à la précédente. À l’écrit formel, on emploie しかし.',
  },
  yori: {
    meaning: 'que (comparaison)',
    formation: 'N + より + adjectif',
    explanation:
      'より marque l’élément auquel on compare. 東京は大阪より大きい place Tokyo en premier et Osaka comme référence.',
  },
  'no-hou-ga': {
    meaning: 'X est plus …',
    formation: 'N + のほうが + adjectif',
    explanation:
      'のほうが désigne le côté qui possède le plus une qualité. Il répond souvent à une question avec どちら, et s’accompagne souvent de より.',
  },
  ichiban: {
    meaning: 'le plus',
    formation: '(N の中で) N + が一番 + adjectif',
    explanation:
      '一番 devant un adjectif en fait un superlatif. Le groupe est souvent indiqué par の中で, « parmi ».',
  },
  'to-onaji': {
    meaning: 'le même que',
    explanation:
      '同じ signifie « même », et と marque ce à quoi on compare. Devant un nom, 同じ reste tel quel, sans な ni の.',
  },
  dochira: {
    meaning: 'lequel des deux est plus … ?',
    explanation:
      'Cette question demande de choisir entre deux choses. どっち est la forme familière de どちら.',
  },
  ya: {
    meaning: 'A, B, etc.',
    explanation:
      'や cite quelques exemples d’une liste plus longue, contrairement à と, qui nomme tous les éléments. など à la fin rend le « etc. » explicite.',
  },
  'tari-tari': {
    meaning: 'faire des choses comme A et B',
    explanation:
      'たり choisit quelques actions comme exemples de ce que fait quelqu’un. La liste se termine par する, qui porte le temps.',
  },
  'ka-or': {
    meaning: 'A ou B',
    explanation:
      'か entre deux noms propose un choix. Entre deux propositions, comme dans 行くか行かないか, il signifie « si … ou non ».',
  },
  dake: {
    meaning: 'seulement, juste',
    formation: 'N / V-neutre + だけ',
    explanation:
      'だけ pose une limite : rien de plus que cela. Contrairement à しか, il s’emploie avec un verbe affirmatif.',
  },
  gurai: {
    meaning: 'environ (une quantité)',
    formation: 'quantité + ぐらい / くらい',
    explanation:
      'ぐらい après une quantité ou une durée la rend approximative : 十分ぐらい, c’est « environ dix minutes ». くらい a le même sens.',
  },
  'shika-nai': {
    meaning: 'seulement, rien que',
    formation: 'N + しか + verbe négatif',
    explanation:
      'しか va toujours avec un verbe négatif et souligne que la quantité est faible ou insuffisante. 百円しかない, c’est « je n’ai que cent yens ».',
  },
};
