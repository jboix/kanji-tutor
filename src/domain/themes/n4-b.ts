/** N4 units 17–19: a part-time job, the clinic, the shinkansen (D33). */
import type { Unit } from './types.ts';

export const N4_B: readonly Unit[] = [
  {
    id: 'part-time-job',
    order: 17,
    level: 4,
    theme: 'A part-time job',
    titleJa: 'アルバイト',
    summary:
      'Students work part-time in cafes and shops, where set polite phrases are learned on day one.',
    words: [
      { written: 'アルバイト', reading: 'アルバイト' },
      { written: '喫茶店', reading: 'きっさてん' },
      { written: 'じきゅう', reading: 'じきゅう' },
      { written: '客', reading: 'きゃく' },
      { written: '言葉', reading: 'ことば' },
      { written: '大変', reading: 'たいへん' },
      { written: '練習', reading: 'れんしゅう' },
      { written: '店長', reading: 'てんちょう' },
      { written: '丁寧', reading: 'ていねい' },
      { written: 'ちこく', reading: 'ちこく' },
      { written: '着く', reading: 'つく' },
      { written: 'きゅうりょう', reading: 'きゅうりょう' },
      { written: 'パソコン', reading: 'パソコン' },
    ],
    grammar: ['you-ni-suru', 'tsumori', 'te-kureru', 'te-kara'],
    passage: {
      sentences: [
        {
          ja: 'わたしは一週間に三回、駅の前の喫茶店でアルバイトをしています。',
          en: 'I work part-time three times a week at a cafe in front of the station.',
        },
        { ja: 'じきゅうは千百円です。', en: 'The pay is 1,100 yen an hour.' },
        {
          ja: '初めは、お客さんに使う言葉が難しくて、大変でした。',
          en: 'At first, the words you use with customers were hard, and it was tough.',
        },
        {
          ja: '「いらっしゃいませ」などのあいさつは、毎日練習しました。',
          en: 'I practised greetings such as "Welcome" every day.',
        },
        {
          ja: '店長はやさしい人で、わからないことを丁寧に教えてくれます。',
          en: 'The manager is kind and carefully explains anything I do not understand.',
        },
        {
          ja: 'ちこくしないように、いつも十分前に店に着くようにしています。',
          en: 'So that I am never late, I always make sure to arrive ten minutes early.',
        },
        {
          ja: 'アルバイトを始めてから、日本語を話すのが上手になりました。',
          en: 'Since starting the job, I have got better at speaking Japanese.',
        },
        {
          ja: '来月のきゅうりょうで、新しいパソコンを買うつもりです。',
          en: 'I plan to buy a new computer with next month’s pay.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この人は一週間に何回アルバイトをしていますか。',
        options: ['一回', '二回', '三回', '毎日'],
        answer: 2,
        evidence: 0,
        explanation: 'Line 1: 一週間に三回, three times a week.',
      },
      {
        kind: 'phrase-meaning',
        prompt: '「大変でした」は、ここではどういう意味ですか。',
        options: [
          '簡単ではなかった。',
          'とても楽しかった。',
          'お客さんが少なかった。',
          'じきゅうが安かった。',
        ],
        answer: 0,
        evidence: 2,
        explanation:
          'In line 3 大変 follows 難しくて: the customer language was hard, so the job was not easy at first. Nothing is said about the pay being low or customers being few.',
      },
      {
        kind: 'reason',
        prompt: 'どうしていつも十分前に店に着くようにしていますか。',
        options: [
          '店長に言われたからです。',
          '練習したいからです。',
          'お客さんが多いからです。',
          'ちこくしないためです。',
        ],
        answer: 3,
        evidence: 5,
        explanation:
          'Line 6: ちこくしないように, "so as not to be late". The manager is described as kind, not as giving that order.',
      },
      {
        kind: 'content',
        prompt: 'この人はきゅうりょうで何をするつもりですか。',
        options: [
          'パソコンを新しく買います。',
          '友だちと旅行に行きます。',
          '国の家族にお金を送ります。',
          '学校のお金を払います。',
        ],
        answer: 0,
        evidence: 7,
        explanation:
          'Line 8: 来月のきゅうりょうで、新しいパソコンを買うつもりです. The text mentions no trip, no money sent home and no school fees.',
      },
    ],
  },
  {
    id: 'at-the-clinic',
    order: 18,
    level: 4,
    theme: 'Seeing a doctor',
    titleJa: '病院で',
    summary:
      'Local clinics see you without an appointment: bring your insurance card and wait your turn.',
    words: [
      { written: '熱', reading: 'ねつ' },
      { written: '頭', reading: 'あたま' },
      { written: '痛い', reading: 'いたい' },
      { written: '喉', reading: 'のど' },
      { written: '受付', reading: 'うけつけ' },
      { written: 'ほけん', reading: 'ほけん' },
      { written: 'カード', reading: 'カード' },
      { written: 'みる', reading: 'みる' },
      { written: '風邪', reading: 'かぜ' },
      { written: '薬', reading: 'くすり' },
      { written: '無理', reading: 'むり' },
      { written: '治る', reading: 'なおる' },
      { written: '注射', reading: 'ちゅうしゃ' },
    ],
    grammar: ['tara', 'te-morau', 'hou-ga-ii', 'naide'],
    passage: {
      sentences: [
        {
          ja: '先週の月曜日、朝起きたら、熱があって頭も痛かったです。',
          en: 'Last Monday, when I got up, I had a fever and a headache.',
        },
        {
          ja: '喉も痛かったので、学校を休んで近くの病院へ行きました。',
          en: 'My throat hurt too, so I stayed home from school and went to a nearby clinic.',
        },
        {
          ja: '受付でほけんのカードを出して、名前を書きました。',
          en: 'At reception I handed in my health-insurance card and wrote my name.',
        },
        {
          ja: '三十分ぐらい待ってから、お医者さんにみてもらいました。',
          en: 'After waiting about thirty minutes, I saw the doctor.',
        },
        {
          ja: 'お医者さんは「風邪ですね。この薬を一日三回飲んでください」と言いました。',
          en: 'The doctor said, "It is a cold. Take this medicine three times a day."',
        },
        {
          ja: 'それから「無理をしないで、二、三日休んだほうがいいですよ」とも言いました。',
          en: 'He also said, "Do not push yourself; you should rest for two or three days."',
        },
        {
          ja: '薬を飲んでよく寝たら、三日後には治りました。',
          en: 'I took the medicine and slept well, and three days later I was better.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この人は病院の受付で何をしましたか。',
        options: [
          '薬をもらいました。',
          'カードを見せて、名前を書きました。',
          'お医者さんにみてもらいました。',
          'お医者さんに注射をしてもらいました。',
        ],
        answer: 1,
        evidence: 2,
        explanation:
          'Line 3: 受付でほけんのカードを出して、名前を書きました: the writer showed the insurance card and wrote their name. Seeing the doctor came after the wait, the medicine came from the doctor, and no injection is mentioned.',
      },
      {
        kind: 'content',
        prompt: '薬は一日に何回飲みますか。',
        options: ['一回', '二回', '三回', '四回'],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: この薬を一日三回飲んでください. 二、三日 in line 6 is the number of days to rest.',
      },
      {
        kind: 'content',
        prompt: 'お医者さんは、どうしたほうがいいと言いましたか。',
        options: [
          '明日から学校へ行ったほうがいい。',
          '毎日病院に来たほうがいい。',
          '注射をしたほうがいい。',
          '無理をしないで休んだほうがいい。',
        ],
        answer: 3,
        evidence: 5,
        explanation:
          'Line 6: 無理をしないで、二、三日休んだほうがいい. The doctor never asks for daily visits or an injection.',
      },
      {
        kind: 'content',
        prompt: '風邪はいつ治りましたか。',
        options: ['三日後', '次の日', '二日後', '一週間後'],
        answer: 0,
        evidence: 6,
        explanation: 'Line 7: 三日後には治りました.',
      },
    ],
  },
  {
    id: 'shinkansen',
    order: 19,
    level: 4,
    theme: 'Riding the bullet train',
    titleJa: 'しんかんせん',
    summary:
      'The shinkansen is fast and famously on time, and a station bento is part of the trip.',
    words: [
      { written: 'しんかんせん', reading: 'しんかんせん' },
      { written: '旅行', reading: 'りょこう' },
      { written: '指定', reading: 'してい' },
      { written: '春休み', reading: 'はるやすみ' },
      { written: '予約', reading: 'よやく' },
      { written: '窓', reading: 'まど' },
      { written: 'はやい', reading: 'はやい' },
      { written: 'かかる', reading: 'かかる' },
      { written: '駅弁', reading: 'えきべん' },
      { written: 'ほとんど', reading: 'ほとんど' },
      { written: '遅れる', reading: 'おくれる' },
      { written: '驚く', reading: 'おどろく' },
      { written: '予定', reading: 'よてい' },
    ],
    grammar: ['te-oku', 'shika-nai', 'passive', 'sou-hearsay'],
    passage: {
      sentences: [
        {
          ja: '春休みに、東京から京都までしんかんせんで旅行しました。',
          en: 'During the spring break I travelled from Tokyo to Kyoto by shinkansen.',
        },
        {
          ja: '前の日に、指定席を予約しておきました。',
          en: 'I had reserved a seat the day before.',
        },
        {
          ja: '窓の近くの席だったので、外の景色がよく見えました。',
          en: 'It was a window seat, so I had a good view outside.',
        },
        {
          ja: 'しんかんせんはとてもはやくて、京都まで二時間ちょっとしかかかりませんでした。',
          en: 'The shinkansen is very fast; it took only a little over two hours to Kyoto.',
        },
        {
          ja: '電車の中で駅弁を食べたり、窓からふじさんを見たりしました。',
          en: 'On the train I ate a station bento and looked at Mount Fuji from the window.',
        },
        {
          ja: 'しんかんせんはほとんど遅れないので、外国の人によく驚かれるそうです。',
          en: 'They say the shinkansen is hardly ever late, which often surprises visitors from abroad.',
        },
        {
          ja: '京都駅には、予定の時間ちょうどに着きました。',
          en: 'We arrived at Kyoto Station exactly on time.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この人は、いつ席を予約しましたか。',
        options: ['一週間前', '京都に着いてから', '旅行の日の朝', '前の日'],
        answer: 3,
        evidence: 1,
        explanation:
          'Line 2: 前の日に、指定席を予約しておきました. 〜ておく shows it was done in advance.',
      },
      {
        kind: 'reason',
        prompt: 'どうして外の景色がよく見えましたか。',
        options: [
          'しんかんせんが遅かったからです。',
          '天気がよかったからです。',
          '席が空いていたからです。',
          '窓に近い席にすわったからです。',
        ],
        answer: 3,
        evidence: 2,
        explanation:
          'Line 3: 窓の近くの席だったので: the seat was by the window (窓に近い). The weather is not mentioned, nothing says the train was empty, and it was fast, not slow.',
      },
      {
        kind: 'content',
        prompt: 'しんかんせんについて、正しいものはどれですか。',
        options: [
          'たいてい時間どおりだ。',
          'よく遅れる。',
          '京都まで五時間かかる。',
          '中で食べてはいけない。',
        ],
        answer: 0,
        evidence: 5,
        explanation:
          'Line 6: ほとんど遅れない, so it is nearly always on time, and line 7 shows it arrived 予定の時間ちょうど. The trip took just over two hours (line 4), and the writer ate a bento on board (line 5).',
      },
    ],
  },
];
