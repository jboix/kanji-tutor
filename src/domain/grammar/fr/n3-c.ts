/** French texts for N3 grammar, part C (N9, D53). Written for this app. */
import type { ById, GrammarText } from '../../content-types.ts';

export const FR_N3_C: ById<GrammarText> = {
  'zu-ni': {
    meaning: 'sans faire',
    formation: 'V-ない (radical) + ずに (する → せずに)',
    explanation:
      'ずに est la forme écrite de ないで : 何も言わずに出て行った. À l’oral, il sonne un peu littéraire.',
  },
  ppanashi: {
    meaning: 'laisser (quelque chose) allumé, laissé tel quel',
    formation: 'V-radical + っぱなし',
    explanation:
      'っぱなし dit qu’un état est laissé tel quel alors qu’il aurait fallu s’en occuper, comme une porte restée ouverte. Il contient une légère critique.',
  },
  'toori-ni': {
    meaning: 'exactement comme, de la manière dont',
    formation: 'V-dictionnaire / V-た / N + の + とおりに',
    explanation:
      'とおりに signifie faire quelque chose exactement comme cela a été montré, dit ou prévu. Après un nom sans の, il se lit どおり.',
  },
  'kuse-ni': {
    meaning: 'alors que (avec reproche)',
    formation: 'forme neutre (adj-な + な / N + の) + くせに',
    explanation:
      'くせに ressemble à のに mais blâme la personne : elle devrait savoir. Le ton est dur, on le réserve aux proches ou aux plaintes.',
  },
  'to-shite-mo': {
    meaning: 'même si, à supposer que',
    formation: 'forme neutre + としても',
    explanation:
      'としても fait une supposition, puis dit que le résultat ne changerait pas. Il est plus hypothétique que ても.',
  },
  'ni-shite-wa': {
    meaning: 'pour (un …), compte tenu de',
    formation: 'N / forme neutre + にしては',
    explanation:
      'にしては dit qu’une chose diffère de ce qu’on attendrait de son genre : 初めてにしては上手だ, « bien, pour un premier essai ».',
  },
  'wari-ni': {
    meaning: 'compte tenu de, pour',
    formation: 'forme neutre (adj-な + な / N + の) + わりに',
    explanation:
      'わりに dit qu’un résultat ne correspond pas à ce que laisse attendre la première partie, en bien ou en mal : 値段のわりにおいしい.',
  },
  'tokoro-ga': {
    meaning: 'pourtant (contre toute attente)',
    formation: 'phrase. ところが、phrase',
    explanation:
      'ところが ouvre une phrase dont le résultat va à l’encontre de ce qu’on attendait. Il rapporte des faits, il n’argumente pas.',
  },
  'kawari-ni': {
    meaning: 'au lieu de ; en échange de',
    formation: 'V-dictionnaire / N + の + 代わりに',
    explanation:
      '代わりに remplace une chose par une autre, ou met en balance un bon point et un mauvais.',
  },
  'ippou-de': {
    meaning: 'tandis que, d’un autre côté',
    formation: 'forme neutre (adj-な + な / N + である) + 一方で',
    explanation:
      '一方で oppose deux aspects d’une situation. Il est courant à l’écrit et dans les informations.',
  },
  'koto-wa-ga': {
    meaning: 'c’est vrai que …, mais',
    explanation:
      'Le même mot apparaît deux fois : 安いことは安いが. On concède un point, puis on le nuance par ce qui suit.',
  },
  tatte: {
    meaning: 'même si (familier)',
    formation: 'V-た + って / adj-い (〜くたって)',
    explanation:
      'たって est la forme orale de ても : 雨が降ったって行く. Il est familier et un peu emphatique.',
  },
  'you-ni-wish': {
    meaning: 'pourvu que, puisse …',
    explanation:
      'ますように en fin de phrase exprime un souhait ou une prière, comme sur une plaque votive de sanctuaire : 合格しますように.',
  },
  'to-ii': {
    meaning: 'j’espère que, ce serait bien si',
    formation: 'V-dictionnaire + といい(ね / のに)',
    explanation:
      'といい exprime un espoir sur une chose qu’on ne maîtrise pas : 明日晴れるといいね. Avec のに, il devient un souhait peu probable.',
  },
  'ba-yokatta': {
    meaning: 'j’aurais dû',
    explanation:
      'ばよかった revient avec regret sur quelque chose qui n’a pas été fait. Avec のに, la frustration est plus forte.',
  },
  'sasete-kudasai': {
    meaning: 'laissez-moi, permettez-moi de',
    formation: 'V-causatif (〜させ) + てください',
    explanation:
      'Le causatif suivi de てください demande la permission de faire soi-même quelque chose : 休ませてください, « laissez-moi me reposer, s’il vous plaît ».',
  },
  'te-itadakemasen-ka': {
    meaning: 'pourriez-vous …? (très poli)',
    explanation:
      'C’est l’une des façons les plus polies de demander un service. On demande si l’on pourrait humblement recevoir l’action.',
  },
  'sasete-itadaku': {
    meaning: 'se permettre humblement de (avec votre permission)',
    formation: 'V-causatif (〜させ) + ていただく',
    explanation:
      'させていただく présente sa propre action comme une chose qu’on a la permission de faire. Il est courant dans le monde professionnel, parfois trop.',
  },
  'tokoro-datta': {
    meaning: 'faillir, presque',
    formation: 'V-dictionnaire + ところだった',
    explanation:
      'ところだった dit qu’une chose a failli arriver mais n’est pas arrivée, souvent avec soulagement : 車にひかれるところだった.',
  },
  'ta-tokoro': {
    meaning: 'venir de faire',
    explanation:
      'たところだ place le locuteur juste après une action, à cet instant précis. たばかり admet qu’un peu plus de temps se soit écoulé.',
  },
  'te-bakari-iru': {
    meaning: 'ne faire que',
    explanation:
      'てばかりいる se plaint que quelqu’un fait toujours la même chose et rien d’autre : 遊んでばかりいる.',
  },
  chau: {
    meaning: 'finir par faire (てしまう familier)',
    explanation:
      'ちゃう est la contraction orale de てしまう. Il garde les mêmes nuances d’achèvement ou de regret.',
  },
  toku: {
    meaning: 'faire à l’avance (ておく familier)',
    explanation:
      'とく est la contraction orale de ておく : 買っとく, « je l’achète maintenant pour plus tard ».',
  },
  'te-ru': {
    meaning: 'être en train de (ている familier)',
    explanation:
      'てる supprime le い de ている dans la langue familière. 見てる équivaut simplement à 見ている.',
  },
  'bakari-da': {
    meaning: 'ne cesser de (empirer)',
    formation: 'V-dictionnaire + ばかりだ',
    explanation:
      'Après la forme du dictionnaire d’un verbe de changement, ばかりだ dit que le changement se poursuit dans une seule direction, généralement mauvaise.',
  },
};
