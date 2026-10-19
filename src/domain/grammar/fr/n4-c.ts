/** French texts for N4 grammar, part C (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N4_C: ById<GrammarText> = {
  shi: {
    meaning: 'et en plus (énumération de raisons)',
    formation: 'forme neutre + し',
    explanation:
      'し énumère une ou plusieurs raisons et laisse entendre qu’il y en a d’autres. La conclusion vient souvent à la fin.',
  },
  noni: {
    meaning: 'alors que, bien que',
    formation: 'forme neutre (adj-な / N + な) + のに',
    explanation:
      'のに relie deux faits qui s’opposent, avec de la surprise ou de la frustration face au résultat. Il ne peut pas être suivi d’une demande.',
  },
  'te-mo': {
    meaning: 'même si, bien que',
    formation: 'V-て / adj-い (〜くて) + も',
    explanation:
      'ても indique que le résultat ne change pas, quelle que soit la condition. Suivi de いい, il exprime au contraire une permission : il faut donc regarder ce qui suit.',
  },
  'tame-ni': {
    meaning: 'pour, afin de',
    formation: 'V-dictionnaire / N + の + ために',
    explanation:
      'ために donne un but que le sujet choisit de poursuivre. Le verbe qui précède est une action qu’on peut faire volontairement.',
  },
  'you-ni': {
    meaning: 'pour que, afin que',
    formation: 'V-dictionnaire / potentiel / V-ない + ように',
    explanation:
      'ように donne un but qui est un état ou qui échappe au contrôle direct : pour ne pas oublier. Comparer avec ために, dont le but est une action.',
  },
  'hodo-nai': {
    meaning: 'pas aussi … que',
    formation: 'N + ほど + négatif',
    explanation:
      'ほど avec un négatif indique qu’une chose n’atteint pas le niveau de ce à quoi on la compare. 去年ほど暑くない signifie « pas aussi chaud que l’an dernier ».',
  },
  'hou-ga-ii': {
    meaning: 'il vaudrait mieux, on devrait',
    explanation:
      'ほうがいい donne un conseil assez appuyé. La forme passée est habituelle pour « tu devrais le faire », et ない pour « tu ferais mieux de ne pas le faire ».',
  },
  'ba-ii': {
    meaning: 'il suffit de ; ce serait bien de',
    explanation:
      'ばいい propose une solution simple, ou demande quoi faire : どうすればいいですか. たらいい a à peu près le même sens.',
  },
  'tara-dou': {
    meaning: 'et si tu … ?',
    explanation:
      'C’est une suggestion douce qui laisse le choix à l’interlocuteur. どうでしょうか est encore plus poli.',
  },
  sugiru: {
    meaning: 'trop, excès de',
    formation: 'V-radical / adj-い (sans い) / adj-な + すぎる',
    explanation:
      'すぎる indique qu’une chose dépasse la juste mesure : 食べすぎた, « j’ai trop mangé ». Il se conjugue comme un verbe ichidan.',
  },
  yasui: {
    meaning: 'facile à',
    formation: 'V-radical + やすい',
    explanation:
      'やすい après un radical en -masu forme un adjectif en い de facilité : 書きやすいペン, « un stylo avec lequel il est facile d’écrire ». Il peut aussi signifier « avoir tendance à ».',
  },
  nikui: {
    meaning: 'difficile à',
    formation: 'V-radical + にくい',
    explanation:
      'にくい est l’inverse de やすい : l’action est difficile à cause de la chose elle-même. 飲みにくい薬 est un médicament difficile à avaler.',
  },
  'n-desu': {
    meaning: 'c’est que … (explication)',
    formation: 'forme neutre (adj-な / N + な) + んです / のです',
    explanation:
      'んです présente une affirmation comme une explication, ou en demande une. Il sonne impliqué et personnel ; trop utilisé, il peut paraître insistant.',
  },
  'to-iu': {
    meaning: 'appelé, nommé',
    explanation:
      'という nomme quelque chose que l’interlocuteur ne connaît peut-être pas : 田中という人, « une personne appelée Tanaka ».',
  },
  'to-omou': {
    meaning: 'je pense que',
    formation: 'forme neutre + と思う',
    explanation:
      'と思う présente une opinion ou une supposition comme celle du locuteur. Devant lui, un nom ou un adjectif en な demande だ.',
  },
  'to-itte-ita': {
    meaning: 'a dit que',
    formation: 'forme neutre + と言っていた',
    explanation:
      'と言っていた rapporte ce que quelqu’un a dit plus tôt. La forme en ている montre que le message est toujours d’actualité.',
  },
  'ka-dou-ka': {
    meaning: 'si … ou non',
    formation: 'forme neutre + かどうか',
    explanation:
      'かどうか insère une question fermée (oui ou non) dans une phrase. Des verbes comme 分からない et 知っている le suivent souvent.',
  },
  'embedded-ka': {
    meaning: 'ce que / où / qui … (question indirecte)',
    formation: 'mot interrogatif … forme neutre + か + 知る / 分かる',
    explanation:
      'Une question avec un mot interrogatif peut s’insérer dans une phrase avec か. 駅はどこか知っていますか demande si l’on sait où se trouve la gare.',
  },
};
