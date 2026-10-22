/** N3 units 40–41: entrance exams and cram school, the rush-hour train (D33). */
import type { Unit } from './types.ts';

export const N3_E: readonly Unit[] = [
  {
    id: 'entrance-exams',
    order: 40,
    level: 3,
    theme: 'Entrance exams and cram school',
    titleJa: '受験とじゅく',
    summary:
      'Getting into a good high school or university means exams, and many pupils study at cram school until late.',
    words: [
      { written: '入学試験', reading: 'にゅうがくしけん' },
      { written: '受ける', reading: 'うける' },
      { written: '競争', reading: 'きょうそう' },
      { written: '激しい', reading: 'はげしい' },
      { written: 'じゅく', reading: 'じゅく' },
      { written: '中学生', reading: 'ちゅうがくせい' },
      { written: '親', reading: 'おや' },
      { written: '費用', reading: 'ひよう' },
      { written: '問題', reading: 'もんだい' },
      { written: '成績', reading: 'せいせき' },
      { written: '不安', reading: 'ふあん' },
      { written: '努力', reading: 'どりょく' },
      { written: '結果', reading: 'けっか' },
      { written: 'がんばる', reading: 'がんばる' },
      { written: '合格', reading: 'ごうかく' },
    ],
    grammar: ['tame-ni', 'ni-totte', 'zu', 'okage-de'],
    passage: {
      sentences: [
        {
          ja: '日本では、高校や大学に入るために、入学試験を受けなければならない。',
          en: 'In Japan you have to pass an entrance exam to get into high school or university.',
        },
        {
          ja: '人気のある学校は競争が激しいので、多くの中学生や高校生が学校の後にじゅくに通っている。',
          en: 'Competition for popular schools is fierce, so many pupils go to cram school after school.',
        },
        {
          ja: 'じゅくでは夜の十時ごろまで勉強することもあり、親にとっては費用も大きな問題だ。',
          en: 'At cram school they sometimes study until ten at night, and for parents the cost is a big issue too.',
        },
        {
          ja: 'わたしも高校三年生のときは、週に四日じゅくに通っていた。',
          en: 'In my last year of high school, I went to cram school four days a week too.',
        },
        {
          ja: 'なかなか成績が上がらず、不安になったこともあった。',
          en: 'My grades would not go up, and at times I got anxious.',
        },
        {
          ja: 'しかし、じゅくの先生が「努力は必ず結果になる」と言ってくれたおかげで、最後までがんばることができた。',
          en: 'But thanks to my cram-school teacher telling me "effort always pays off", I kept going to the end.',
        },
        {
          ja: 'そして春に、行きたかった大学に合格したときは、本当にうれしかった。',
          en: 'And in spring, when I got into the university I wanted, I was truly happy.',
        },
      ],
    },
    questions: [
      {
        kind: 'reason',
        prompt: '多くの中学生や高校生がじゅくに通っているのは、どうしてか。',
        options: [
          '学校の授業がないから',
          '親がじゅくで働いているから',
          '人気の学校は入りにくいから',
          'じゅくの費用が安いから',
        ],
        answer: 2,
        evidence: 1,
        explanation:
          'Line 2 gives the reason with ので: 人気のある学校は競争が激しい, competition makes popular schools hard to get into. The cost is a problem for parents (line 3), not cheap, and nothing says there are no classes or that parents work there.',
      },
      {
        kind: 'content',
        prompt: '親にとって大きな問題は何か。',
        options: ['じゅくの費用', '子どもの成績', '入学試験の日', 'じゅくまでの道'],
        answer: 0,
        evidence: 2,
        explanation: 'Line 3: 親にとっては費用も大きな問題だ.',
      },
      {
        kind: 'content',
        prompt: '筆者は、高校三年生のとき、一週間に何日じゅくに通っていたか。',
        options: ['二日', '三日', '四日', '毎日'],
        answer: 2,
        evidence: 3,
        explanation: 'Line 4: 週に四日じゅくに通っていた.',
      },
      {
        kind: 'reason',
        prompt: '筆者が最後までがんばることができたのは、どうしてか。',
        options: [
          '初めから成績がよかったから',
          '親がじゅくの費用を払ってくれたから',
          '友達と一緒に勉強したから',
          'じゅくの先生の言葉があったから',
        ],
        answer: 3,
        evidence: 5,
        explanation:
          'Line 6: 先生が「努力は必ず結果になる」と言ってくれたおかげで. Line 5 says the grades did not go up easily, so the first option is wrong.',
      },
    ],
  },
  {
    id: 'rush-hour',
    order: 41,
    level: 3,
    theme: 'The rush-hour train',
    titleJa: '満員電車',
    summary:
      'Tokyo trains at eight in the morning are so full that staff push passengers in, though remote work has eased it.',
    words: [
      { written: '通勤', reading: 'つうきん' },
      { written: '満員', reading: 'まんいん' },
      { written: '駅員', reading: 'えきいん' },
      { written: '乗客', reading: 'じょうきゃく' },
      { written: '乗せる', reading: 'のせる' },
      { written: '郊外', reading: 'こうがい' },
      { written: '片道', reading: 'かたみち' },
      { written: 'つらい', reading: 'つらい' },
      { written: '混雑', reading: 'こんざつ' },
      { written: '出勤', reading: 'しゅっきん' },
      { written: '制度', reading: 'せいど' },
      { written: '様子', reading: 'ようす' },
    ],
    grammar: ['ni-yotte', 'okage-de', 'hodo-nai', 'ba'],
    passage: {
      sentences: [
        {
          ja: '東京の朝の電車は、通勤する人でいっぱいになる。',
          en: 'Tokyo’s morning trains fill up with commuters.',
        },
        {
          ja: '特に八時ごろは満員で、駅員が乗客を押して電車に乗せることもある。',
          en: 'Around eight in particular they are packed, and station staff sometimes push passengers on board.',
        },
        {
          ja: '東京で働く人の多くは郊外に住んでいて、片道一時間以上かけて通勤する人も少なくない。',
          en: 'Many people who work in Tokyo live in the suburbs, and quite a few commute over an hour each way.',
        },
        {
          ja: '毎日満員電車に乗るのはつらいので、少し早く家を出て混雑を避ける人もいる。',
          en: 'Riding a packed train every day is hard, so some people leave home a little early to avoid the crowds.',
        },
        {
          ja: 'また、会社によっては、出勤の時間を自分で決めることができる制度もある。',
          en: 'Some companies also have a system that lets staff choose their own start time.',
        },
        {
          ja: '最近は家で仕事をする人が増えたおかげで、前ほど混まなくなったと言われている。',
          en: 'Lately, thanks to more people working from home, trains are said to be less crowded than before.',
        },
        {
          ja: '働き方が変われば、朝の電車の様子もまた変わっていくだろう。',
          en: 'If the way we work changes, the morning train will probably keep changing too.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '八時ごろの電車について、正しいものはどれか。',
        options: [
          '空いていて、座ることができる。',
          '郊外へ行く人が多い。',
          '電車が来ないこともある。',
          '駅員に押されて乗る人もいる。',
        ],
        answer: 3,
        evidence: 1,
        explanation:
          'Line 2: 駅員が乗客を押して電車に乗せることもある, so some passengers are pushed on board by station staff. The trains are packed, so the first option is the opposite, and nothing says trains fail to come.',
      },
      {
        kind: 'content',
        prompt: '混雑を避けるために、どうする人がいるか。',
        options: [
          '会社の近くに引っ越す。',
          '車で通勤する。',
          '早い時間に家を出る。',
          '片道一時間以上歩く。',
        ],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4: 少し早く家を出て混雑を避ける人もいる, some people leave home a little earlier. The hour each way in line 3 is the commute by train, not on foot, and moving house or driving is never mentioned.',
      },
      {
        kind: 'reason',
        prompt: '最近、前ほど混まなくなったと言われているのは、どうしてか。',
        options: [
          '電車の数が前より多くなったから',
          '郊外に住む人が減ったから',
          '駅で働く人が増えたから',
          '会社に行かない人が増えたから',
        ],
        answer: 3,
        evidence: 5,
        explanation:
          'Line 6: 家で仕事をする人が増えたおかげで, more people work from home instead of going to the office. おかげで marks the cause of the good result; more trains, fewer suburbanites or more station staff are never mentioned.',
      },
    ],
  },
];
