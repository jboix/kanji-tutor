/** English messages: the guides (verb groups, the て-form, plain and polite, adjectives, keigo). */
export const guides = {
  title: 'Guides',
  tile: 'Guides',
  tileDetail: 'Verb groups, the て-form, keigo, conjugation',
  intro: 'References to come back to while you learn. Each lesson that needs one links to it.',
  back: 'Back',
  missing: 'There is no guide called {id}.',
  levelTag: 'N{level}',
  readGuide: 'Guide: {title}',
  tutorMore: 'Give me more examples for {x}',
  tutorQuiz: 'Quiz me on {x}',
  colDict: 'Dictionary',
  colMasu: 'ます',
  colNai: 'ない',
  colPlain: 'Plain',
  colPolite: 'Polite',
  colSonkei: 'Respectful',
  colKenjou: 'Humble',
  colVerb: 'Verb',

  'verb-groups': 'Verb groups',
  'verb-groupsDetail': 'Which group a verb is in, and how to tell',
  'verb-groupsLead':
    'Every verb but two belongs to group 1 or group 2, and the group decides how it conjugates. In the dictionary, every verb ends in an u-sound.',
  godanTitle: 'Group 1 · 五段 (う-verbs)',
  godanText:
    'The last kana moves along its row of the kana table: 書か・書き・書く・書け・書こ. Before ます it takes the i-sound (書きます), before ない the a-sound (書かない).',
  ichidanTitle: 'Group 2 · 一段 (る-verbs)',
  ichidanText: 'They end in -iru or -eru, and る simply drops: 食べる → 食べます, 食べない.',
  irregularTitle: 'Group 3 · irregular',
  irregularText:
    'Only する and 来る (くる), with every noun + する (勉強する). Learn their forms by heart.',
  tellTitle: 'How to tell',
  tellText:
    'Not ending in る: group 1. Ending in る after an a, u or o sound (分かる, 作る, 乗る): group 1. Ending in -iru or -eru: usually group 2, but a few common verbs are group 1:',

  'plain-polite': 'Dictionary and polite forms',
  'plain-politeDetail': '辞書形 and ます形, and when to use each',
  'plain-politeLead':
    'Each verb has a plain form (the dictionary form, 辞書形, and its relatives) and a polite form with ます. They mean the same; the polite one is for people you are not close to.',
  pairsTitle: 'The four pairs',
  pairsText: 'Present and past, positive and negative, plain beside polite:',
  whenTitle: 'When the plain form is used',
  whenText:
    'Between friends and family, in diaries and articles, and inside a sentence: before 〜と思います, 〜ことができます, 〜前に or a noun (読む本), the verb stays plain even in a polite sentence.',

  'te-form': 'The て-form and た-form',
  'te-formDetail': 'The sound changes, in one table',
  'te-formLead':
    'The て-form links actions (〜て、〜), asks (〜てください) and makes 〜ている. The た-form is the plain past. Both change the same way: た and だ follow て and で.',
  rulesTitle: 'Group 1, by the last kana',
  rulesText:
    'Read it as a chant: う・つ・る → って, む・ぶ・ぬ → んで, く → いて, ぐ → いで, す → して.',
  othersTitle: 'Group 2, irregulars, and 行く',
  othersText:
    'Group 2 just swaps る for て. する and 来る are irregular, and 行く is the one く-verb that takes って.',

  adjectives: 'Adjective forms',
  adjectivesDetail: 'い- and な-adjectives, plain and polite',
  adjectivesLead:
    'い-adjectives conjugate themselves: their い changes. な-adjectives work like nouns: what follows them changes.',
  iTitle: 'い-adjectives',
  iText:
    'い becomes くない, かった, くなかった, くて. いい is irregular: its forms come from よい (よくない, よかった).',
  naTitle: 'な-adjectives',
  naText:
    'The adjective stays; だ, じゃない, だった and で follow it. Before a noun it takes な: 静かな部屋.',
  rowPresent: 'Present',
  rowNegative: 'Negative',
  rowPast: 'Past',
  rowNegativePast: 'Past negative',
  rowTe: 'て-form',

  conjugation: 'Conjugation table',
  conjugationDetail: 'Any verb in every form',
  conjugationLead:
    'Pick a verb, or type any verb in its dictionary form, to see it in every form. The level shows when each form is taught.',
  pickVerb: 'A verb',
  typeVerb: 'Any verb',
  typeVerbPlaceholder: 'Dictionary form, e.g. 遊ぶ or あそぶ',
  notAVerb: '{text} is not a verb we know. Type its dictionary form, like 泳ぐ.',
  groupOf: 'Group {n}',
  formDict: 'Dictionary form',
  formMasu: 'Polite',
  formNai: 'Negative',
  formTa: 'Past',
  formNakatta: 'Past negative',
  formTe: 'て-form',
  formTai: 'Want to',
  formVolitional: 'Let’s (plain)',
  formPotential: 'Can (potential)',
  formPassive: 'Passive',
  formCausative: 'Causative',
  formImperative: 'Command',
  formBa: 'If (ば)',
  formTara: 'If, when (たら)',

  keigo: 'Keigo',
  keigoDetail: 'Polite, respectful and humble speech',
  keigoLead:
    'Keigo has three layers. 丁寧語 is the polite です and ます. 尊敬語 raises the person you talk about, for what they do. 謙譲語 lowers yourself, for what you do for them.',
  verbsTitle: 'Verbs with their own words',
  verbsText: 'The most common verbs change into another word altogether:',
  patternsTitle: 'The patterns for other verbs',
  patternsText: 'Most verbs follow a pattern instead:',
  patternoNiNaru: 'Respectful, for what they do',
  patternreru: 'Respectful, lighter: the passive form',
  patternoSuru: 'Humble, for what you do for them',
  patterngoSuru: 'Humble, with a する-noun',
  sentencesTitle: 'In sentences',
  sentenceirassharu: 'What time will the teacher come?',
  sentenceoKaeri: 'The manager has already gone home.',
  sentenceokuri: 'I’ll take you to the station.',
  sentencemoushimasu: 'My name is Tanaka.',
} as const;
