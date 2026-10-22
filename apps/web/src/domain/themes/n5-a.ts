/** N5 units 2–5: meeting people, family, a day, the convenience store. Written for the app. */
import type { Unit } from './types.ts';

export const N5_A: readonly Unit[] = [
  {
    id: 'self-introduction',
    order: 2,
    level: 5,
    theme: 'Introducing yourself',
    titleJa: 'はじめまして',
    summary: 'In Japan a short, set self-introduction opens every class, club and new job.',
    words: [
      { written: '名前', reading: 'なまえ' },
      { written: '日本人', reading: 'にほんじん' },
      { written: '学生', reading: 'がくせい' },
      { written: '大学', reading: 'だいがく' },
      { written: '国', reading: 'くに' },
      { written: '日本語', reading: 'にほんご' },
      { written: '先生', reading: 'せんせい' },
      { written: '今', reading: 'いま' },
      { written: 'さん', reading: 'さん' },
      { written: 'はじめまして', reading: 'はじめまして' },
      { written: 'よろしく', reading: 'よろしく' },
      { written: 'おねがい', reading: 'おねがい' },
      { written: 'べんきょう', reading: 'べんきょう' },
    ],
    grammar: ['desu', 'ja-nai', 'mashita', 'te-iru'],
    passage: {
      sentences: [
        { ja: 'はじめまして。', en: 'Nice to meet you.' },
        { ja: 'わたしの名前はアンナです。', en: 'My name is Anna.' },
        { ja: 'アメリカから来ました。', en: 'I came from America.' },
        { ja: '日本人ではありません。', en: 'I am not Japanese.' },
        { ja: '今、日本の大学の学生です。', en: 'I am now a student at a Japanese university.' },
        {
          ja: '大学で日本語をべんきょうしています。',
          en: 'I am studying Japanese at the university.',
        },
        { ja: '日本語の先生は山本さんです。', en: 'My Japanese teacher is Ms Yamamoto.' },
        { ja: 'どうぞよろしくおねがいします。', en: 'I look forward to getting to know you.' },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'アンナさんの国はどこですか。',
        options: ['アメリカ', '日本', '中国', 'フランス'],
        answer: 0,
        evidence: 2,
        explanation:
          'Line 3 says アメリカから来ました, "I came from America". She says she is not Japanese, and China and France are never mentioned.',
      },
      {
        kind: 'content',
        prompt: 'アンナさんは今、何ですか。',
        options: ['日本語の先生', '大学生', '会社の人', '大学の先生'],
        answer: 1,
        evidence: 4,
        explanation:
          'Line 5: 今、日本の大学の学生です, "I am now a student at a Japanese university", that is, a 大学生. She studies at the university rather than teaching there: the Japanese teacher is Ms Yamamoto, and no company is mentioned.',
      },
      {
        kind: 'content',
        prompt: '山本さんはアンナさんの何ですか。',
        options: ['ともだち', '先生', '大学の学生', 'クラスの人'],
        answer: 1,
        evidence: 6,
        explanation:
          'Line 7: 日本語の先生は山本さんです, "my Japanese teacher is Yamamoto", so she is Anna\'s 先生. The text never calls her a friend, a fellow student or a classmate.',
      },
    ],
  },
  {
    id: 'family',
    order: 3,
    level: 5,
    theme: 'My family',
    titleJa: '家族',
    summary:
      'Japanese has two sets of family words: humble ones for your own family, polite ones for others.',
    words: [
      { written: '家族', reading: 'かぞく' },
      { written: '父', reading: 'ちち' },
      { written: '母', reading: 'はは' },
      { written: '兄', reading: 'あに' },
      { written: '妹', reading: 'いもうと' },
      { written: '両親', reading: 'りょうしん' },
      { written: '会社', reading: 'かいしゃ' },
      { written: '病院', reading: 'びょういん' },
      { written: '医者', reading: 'いしゃ' },
      { written: '高校生', reading: 'こうこうせい' },
      { written: '兄弟', reading: 'きょうだい' },
      { written: '写真', reading: 'しゃしん' },
      { written: '犬', reading: 'いぬ' },
    ],
    grammar: ['te-iru', 'ga-but', 'ya'],
    passage: {
      sentences: [
        { ja: 'これはわたしの家族の写真です。', en: 'This is a photo of my family.' },
        { ja: 'わたしは四人家族です。', en: 'There are four of us in my family.' },
        { ja: '父は会社で働いています。', en: 'My father works at a company.' },
        {
          ja: '母は医者で、病院で働いています。',
          en: 'My mother is a doctor and works at a hospital.',
        },
        {
          ja: '兄はいませんが、妹が一人います。',
          en: 'I have no older brother, but I have one younger sister.',
        },
        {
          ja: '妹は高校生で、音楽や絵が好きです。',
          en: 'My sister is a high-school student and likes music and drawing.',
        },
        { ja: 'それから、白い犬もいます。', en: 'And we also have a white dog.' },
        { ja: '両親は今、おおさかに住んでいます。', en: 'My parents live in Osaka now.' },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'お母さんの仕事は何ですか。',
        options: ['かいしゃいん', '学生', '先生', '医者'],
        answer: 3,
        evidence: 3,
        explanation:
          'Line 4: 母は医者で, "my mother is a doctor". The company job belongs to the father, and the student is the sister.',
      },
      {
        kind: 'content',
        prompt: 'この人には兄弟が何人いますか。',
        options: ['いません。', '一人います。', '二人います。', '四人います。'],
        answer: 1,
        evidence: 4,
        explanation:
          'Line 5: no older brother, but one younger sister (妹が一人います). Four is the size of the whole family, not the number of siblings.',
      },
      {
        kind: 'reference',
        prompt: '「これ」は何ですか。',
        options: ['白い犬', '写真', '病院', '妹の絵'],
        answer: 1,
        evidence: 0,
        explanation:
          "これ points to the thing the writer is showing: the 写真 named in the same line, a photo of the family. The white dog and the sister's drawings come in later lines, and the hospital is where the mother works.",
      },
    ],
  },
  {
    id: 'my-day',
    order: 4,
    level: 5,
    theme: 'A day in my life',
    titleJa: 'わたしの一日',
    summary: 'Long train commutes shape the Japanese day, from the first train to the last one.',
    words: [
      { written: '毎朝', reading: 'まいあさ' },
      { written: '起きる', reading: 'おきる' },
      { written: '朝ご飯', reading: 'あさごはん' },
      { written: '電車', reading: 'でんしゃ' },
      { written: '午前', reading: 'ごぜん' },
      { written: '授業', reading: 'じゅぎょう' },
      { written: '昼ご飯', reading: 'ひるごはん' },
      { written: '午後', reading: 'ごご' },
      { written: '図書館', reading: 'としょかん' },
      { written: '晩ご飯', reading: 'ばんごはん' },
      { written: '寝る', reading: 'ねる' },
      { written: '時間', reading: 'じかん' },
      { written: '顔', reading: 'かお' },
    ],
    grammar: ['te-kara', 'mae-ni', 'kara-made', 'goro'],
    passage: {
      sentences: [
        { ja: 'わたしは毎朝六時に起きます。', en: 'I get up at six every morning.' },
        { ja: '顔を洗ってから、朝ご飯を食べます。', en: 'After washing my face, I eat breakfast.' },
        {
          ja: '七時半ごろ電車で大学へ行きます。',
          en: 'Around half past seven I go to university by train.',
        },
        {
          ja: '電車の中で一時間ぐらい本を読みます。',
          en: 'On the train I read a book for about an hour.',
        },
        { ja: '授業は午前九時から午後三時までです。', en: 'Classes are from 9 a.m. to 3 p.m.' },
        {
          ja: '授業の後で、図書館で宿題をします。',
          en: 'After class I do my homework in the library.',
        },
        { ja: '晩ご飯を食べる前に、少し散歩します。', en: 'Before dinner I take a short walk.' },
        { ja: '夜は十一時ごろ寝ます。', en: 'At night I go to bed around eleven.' },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この人は電車の中で何をしますか。',
        options: ['寝ます。', '宿題をします。', '本を読みます。', '朝ご飯を食べます。'],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4: 電車の中で…本を読みます. Homework is done in the library, and breakfast is eaten at home before leaving.',
      },
      {
        kind: 'content',
        prompt: '授業は何時に終わりますか。',
        options: ['九時', '三時', '七時半', '十一時'],
        answer: 1,
        evidence: 4,
        explanation:
          'Line 5: classes run 午前九時から午後三時まで, so they end at three in the afternoon. Nine is the start, half past seven is the train, eleven is bedtime.',
      },
      {
        kind: 'content',
        prompt: '晩ご飯の前に何をしますか。',
        options: ['散歩します。', '顔を洗います。', '図書館へ行きます。', '電車に乗ります。'],
        answer: 0,
        evidence: 6,
        explanation:
          'Line 7: 晩ご飯を食べる前に、少し散歩します. Washing the face comes before breakfast, not dinner.',
      },
    ],
  },
  {
    id: 'convenience-store',
    order: 5,
    level: 5,
    theme: 'At the convenience store',
    titleJa: 'コンビニ',
    summary:
      'Japanese convenience stores sell hot meals, pay bills and ship parcels, day and night.',
    words: [
      { written: 'コンビニ', reading: 'コンビニ' },
      { written: '店', reading: 'みせ' },
      { written: '弁当', reading: 'べんとう' },
      { written: 'おにぎり', reading: 'おにぎり' },
      { written: '飲み物', reading: 'のみもの' },
      { written: 'あたためる', reading: 'あたためる' },
      { written: 'ふくろ', reading: 'ふくろ' },
      { written: '円', reading: 'えん' },
      { written: '全部', reading: 'ぜんぶ' },
      { written: 'ない', reading: 'ない' },
      { written: '便利', reading: 'べんり' },
      { written: '近く', reading: 'ちかく' },
      { written: '夜', reading: 'よる' },
    ],
    grammar: ['mashou-ka', 'node', 'ga-aru'],
    passage: {
      sentences: [
        {
          ja: 'わたしの家の近くにコンビニがあります。',
          en: 'There is a convenience store near my home.',
        },
        {
          ja: 'コンビニは夜もあいているので、とても便利です。',
          en: 'It is open at night too, so it is very convenient.',
        },
        {
          ja: '今日は弁当とおにぎりと飲み物を買いました。',
          en: 'Today I bought a bento, a rice ball and a drink.',
        },
        {
          ja: '店の人が「お弁当をあたためましょうか」と聞きました。',
          en: 'The clerk asked, "Shall I heat up the bento?"',
        },
        { ja: 'わたしは「はい、おねがいします」と言いました。', en: 'I said, "Yes, please."' },
        { ja: '全部で八百円でした。', en: 'It came to 800 yen in all.' },
        {
          ja: 'ふくろはいらないので、かばんに入れました。',
          en: 'I did not need a bag, so I put everything in my own bag.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '店の人は何をあたためましたか。',
        options: ['おにぎり', '飲み物', 'お弁当', 'かばん'],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4: the clerk offers お弁当をあたためましょうか and the writer says yes. Nothing is said about heating the rice ball or the drink.',
      },
      {
        kind: 'reason',
        prompt: 'どうしてコンビニは便利ですか。',
        options: [
          'お弁当やおにぎりが安いからです。',
          '夜でも買い物ができるからです。',
          'ふくろがいらないからです。',
          '駅の中にあるからです。',
        ],
        answer: 1,
        evidence: 1,
        explanation:
          "Line 2 gives the reason with ので: 夜もあいているので、とても便利です, the shop is open at night too, so you can shop there even at night. The text says nothing about prices or a station, and not taking a bag is the writer's own choice in line 7.",
      },
      {
        kind: 'content',
        prompt: '買った物はどこに入れましたか。',
        options: ['店のふくろ', 'かばん', '冷蔵庫', '車の中'],
        answer: 1,
        evidence: 6,
        explanation:
          'Line 7: the writer needs no bag from the shop (ふくろはいらない) and puts things in a かばん, their own bag. A fridge and a car are never mentioned.',
      },
    ],
  },
];
