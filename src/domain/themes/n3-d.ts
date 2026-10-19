/** N3 units 37–39: plastic food models, the rainy season and typhoons, Obon (D33). */
import type { Unit } from './types.ts';

export const N3_D: readonly Unit[] = [
  {
    id: 'food-models',
    order: 37,
    level: 3,
    theme: 'Plastic food in the window',
    titleJa: '食品サンプル',
    summary:
      'Restaurant windows show handmade replicas of every dish, so you can order without reading.',
    words: [
      { written: '見本', reading: 'みほん' },
      { written: '食品', reading: 'しょくひん' },
      { written: 'サンプル', reading: 'サンプル' },
      { written: '本物', reading: 'ほんもの' },
      { written: 'そっくり', reading: 'そっくり' },
      { written: 'メニュー', reading: 'メニュー' },
      { written: '量', reading: 'りょう' },
      { written: '値段', reading: 'ねだん' },
      { written: '一目', reading: 'ひとめ' },
      { written: '観光客', reading: 'かんこうきゃく' },
      { written: '職人', reading: 'しょくにん' },
      { written: '技術', reading: 'ぎじゅつ' },
      { written: '天ぷら', reading: 'てんぷら' },
    ],
    grammar: ['to-yobareru', 'ba', 'te-mo', 'ni-totte'],
    passage: {
      sentences: [
        {
          ja: '日本のレストランでは、店の前に料理の見本が並んでいることが多い。',
          en: 'Japanese restaurants often display models of their dishes out front.',
        },
        {
          ja: 'これは「食品サンプル」と呼ばれ、本物そっくりに作られている。',
          en: 'These are called food samples and are made to look exactly like the real thing.',
        },
        {
          ja: '食品サンプルがあれば、メニューを読まなくても、料理の量や値段が一目でわかる。',
          en: 'With food samples you can see a dish’s size and price at a glance, without reading the menu.',
        },
        {
          ja: 'そのため、日本語がわからない観光客にとっても便利だ。',
          en: 'That makes them handy for tourists who do not understand Japanese.',
        },
        {
          ja: '食品サンプルは職人が一つずつ手で作っていて、高い技術が必要だ。',
          en: 'Each sample is made by hand by a craftsperson, and it takes great skill.',
        },
        {
          ja: '東京には食品サンプルの店が集まっている町があって、サンプルを作る体験もできる。',
          en: 'Tokyo has a district full of food-sample shops, where you can even try making one.',
        },
        {
          ja: 'わたしも天ぷらのサンプルを作ってみたが、思ったより難しかった。',
          en: 'I tried making a tempura sample myself, and it was harder than I expected.',
        },
      ],
    },
    questions: [
      {
        kind: 'reference',
        prompt: '「これ」は、何を指しているか。',
        options: [
          'レストランのメニュー',
          '店の前の料理の見本',
          '店で出す本物の料理',
          '食品サンプルの店',
        ],
        answer: 1,
        evidence: 0,
        explanation:
          'これ opens line 2 and points back to line 1: 店の前に料理の見本が並んでいる, the dish models in front of the restaurant. Line 2 adds that they are made to look just like the real thing, so they are not real food.',
      },
      {
        kind: 'content',
        prompt: '食品サンプルがあると、何が一目でわかるか。',
        options: ['量と値段', '味とにおい', '職人の名前', '店の名前'],
        answer: 0,
        evidence: 2,
        explanation:
          'Line 3: 料理の量や値段が一目でわかる, you see at a glance how much food there is and what it costs. Taste and smell cannot be seen, and no names are mentioned.',
      },
      {
        kind: 'content',
        prompt: '食品サンプルの店が集まっている町では、何ができるか。',
        options: [
          '天ぷらを安く食べること',
          '日本語を勉強すること',
          'メニューを書くこと',
          '自分で見本を作ること',
        ],
        answer: 3,
        evidence: 5,
        explanation:
          'Line 6: サンプルを作る体験もできる, visitors can try making a sample themselves. The tempura in line 7 is a sample the writer made, not a meal, and nothing mentions lessons or menus.',
      },
    ],
  },
  {
    id: 'rain-and-typhoons',
    order: 38,
    level: 3,
    theme: 'The rainy season and typhoons',
    titleJa: '梅雨と台風',
    summary:
      'Early summer brings weeks of damp heat, and late summer brings typhoons that stop the trains.',
    words: [
      { written: '時期', reading: 'じき' },
      { written: '続く', reading: 'つづく' },
      { written: 'しっけ', reading: 'しっけ' },
      { written: 'むし暑い', reading: 'むしあつい' },
      { written: '洗濯物', reading: 'せんたくもの' },
      { written: '乾く', reading: 'かわく' },
      { written: 'カビ', reading: 'カビ' },
      { written: '生える', reading: 'はえる' },
      { written: '本格的', reading: 'ほんかくてき' },
      { written: '台風', reading: 'たいふう' },
      { written: '近づく', reading: 'ちかづく' },
      { written: '天気予報', reading: 'てんきよほう' },
      { written: '進む', reading: 'すすむ' },
      { written: '伝える', reading: 'つたえる' },
    ],
    grammar: ['ni-kakete', 'shi', 'koto-ga-aru', 'teki'],
    passage: {
      sentences: [
        {
          ja: '六月から七月にかけて、日本の多くの地方は梅雨に入る。',
          en: 'From June into July, much of Japan enters the rainy season.',
        },
        {
          ja: 'この時期は雨の日が続き、しっけが多くてむし暑い。',
          en: 'At this time rainy days go on and on, and it is humid and muggy.',
        },
        {
          ja: '洗濯物がなかなか乾かないし、部屋にカビが生えることもあるので、困っている人が多い。',
          en: 'Laundry will not dry, and mould can even grow in your room, so many people struggle.',
        },
        {
          ja: '梅雨が終わると本格的な夏が始まり、八月から九月にかけては台風がよく来る。',
          en: 'When the rainy season ends, real summer begins, and from August to September typhoons often come.',
        },
        {
          ja: '台風が近づくと、天気予報で毎日その進む道が伝えられる。',
          en: 'When a typhoon approaches, the forecast reports its path every day.',
        },
        {
          ja: '強い台風のときは、電車が止まったり、学校が休みになったりすることもある。',
          en: 'With a strong typhoon, trains may stop and schools may close.',
        },
        {
          ja: 'そのため、台風が来る前に、窓を閉めて外の物を家の中に入れておくなど、準備が必要だ。',
          en: 'So before a typhoon you need to prepare, for example by shutting the windows and bringing things in from outside.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '梅雨の時期について、正しいものはどれか。',
        options: [
          'むし暑くて雨が多い。',
          '雨が少なくて涼しい。',
          '台風がよく来る。',
          '洗濯物がよく乾く。',
        ],
        answer: 0,
        evidence: 1,
        explanation:
          'Line 2: 雨の日が続き、しっけが多くてむし暑い, rainy days in a row and muggy heat. Typhoons come later, in August and September (line 4), and laundry does not dry (line 3).',
      },
      {
        kind: 'content',
        prompt: '台風がよく来るのは、いつか。',
        options: ['六月と七月', '八月と九月', '十月と十一月', '十二月と一月'],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: 八月から九月にかけては台風がよく来る. June and July are the rainy season (line 1), and the other months are not mentioned.',
      },
      {
        kind: 'content',
        prompt: '台風が来る前にすることとして、文章に書いてあるものはどれか。',
        options: [
          '学校を休みにする。',
          '天気予報を毎日伝える。',
          '洗濯物を外に出す。',
          '外の物を中に入れる。',
        ],
        answer: 3,
        evidence: 6,
        explanation:
          'Line 7: 窓を閉めて外の物を家の中に入れておく, things left outside are brought indoors. Schools closing is a result of a strong typhoon (line 6), and the daily forecast is the news’s job (line 5), not a household preparation.',
      },
    ],
  },
  {
    id: 'obon',
    order: 39,
    level: 3,
    theme: 'Obon, the summer festival of the dead',
    titleJa: 'おぼん',
    summary:
      'In mid-August families welcome their ancestors home, and the whole country travels back to its hometowns.',
    words: [
      { written: 'おぼん', reading: 'おぼん' },
      { written: '亡くなる', reading: 'なくなる' },
      { written: '先祖', reading: 'せんぞ' },
      { written: '行事', reading: 'ぎょうじ' },
      { written: '期間', reading: 'きかん' },
      { written: '都会', reading: 'とかい' },
      { written: '故郷', reading: 'ふるさと' },
      { written: '過ごす', reading: 'すごす' },
      { written: '高速道路', reading: 'こうそくどうろ' },
      { written: '混む', reading: 'こむ' },
      { written: '迎える', reading: 'むかえる' },
      { written: '墓参り', reading: 'はかまいり' },
      { written: '参加', reading: 'さんか' },
      { written: '残る', reading: 'のこる' },
    ],
    grammar: ['to-shite', 'passive', 'n-desu', 'te-kuru'],
    passage: {
      sentences: [
        {
          ja: 'おぼんは、亡くなった先祖が家に帰ってくると考えられている夏の行事だ。',
          en: 'Obon is a summer custom based on the belief that ancestors who have died return home.',
        },
        {
          ja: '多くの地方では、八月の十三日から十六日ごろまでの期間に行われる。',
          en: 'In most regions it is held from around 13 to 16 August.',
        },
        {
          ja: 'この期間には、都会に住んでいる人も故郷に帰って、家族や親戚と過ごす。',
          en: 'During that time, people who live in cities go back to their hometowns and spend it with family and relatives.',
        },
        {
          ja: 'そのため、高速道路や電車がとても混む。',
          en: 'So motorways and bullet trains get very crowded.',
        },
        {
          ja: 'おぼんの初めには、家の前で小さな火をつけて先祖を迎え、最後の日にはまた火をつけて送る。',
          en: 'At the start of Obon a small fire is lit in front of the house to welcome the ancestors, and on the last day another to send them off.',
        },
        {
          ja: 'おぼんの間には、家族で墓参りに行ったり、町のぼんおどりに参加したりする。',
          en: 'In between, families visit the graves and join the town’s bon dance.',
        },
        {
          ja: '先祖を大切にする気持ちが、今でも夏の行事として残っているのだ。',
          en: 'Respect for one’s ancestors lives on as a summer custom to this day.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'おぼんは、どんな行事か。',
        options: [
          '先祖を迎える夏の行事',
          '新しい年を迎える行事',
          '子どもの成長を祝う行事',
          '夏の花火を見る行事',
        ],
        answer: 0,
        evidence: 0,
        explanation:
          'Line 1 defines it: 亡くなった先祖が家に帰ってくると考えられている夏の行事, a summer event when the ancestors are believed to come home, and line 5 shows families welcoming them. New Year, children and fireworks are never mentioned.',
      },
      {
        kind: 'reference',
        prompt: '「そのため」の「その」は、何を指しているか。',
        options: [
          'ぼんおどりに行く人が多いこと',
          '夏休みに外国へ行く人が多いこと',
          '都会の人が故郷に帰ること',
          '先祖が家に帰ってくること',
        ],
        answer: 2,
        evidence: 2,
        explanation:
          'その in line 4 points back to line 3: 都会に住んでいる人も故郷に帰って, city people travel back to their hometowns, which is why roads and trains are packed. The ancestors returning (line 1) is a belief, not a cause of traffic.',
      },
      {
        kind: 'content',
        prompt: 'おぼんの初めには、何をするか。',
        options: [
          '墓参りに行く。',
          'ぼんおどりに参加する。',
          '家の前に火をつける。',
          '電車で都会に帰る。',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: おぼんの初めには、家の前で小さな火をつけて先祖を迎え, a small fire is lit in front of the house to welcome the ancestors. Grave visits and the dance happen during Obon (line 6), not at its start.',
      },
    ],
  },
];
