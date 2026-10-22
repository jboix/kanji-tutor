/** French texts for N4 grammar, part D (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N4_D: ById<GrammarText> = {
  aida: {
    meaning: 'pendant (tout le temps)',
    explanation:
      '間 couvre toute une durée, et l’action principale se poursuit tout du long. Avec に, il désigne un moment à l’intérieur de cette durée.',
  },
  'aida-ni': {
    meaning: 'pendant (à un moment donné)',
    explanation:
      '間に situe un événement unique dans une période : 留守の間に, « pendant mon absence ». Comparer avec 間, qui dure toute la période.',
  },
  'made-ni': {
    meaning: 'avant, d’ici (une échéance)',
    formation: 'heure / V-dictionnaire + までに',
    explanation:
      'までに fixe une échéance : l’action a lieu à un moment avant celle-ci. まで seul signifie que l’action dure jusque-là.',
  },
  zutsu: {
    meaning: 'chacun, à la fois',
    formation: 'quantité + ずつ',
    explanation:
      'ずつ répartit une quantité de façon égale, ou la répète pas à pas : 少しずつ, « petit à petit ».',
  },
  bakari: {
    meaning: 'rien que, seulement',
    explanation:
      'ばかり après un nom indique qu’il n’y a que cela, et s’en plaint généralement. ゲームばかりしている signifie « ne fait que jouer aux jeux vidéo ».',
  },
  naide: {
    meaning: 'sans faire',
    explanation:
      'ないで indique qu’une action a lieu sans une autre qui serait normale : 朝ご飯を食べないで, « sans prendre le petit-déjeuner ».',
  },
  'ta-mama': {
    meaning: 'en laissant … (tel quel)',
    explanation:
      'まま indique qu’un état reste inchangé pendant qu’autre chose se passe, souvent alors qu’il ne le devrait pas : 電気をつけたまま寝た.',
  },
  'ga-suru': {
    meaning: 'il y a (un son, une odeur, un goût)',
    explanation:
      'する avec un mot de sensation indique que la sensation est perçue : 変な音がする, « j’entends un bruit bizarre ». Le locuteur n’est pas celui qui agit.',
  },
  tagaru: {
    meaning: '(quelqu’un d’autre) veut',
    formation: 'V-radical + たがる / adj-い (sans い) + がる',
    explanation:
      'がる décrit les désirs ou les sentiments d’une autre personne vus de l’extérieur. On l’emploie souvent sous la forme がっている.',
  },
  'te-hoshii': {
    meaning: 'vouloir que quelqu’un fasse',
    formation: 'personne + に + V-て + ほしい',
    explanation:
      'てほしい exprime le souhait qu’une autre personne agisse. Envers un supérieur, c’est trop direct ; mieux vaut formuler une demande.',
  },
  imperative: {
    meaning: 'fais-le ! (ordre)',
    formation: 'V godan (〜え) / V ichidan (〜ろ)',
    explanation:
      'L’impératif est un ordre brusque. On le trouve dans le sport, sur les panneaux, en cas d’urgence et dans un langage rude, rarement dans une conversation polie.',
  },
  'na-prohibition': {
    meaning: 'ne fais pas ! (interdiction)',
    formation: 'V-dictionnaire + な',
    explanation:
      'な après la forme du dictionnaire est un « ne fais pas » brusque. C’est le négatif de l’impératif, et il est tout aussi fort.',
  },
  nasai: {
    meaning: 'fais-le (consigne)',
    formation: 'V-radical + なさい',
    explanation:
      'なさい est un ordre donné par une personne qui a autorité, comme un parent ou un sujet d’examen. Il est ferme, mais pas impoli.',
  },
  'te-kuremasen-ka': {
    meaning: 'pourriez-vous faire … pour moi ?',
    explanation:
      'Demander si quelqu’un veut bien rendre un service est plus doux qu’une demande directe. ませんか lui laisse la possibilité de refuser.',
  },
  'te-moraemasen-ka': {
    meaning: 'pourrais-je vous demander de … ?',
    explanation:
      'On demande si l’on pourrait recevoir le service, ce qui est plus modeste que くれませんか. Le sujet implicite est celui qui reçoit, pas celui qui agit.',
  },
  kana: {
    meaning: 'je me demande',
    formation: 'forme neutre + かな',
    explanation:
      'かな est une question qu’on se pose à soi-même, à voix haute. C’est familier ; かしら en est une variante plus douce.',
  },
  'sa-noun': {
    meaning: '-eur, -ité (degré sous forme de nom)',
    formation: 'adj-い (sans い) / adj-な + さ',
    explanation:
      'さ transforme un adjectif en nom de degré : 高さ signifie « hauteur ». Il mesure, alors que 〜み nomme une sensation.',
  },
  'no-nominal': {
    meaning: 'le fait de (verbe nominalisé)',
    formation: 'V-neutre + の + は / が / を',
    explanation:
      'の transforme une proposition en nom pour qu’elle puisse être sujet ou complément d’objet. Il convient aux choses perçues directement ; こと convient aux faits abstraits.',
  },
};
