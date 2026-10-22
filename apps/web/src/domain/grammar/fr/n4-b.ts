/** French texts for N4 grammar, part B (N9). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N4_B: ById<GrammarText> = {
  'te-shimau': {
    meaning: 'finir par faire ; faire complètement',
    explanation:
      'てしまう marque une action comme achevée, souvent avec regret : 財布を忘れてしまった. Parfois, il souligne seulement qu’une tâche est terminée.',
  },
  'te-aru': {
    meaning: 'avoir été fait (et le rester)',
    formation: 'V-て transitif + ある',
    explanation:
      'てある décrit un état laissé par l’action délibérée de quelqu’un, comme une fenêtre qu’on a ouverte. L’objet prend généralement が.',
  },
  'te-oku': {
    meaning: 'faire à l’avance ; laisser tel quel',
    explanation:
      'ておく, c’est faire quelque chose maintenant pour être prêt plus tard, ou laisser les choses en l’état. À l’oral, il se réduit souvent à とく.',
  },
  'te-iku': {
    meaning: 'continuer à ; changer à partir de maintenant',
    explanation:
      'ていく s’éloigne du locuteur, dans l’espace ou dans le temps : un changement qui va se poursuivre à partir de maintenant. C’est le pendant de てくる.',
  },
  'te-kuru': {
    meaning: 'commencer à ; aller faire et revenir',
    explanation:
      'てくる se rapproche du locuteur : un changement qui a commencé et se poursuit jusqu’à maintenant, ou le fait d’aller quelque part et de revenir. 雨が降ってきた signifie « il s’est mis à pleuvoir ».',
  },
  'tokoro-da': {
    meaning: 'être sur le point de ; être en train de',
    formation: 'V-dictionnaire / V-ている + ところだ',
    explanation:
      'ところ désigne un moment précis d’une action. Avec la forme du dictionnaire, c’est juste avant l’action, et avec ている, en plein milieu.',
  },
  'ta-bakari': {
    meaning: 'venir de faire',
    explanation:
      'たばかり indique que peu de temps s’est écoulé depuis l’action, aux yeux du locuteur. Cela peut faire des semaines, si cela semble encore récent.',
  },
  'te-miru': {
    meaning: 'essayer de faire (pour voir)',
    explanation:
      'てみる, c’est faire quelque chose pour voir ce que cela donne. On l’écrit en kana, car il ne s’agit pas de « voir » avec les yeux.',
  },
  hajimeru: {
    meaning: 'commencer à',
    formation: 'V-radical + 始める',
    explanation:
      '始める après un radical en -masu marque le début d’une action ou d’un changement. Il se conjugue comme un verbe ordinaire.',
  },
  owaru: {
    meaning: 'finir de',
    formation: 'V-radical + 終わる',
    explanation:
      '終わる après un radical en -masu indique qu’une action est achevée, comme lire un livre jusqu’au bout.',
  },
  tsuzukeru: {
    meaning: 'continuer à',
    formation: 'V-radical + 続ける',
    explanation:
      '続ける après un radical en -masu indique qu’une action se poursuit sans interruption. 歩き続けた signifie « a continué à marcher ».',
  },
  tara: {
    meaning: 'si ; quand ; après',
    formation: 'V / adj à la forme en た + ら',
    explanation:
      'たら pose une condition, ou un moment après lequel quelque chose se produit. C’est le conditionnel le plus souple à l’oral.',
  },
  ba: {
    meaning: 'si',
    formation: 'V (〜えば) / adj-い (〜ければ)',
    explanation:
      'ば énonce une condition et ce qui en découle, souvent pour des vérités générales ou des conseils. La proposition principale donne rarement un ordre.',
  },
  'to-conditional': {
    meaning: 'chaque fois que, si (alors forcément)',
    formation: 'V-dictionnaire / V-ない + と',
    explanation:
      'Ce と relie une cause à son résultat naturel et automatique, comme appuyer sur un bouton et voir une porte s’ouvrir. La seconde proposition ne peut pas être une demande.',
  },
  nara: {
    meaning: 'si (c’est le cas) ; quant à',
    formation: 'forme neutre / N + なら',
    explanation:
      'なら reprend ce qui vient d’être dit ou supposé et donne un conseil à ce sujet : « si tu vas au Japon, … ». Il n’exprime pas l’ordre chronologique.',
  },
  passive: {
    meaning: 'être fait (passif)',
    formation: 'radical V-ない godan + れる / V ichidan + られる',
    explanation:
      'Le passif fait du destinataire de l’action le sujet, et celui qui agit prend に. Il ajoute souvent l’idée d’en être gêné.',
  },
  causative: {
    meaning: 'faire ou laisser faire (quelqu’un)',
    formation: 'radical V-ない godan + せる / V ichidan + させる',
    explanation:
      'Le causatif indique qu’une personne en fait agir une autre ou la laisse agir. Celle qui agit prend に ou を.',
  },
  'causative-passive': {
    meaning: 'être obligé de faire',
    formation: 'V-causatif (〜させ) + られる',
    explanation:
      'Cette forme indique qu’on a été obligé de faire quelque chose contre son gré. Celui qui y a contraint prend に.',
  },
  'sonkei-verbs': {
    meaning: 'verbes honorifiques',
    formation: 'verbes spéciaux : いらっしゃる, おっしゃる, 召し上がる, なさる, ご覧になる',
    explanation:
      'Quelques verbes courants ont leur propre forme honorifique, employée pour les actions d’un supérieur ou d’un client. On ne les utilise jamais pour soi-même.',
  },
  'o-ni-naru': {
    meaning: 'forme honorifique d’un verbe',
    formation: 'お + V-radical + になる',
    explanation:
      'お + radical en -masu + になる élève la personne qui agit. Cela fonctionne pour la plupart des verbes qui n’ont pas de forme honorifique spéciale.',
  },
  'kenjou-verbs': {
    meaning: 'verbes humbles',
    formation: 'verbes spéciaux : 参る, 申す, いたす, 伺う, 拝見する, おる',
    explanation:
      'Les verbes humbles abaissent les actions du locuteur pour marquer le respect envers l’interlocuteur. 参ります remplace 行きます et 来ます.',
  },
  'o-suru': {
    meaning: 'faire humblement (pour quelqu’un)',
    formation: 'お + V-radical + する / いたす',
    explanation:
      'お + radical en -masu + する est une manière humble de proposer ou de faire quelque chose pour un supérieur. Avec いたす, c’est encore plus humble.',
  },
  gozaimasu: {
    meaning: 'être (très poli)',
    explanation:
      'でございます est un です très poli, qu’on entend dans les magasins, les hôtels et les annonces. ございます seul est un あります poli.',
  },
};
