/** N4 units 20–22: table manners, shrines and temples, Japanese school (D33). */
import type { Unit } from './types.ts';

export const N4_C: readonly Unit[] = [
  {
    id: 'table-manners',
    order: 20,
    level: 4,
    theme: 'Japanese food and table manners',
    titleJa: 'わしょくとマナー',
    summary:
      'Meals open and close with set words of thanks, and chopsticks come with a few firm rules.',
    words: [
      { written: 'わしょく', reading: 'わしょく' },
      { written: 'いただきます', reading: 'いただきます' },
      { written: 'ごちそうさま', reading: 'ごちそうさま' },
      { written: 'かんしゃ', reading: 'かんしゃ' },
      { written: '意味', reading: 'いみ' },
      { written: '気をつける', reading: 'きをつける' },
      { written: '例えば', reading: 'たとえば' },
      { written: '茶碗', reading: 'ちゃわん' },
      { written: '箸', reading: 'はし' },
      { written: 'さす', reading: 'さす' },
      { written: '失礼', reading: 'しつれい' },
      { written: 'みそしる', reading: 'みそしる' },
      { written: 'スプーン', reading: 'スプーン' },
      { written: '使い方', reading: 'つかいかた' },
    ],
    grammar: ['to-iu', 'koto-ga-dekiru', 'tari-tari', 'toki'],
    passage: {
      sentences: [
        {
          ja: '日本人は食べる前に「いただきます」、食べた後で「ごちそうさまでした」と言います。',
          en: 'Japanese people say "itadakimasu" before eating and "gochisōsama deshita" afterwards.',
        },
        {
          ja: 'これは、料理を作った人や食べ物にかんしゃするという意味です。',
          en: 'This means thanking the people who made the food, and the food itself.',
        },
        {
          ja: 'わしょくを食べるときには、気をつけることがいくつかあります。',
          en: 'There are a few things to be careful about when eating Japanese food.',
        },
        {
          ja: '例えば、ご飯の茶碗は手に持って食べます。',
          en: 'For example, you hold your rice bowl in your hand as you eat.',
        },
        {
          ja: '箸を食べ物にさしたり、箸から箸へ食べ物を渡したりするのは失礼です。',
          en: 'Stabbing food with your chopsticks or passing food from chopsticks to chopsticks is rude.',
        },
        {
          ja: 'また、みそしるを飲むときは、スプーンを使いません。',
          en: 'Also, you do not use a spoon for miso soup.',
        },
        {
          ja: '最初は難しかったですが、今は箸を上手に使うことができます。',
          en: 'It was hard at first, but now I can use chopsticks well.',
        },
      ],
    },
    questions: [
      {
        kind: 'reference',
        prompt: '「これ」は何のことですか。',
        options: [
          'わしょくのいろいろな料理',
          '食べる前と後のあいさつ',
          '箸の正しい使い方',
          '料理を作った人',
        ],
        answer: 1,
        evidence: 0,
        explanation:
          'これ in line 2 points back to the two set phrases in line 1, the greetings said before and after eating. Line 2 then explains what they mean; washoku and chopsticks only come up later.',
      },
      {
        kind: 'content',
        prompt: '失礼なことはどれですか。',
        options: [
          '茶碗を手に持って食べること',
          '「いただきます」と言うこと',
          '箸で食べ物をさすこと',
          'みそしるをスプーンで飲まないこと',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: 箸を食べ物にさしたり…するのは失礼です. Holding the bowl and drinking soup without a spoon are the correct ways.',
      },
      {
        kind: 'content',
        prompt: 'みそしるを飲むとき、何を使いませんか。',
        options: ['箸', '茶碗', '手', 'スプーン'],
        answer: 3,
        evidence: 5,
        explanation: 'Line 6: みそしるを飲むときは、スプーンを使いません.',
      },
    ],
  },
  {
    id: 'shrines-and-temples',
    order: 21,
    level: 4,
    theme: 'Shrines and temples',
    titleJa: '神社とお寺',
    summary:
      'Shinto shrines and Buddhist temples stand side by side, and each has its own way to pray.',
    words: [
      { written: '神社', reading: 'じんじゃ' },
      { written: '違う', reading: 'ちがう' },
      { written: '神道', reading: 'しんとう' },
      { written: 'とりい', reading: 'とりい' },
      { written: 'ぶっきょう', reading: 'ぶっきょう' },
      { written: 'おまいり', reading: 'おまいり' },
      { written: 'すず', reading: 'すず' },
      { written: '鳴らす', reading: 'ならす' },
      { written: 'たたく', reading: 'たたく' },
      { written: '礼', reading: 'れい' },
      { written: '静か', reading: 'しずか' },
      { written: 'お守り', reading: 'おまもり' },
    ],
    grammar: ['toki', 'naide', 'koto-ga-dekiru'],
    passage: {
      sentences: [
        {
          ja: '日本には神社とお寺がたくさんありますが、この二つは違うものです。',
          en: 'Japan has many shrines and temples, but the two are different things.',
        },
        {
          ja: '神社は神道の場所で、入口に赤いとりいがあります。',
          en: 'A shrine belongs to Shinto and has a red torii gate at the entrance.',
        },
        { ja: 'お寺はぶっきょうの場所です。', en: 'A temple belongs to Buddhism.' },
        {
          ja: '神社でおまいりするときは、まず小さいお金を入れて、すずを鳴らします。',
          en: 'When you pray at a shrine, you first drop in a small coin and ring the bell.',
        },
        {
          ja: 'それから礼を二回して、手を二回たたいてから、おねがいをします。',
          en: 'Then you bow twice, clap twice and make your wish.',
        },
        {
          ja: 'お寺では手をたたかないで、静かに手を合わせます。',
          en: 'At a temple you do not clap; you quietly put your hands together.',
        },
        {
          ja: '神社では、お守りを買うこともできます。',
          en: 'At a shrine you can also buy a good-luck charm.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '神社の入口には何がありますか。',
        options: ['すず', 'とりい', 'お守り', '大きい寺'],
        answer: 1,
        evidence: 1,
        explanation:
          'Line 2: 入口に赤いとりいがあります. The bell is where you pray, and charms are sold inside.',
      },
      {
        kind: 'content',
        prompt: '神社でおまいりするとき、最初に何をしますか。',
        options: [
          '手を二回たたきます。',
          '礼を二回します。',
          'お金を少し入れます。',
          'お守りを買います。',
        ],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4 starts with まず, "first": 小さいお金を入れて, a little money goes in. Bowing and clapping come after, in line 5.',
      },
      {
        kind: 'content',
        prompt: 'お寺でしないことはどれですか。',
        options: ['手を鳴らすこと', '手を合わせること', '静かにすること', 'おまいりすること'],
        answer: 0,
        evidence: 5,
        explanation:
          'Line 6: お寺では手をたたかないで: no clapping (手を鳴らす) at temples. Clapping belongs to shrines; at temples you put your hands together quietly.',
      },
    ],
  },
  {
    id: 'japanese-school',
    order: 22,
    level: 4,
    theme: 'A Japanese school',
    titleJa: '日本の学校',
    summary:
      'Pupils clean their own classrooms, serve each other lunch and stay late for club activities.',
    words: [
      { written: '中学校', reading: 'ちゅうがっこう' },
      { written: '生徒', reading: 'せいと' },
      { written: '多く', reading: 'おおく' },
      { written: '放課後', reading: 'ほうかご' },
      { written: 'せいふく', reading: 'せいふく' },
      { written: '通う', reading: 'かよう' },
      { written: '教室', reading: 'きょうしつ' },
      { written: '廊下', reading: 'ろうか' },
      { written: '小学校', reading: 'しょうがっこう' },
      { written: 'きゅうしょく', reading: 'きゅうしょく' },
      { written: '当番', reading: 'とうばん' },
      { written: '配る', reading: 'くばる' },
      { written: '部活', reading: 'ぶかつ' },
      { written: '運動会', reading: 'うんどうかい' },
    ],
    grammar: ['nakereba-naranai', 'te-kureru', 'ni-iku'],
    passage: {
      sentences: [
        { ja: '日本の学校は四月に始まります。', en: 'The Japanese school year starts in April.' },
        {
          ja: '中学校や高校では、多くの生徒がせいふくを着て学校に通います。',
          en: 'In junior and senior high school, most pupils go to school in uniform.',
        },
        {
          ja: '授業の後は、生徒たちが自分で教室や廊下を掃除します。',
          en: 'After class, the pupils clean the classrooms and corridors themselves.',
        },
        {
          ja: '小学校では、昼ご飯にきゅうしょくが出ます。',
          en: 'In primary school, lunch is served at school.',
        },
        {
          ja: 'きゅうしょくの当番の生徒は、白い服を着て、みんなに料理を配ります。',
          en: 'The pupils on lunch duty put on white coats and serve the food to everyone.',
        },
        {
          ja: '放課後は部活があって、スポーツや音楽など、好きなことをします。',
          en: 'After school there are clubs, where pupils do what they like, such as sport or music.',
        },
        {
          ja: 'わたしは中学校のとき、テニス部だったので、毎日遅くまで練習しなければなりませんでした。',
          en: 'In junior high I was in the tennis club, so I had to practise until late every day.',
        },
        {
          ja: '秋の運動会には、家族も見に来てくれます。',
          en: 'Families come to watch the autumn sports day too.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '日本の学校はいつ始まりますか。',
        options: ['一月', '四月', '九月', '十月'],
        answer: 1,
        evidence: 0,
        explanation:
          'Line 1: 日本の学校は四月に始まります. Autumn is when the sports day takes place.',
      },
      {
        kind: 'content',
        prompt: '授業の後、だれが教室を掃除しますか。',
        options: ['先生たち', '掃除の会社の人', '子どもたち', '生徒の家族'],
        answer: 2,
        evidence: 2,
        explanation:
          'Line 3: 生徒たちが自分で教室や廊下を掃除します. 自分で stresses that the pupils, the children themselves, do it: not the teachers, a cleaning company or their families.',
      },
      {
        kind: 'content',
        prompt: 'きゅうしょくの当番の生徒は何をしますか。',
        options: [
          '料理を作ります。',
          '教室を掃除します。',
          '先生にきゅうしょくを持っていきます。',
          'みんなに食べ物を渡します。',
        ],
        answer: 3,
        evidence: 4,
        explanation:
          'Line 5: 白い服を着て、みんなに料理を配ります: they hand the food out to everyone. The text does not say they cook it or bring it to the teacher, and cleaning happens after class.',
      },
    ],
  },
];
