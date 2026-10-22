/** N4 units 14–16: hot springs, a summer festival, sorting rubbish. */
import type { Unit } from './types.ts';

export const N4_A: readonly Unit[] = [
  {
    id: 'hot-springs',
    order: 14,
    level: 4,
    theme: 'A night at a hot spring',
    titleJa: 'おんせん',
    summary:
      'Hot-spring inns come with their own etiquette: wash first, keep the towel out of the water.',
    words: [
      { written: 'おんせん', reading: 'おんせん' },
      { written: '旅館', reading: 'りょかん' },
      { written: '泊まる', reading: 'とまる' },
      { written: 'ゆかた', reading: 'ゆかた' },
      { written: '規則', reading: 'きそく' },
      { written: 'タオル', reading: 'タオル' },
      { written: 'いれずみ', reading: 'いれずみ' },
      { written: 'ろてんぶろ', reading: 'ろてんぶろ' },
      { written: '景色', reading: 'けしき' },
      { written: '気持ち', reading: 'きもち' },
      { written: '初めて', reading: 'はじめて' },
      { written: 'ぜひ', reading: 'ぜひ' },
      { written: 'どういう', reading: 'どういう' },
    ],
    grammar: ['nakereba-naranai', 'te-miru', 'tara'],
    passage: {
      sentences: [
        {
          ja: '先月、家族と初めておんせんに行きました。',
          en: 'Last month I went to a hot spring with my family for the first time.',
        },
        {
          ja: '山の中の古い旅館に泊まって、夜はゆかたを着て晩ご飯を食べました。',
          en: 'We stayed at an old inn in the mountains and had dinner in yukata in the evening.',
        },
        {
          ja: '日本のおんせんには、いくつか規則があります。',
          en: 'Japanese hot springs have a few rules.',
        },
        {
          ja: 'まず、おんせんに入る前に、体をよく洗わなければなりません。',
          en: 'First, you must wash yourself well before getting into the bath.',
        },
        {
          ja: 'それから、タオルをおんせんの中に入れてはいけません。',
          en: 'Then, you must not put your towel in the water.',
        },
        {
          ja: 'いれずみがある人は入れないおんせんもあります。',
          en: 'Some hot springs do not let in people with tattoos.',
        },
        {
          ja: 'ろてんぶろからは山の景色が見えて、とても気持ちがよかったです。',
          en: 'From the outdoor bath we could see the mountains, and it felt wonderful.',
        },
        {
          ja: '日本に来たら、ぜひ一度おんせんに入ってみてください。',
          en: 'If you come to Japan, do try a hot spring at least once.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'おんせんに入る前に、何をしなければなりませんか。',
        options: [
          'ゆかたを着ること',
          '体を洗っておくこと',
          'タオルを入れること',
          '晩ご飯を先に食べること',
        ],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: 入る前に、体をよく洗わなければなりません, so you wash beforehand (〜ておく). The yukata and dinner are part of the inn stay, not a bath rule, and the towel must stay out of the water.',
      },
      {
        kind: 'content',
        prompt: 'おんせんでしてはいけないことは何ですか。',
        options: [
          'ろてんぶろに長く入ること',
          'おゆにタオルを入れること',
          'ゆかたを着て晩ご飯を食べること',
          '山の景色を見ること',
        ],
        answer: 1,
        evidence: 4,
        explanation:
          'Line 5: タオルをおんせんの中に入れてはいけません: the towel must not go into the water (おゆ). The outdoor bath and the view are what the writer enjoyed, and the yukata dinner was part of the inn stay.',
      },
      {
        kind: 'phrase-meaning',
        prompt: '「気持ちがよかった」は、ここではどういう意味ですか。',
        options: [
          'お風呂が熱すぎて、大変だった。',
          'ゆっくりできて、うれしかった。',
          '人が多くて、うるさかった。',
          '景色が見えなくて、残念だった。',
        ],
        answer: 1,
        evidence: 6,
        explanation:
          'In line 7 気持ちがいい describes how the bath felt: pleasant and relaxing, so the writer could unwind and was glad. Nothing says the water was too hot or the place noisy, and the view was visible (見えて), so the last option is the opposite of the text.',
      },
    ],
  },
  {
    id: 'summer-festival',
    order: 15,
    level: 4,
    theme: 'The neighbourhood summer festival',
    titleJa: 'お祭り',
    summary:
      'Every neighbourhood has its festival: food stalls, a portable shrine, drums and fireworks.',
    words: [
      { written: 'お祭り', reading: 'おまつり' },
      { written: '屋台', reading: 'やたい' },
      { written: '並ぶ', reading: 'ならぶ' },
      { written: 'みこし', reading: 'みこし' },
      { written: 'かつぐ', reading: 'かつぐ' },
      { written: '重い', reading: 'おもい' },
      { written: 'ぼんおどり', reading: 'ぼんおどり' },
      { written: 'たいこ', reading: 'たいこ' },
      { written: '踊る', reading: 'おどる' },
      { written: '花火', reading: 'はなび' },
      { written: '最後', reading: 'さいご' },
      { written: '合わせる', reading: 'あわせる' },
      { written: '去年', reading: 'きょねん' },
    ],
    grammar: ['to-conditional', 'causative', 'te-morau'],
    passage: {
      sentences: [
        {
          ja: 'わたしの町では、毎年八月にお祭りがあります。',
          en: 'My town has a festival every August.',
        },
        {
          ja: 'お祭りの日には、道にたくさんの屋台が並びます。',
          en: 'On festival days the streets are lined with food stalls.',
        },
        {
          ja: '子どもたちはゆかたを着て、屋台で食べ物を買ったり、遊んだりします。',
          en: 'Children wear yukata, buy food at the stalls and play.',
        },
        {
          ja: '午後になると、町の人たちがみこしをかついで歩きます。',
          en: 'In the afternoon, local people carry the portable shrine through the streets.',
        },
        {
          ja: 'みこしはとても重いので、二十人ぐらいでかつぎます。',
          en: 'The shrine is very heavy, so about twenty people carry it.',
        },
        {
          ja: '夜はぼんおどりがあって、たいこが鳴ると、みんなはその音に合わせて踊ります。',
          en: 'At night there is bon dancing; when the drum sounds, everyone dances to its beat.',
        },
        {
          ja: '最後に大きい花火が上がると、お祭りは終わりです。',
          en: 'When the big fireworks go up at the end, the festival is over.',
        },
        {
          ja: '去年は、わたしもみこしをかつがせてもらいました。',
          en: 'Last year I was allowed to help carry the shrine too.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'みこしはどうやって運びますか。',
        options: [
          '車で運びます。',
          '一人で持ちます。',
          'たくさんの人でかつぎます。',
          '子どもたちだけでかつぎます。',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: みこしはとても重いので、二十人ぐらいでかつぎます: about twenty people, many people together. It is too heavy for one person, it goes on shoulders, not in a car, and the children are busy at the stalls while the adults carry it.',
      },
      {
        kind: 'reference',
        prompt: '「その音」は何の音ですか。',
        options: ['花火の音', 'みこしの音', '屋台の音', 'たいこの音'],
        answer: 3,
        evidence: 5,
        explanation:
          'その points back within line 6 to たいこが鳴ると: the dancers move to the sound of the drum. The fireworks only come at the end.',
      },
      {
        kind: 'content',
        prompt: 'お祭りはいつ終わりますか。',
        options: [
          '大きい花火が上がったとき',
          'ぼんおどりが始まったとき',
          'みこしが町を歩いたとき',
          '屋台で食べ物がなくなったとき',
        ],
        answer: 0,
        evidence: 6,
        explanation:
          'Line 7: 最後に大きい花火が上がると、お祭りは終わりです. The dancing and the shrine come earlier in the day.',
      },
    ],
  },
  {
    id: 'sorting-rubbish',
    order: 16,
    level: 4,
    theme: 'Sorting the rubbish',
    titleJa: 'ゴミの分別',
    summary:
      'Rubbish is sorted by type and put out only on its day; neighbours notice when you get it wrong.',
    words: [
      { written: 'ゴミ', reading: 'ゴミ' },
      { written: '分別', reading: 'ぶんべつ' },
      { written: '捨てる', reading: 'すてる' },
      { written: 'もえる', reading: 'もえる' },
      { written: '分ける', reading: 'わける' },
      { written: '瓶', reading: 'びん' },
      { written: '曜日', reading: 'ようび' },
      { written: '決まる', reading: 'きまる' },
      { written: 'しげん', reading: 'しげん' },
      { written: '間違える', reading: 'まちがえる' },
      { written: '近所', reading: 'きんじょ' },
      { written: '親切', reading: 'しんせつ' },
      { written: '慣れる', reading: 'なれる' },
    ],
    grammar: ['nakereba-naranai', 'hou-ga-ii', 'te-shimau', 'te-kureru'],
    passage: {
      sentences: [
        {
          ja: '日本では、ゴミを捨てるとき、分別しなければなりません。',
          en: 'In Japan you have to sort your rubbish when you throw it away.',
        },
        {
          ja: 'もえるゴミ、もえないゴミ、かんや瓶などに分けて出します。',
          en: 'You put it out separated into burnable, non-burnable, cans, bottles and so on.',
        },
        { ja: 'ゴミを出す曜日も決まっています。', en: 'The day for each kind is fixed too.' },
        {
          ja: 'わたしの町では、もえるゴミは月曜日と木曜日に出します。',
          en: 'In my town, burnable rubbish goes out on Mondays and Thursdays.',
        },
        {
          ja: 'かんや瓶はしげんになるので、洗ってから出したほうがいいです。',
          en: 'Cans and bottles are recycled, so it is best to rinse them before putting them out.',
        },
        {
          ja: '日本に来たばかりのころ、わたしは曜日を間違えてゴミを出してしまいました。',
          en: 'When I had just arrived in Japan, I put my rubbish out on the wrong day.',
        },
        {
          ja: 'そのとき、近所の人が親切に教えてくれました。',
          en: 'A neighbour kindly explained the rules to me then.',
        },
        { ja: '今は、分別にもすっかり慣れました。', en: 'Now I am completely used to sorting.' },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この人の町では、もえるゴミを一週間に何回出しますか。',
        options: ['一回', '二回', '三回', '毎日'],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: もえるゴミは月曜日と木曜日に出します, Monday and Thursday, so twice a week. Line 3 adds that every kind of rubbish has fixed days, so not every day.',
      },
      {
        kind: 'reason',
        prompt: 'どうしてかんや瓶は洗ってから出したほうがいいですか。',
        options: [
          'もえるゴミだからです。',
          'もう一度使うからです。',
          '近所の人が怒るからです。',
          '曜日が決まっているからです。',
        ],
        answer: 1,
        evidence: 4,
        explanation:
          'Line 5 gives the reason with ので: しげんになる, they become a resource, so they get used again. Cans are not burnable rubbish, the neighbour was never angry, and the fixed days are a separate rule.',
      },
      {
        kind: 'content',
        prompt: 'この人が曜日を間違えたとき、近所の人はどうしましたか。',
        options: [
          'とても怒りました。',
          'ゴミを家の前に返しました。',
          'やさしく教えてくれました。',
          '何も言わないで帰りました。',
        ],
        answer: 2,
        evidence: 6,
        explanation:
          'Line 7: 近所の人が親切に教えてくれました: 親切に means kindly (やさしく). Nobody got angry, returned the rubbish or kept silent; the neighbour explained the rules.',
      },
    ],
  },
];
