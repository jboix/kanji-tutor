/** N4 units 26–27: manga and anime, Mount Fuji. */
import type { Unit } from './types.ts';

export const N4_E: readonly Unit[] = [
  {
    id: 'manga-and-anime',
    order: 26,
    level: 4,
    theme: 'Manga and anime',
    titleJa: '漫画とアニメ',
    summary:
      'Most manga first run a few pages a week in thick magazines before they become books or anime.',
    words: [
      { written: '漫画', reading: 'まんが' },
      { written: 'アニメ', reading: 'アニメ' },
      { written: '世界中', reading: 'せかいじゅう' },
      { written: '人気', reading: 'にんき' },
      { written: '大人', reading: 'おとな' },
      { written: '雑誌', reading: 'ざっし' },
      { written: '毎週', reading: 'まいしゅう' },
      { written: 'のる', reading: 'のる' },
      { written: '作品', reading: 'さくひん' },
      { written: '下手', reading: 'へた' },
      { written: '主人公', reading: 'しゅじんこう' },
      { written: '続き', reading: 'つづき' },
    ],
    grammar: ['zutsu', 'te-iku', 'you-ni-naru', 'tari-tari'],
    passage: {
      sentences: [
        {
          ja: '日本の漫画とアニメは、世界中で人気があります。',
          en: 'Japanese manga and anime are popular all over the world.',
        },
        {
          ja: '日本では、子どもも大人も、電車の中などで漫画を読みます。',
          en: 'In Japan both children and adults read manga, on trains and elsewhere.',
        },
        {
          ja: '多くの漫画は、まず雑誌に毎週少しずつのります。',
          en: 'Most manga first appear a little at a time in a weekly magazine.',
        },
        {
          ja: '人気が出た作品は、本になったり、アニメになったりします。',
          en: 'Works that become popular are made into books or anime.',
        },
        {
          ja: 'わたしが好きな漫画は、料理が下手な主人公が少しずつ上手になっていく話です。',
          en: 'My favourite manga is about a hero who is bad at cooking and slowly gets better.',
        },
        {
          ja: '毎週、続きを読むのが楽しみです。',
          en: 'Every week I look forward to reading the next part.',
        },
        {
          ja: 'この漫画を読み始めてから、わたしも料理を作ってみるようになりました。',
          en: 'Since I started reading it, I have started trying to cook too.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '多くの漫画は、まずどこにのりますか。',
        options: ['雑誌', '本', 'アニメ', '新聞'],
        answer: 0,
        evidence: 2,
        explanation:
          'Line 3: まず雑誌に毎週少しずつのります. Books and anime come later, for popular works only (line 4).',
      },
      {
        kind: 'content',
        prompt: 'この人が好きな漫画は、どんな話ですか。',
        options: [
          '料理が上手な主人公が店を始める話',
          '電車の中で起きる話',
          '料理が少しずつ上手になる話',
          '子どもと大人が漫画を書く話',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: 料理が下手な主人公が少しずつ上手になっていく話: a hero whose cooking slowly gets better. The hero starts out bad at cooking, not good, and the train is where people read manga (line 2).',
      },
      {
        kind: 'content',
        prompt: 'この漫画を読み始めてから、この人はどう変わりましたか。',
        options: [
          '自分でも料理をし始めました。',
          '雑誌を買わなくなりました。',
          'アニメを見るようになりました。',
          '漫画を書くようになりました。',
        ],
        answer: 0,
        evidence: 6,
        explanation:
          'Line 7: わたしも料理を作ってみるようになりました. 〜ようになる marks the change: the writer has started cooking too. Anime and magazines appear earlier in the passage, but not as changes in the writer.',
      },
    ],
  },
  {
    id: 'mount-fuji',
    order: 27,
    level: 4,
    theme: 'Climbing Mount Fuji',
    titleJa: 'ふじさん',
    summary:
      'Fuji is open to climbers only in summer, and many climb through the night to see the sunrise.',
    words: [
      { written: 'ふじさん', reading: 'ふじさん' },
      { written: '高さ', reading: 'たかさ' },
      { written: 'メートル', reading: 'メートル' },
      { written: 'のぼる', reading: 'のぼる' },
      { written: '初め', reading: 'はじめ' },
      { written: 'ちょうじょう', reading: 'ちょうじょう' },
      { written: '日の出', reading: 'ひので' },
      { written: '服', reading: 'ふく' },
      { written: '準備', reading: 'じゅんび' },
      { written: '空気', reading: 'くうき' },
      { written: '薄い', reading: 'うすい' },
      { written: '本当に', reading: 'ほんとうに' },
    ],
    grammar: ['koto-ga-dekiru', 'te-oku', 'to-conditional', 'hou-ga-ii'],
    passage: {
      sentences: [
        {
          ja: 'ふじさんは日本で一番高い山で、高さは三千七百七十六メートルです。',
          en: 'Mount Fuji is the highest mountain in Japan, at 3,776 metres.',
        },
        {
          ja: 'ふじさんにのぼることができるのは、七月から九月の初めまでだけです。',
          en: 'You can only climb it from July to early September.',
        },
        {
          ja: '多くの人は夜に山をのぼって、ちょうじょうで日の出を見ます。',
          en: 'Many people climb through the night and watch the sunrise from the top.',
        },
        {
          ja: '夏でもちょうじょうはとても寒いので、暖かい服を準備しておかなければなりません。',
          en: 'Even in summer the top is very cold, so you must get warm clothes ready.',
        },
        {
          ja: 'また、上へ行くと空気が薄くなるので、ゆっくりのぼったほうがいいです。',
          en: 'Also, the air gets thinner as you go up, so it is best to climb slowly.',
        },
        {
          ja: '去年の夏、わたしも友達とのぼりましたが、とても大変でした。',
          en: 'Last summer I climbed it with a friend too, and it was very hard.',
        },
        {
          ja: 'でも、ちょうじょうから見た日の出は、本当にきれいでした。',
          en: 'But the sunrise we saw from the top was truly beautiful.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'ふじさんにのぼることができるのは、いつですか。',
        options: ['春だけ', '春から秋まで', '夏だけ', '冬だけ'],
        answer: 2,
        evidence: 1,
        explanation:
          'Line 2: 七月から九月の初めまでだけです, July to early September, that is, only in summer. だけ makes clear the season is limited, so not from spring to autumn.',
      },
      {
        kind: 'reason',
        prompt: 'どうして暖かい服を準備しなければなりませんか。',
        options: [
          '夜になると雪が降るからです。',
          '夏でも高い所は寒いからです。',
          '空気が薄いからです。',
          '日の出が見えないからです。',
        ],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: 夏でもちょうじょうはとても寒いので: the top of the mountain is cold even in summer. Thin air (line 5) is the reason to climb slowly, not to bring warm clothes, and the passage says nothing about snow.',
      },
      {
        kind: 'content',
        prompt: '上へ行くと、どうなりますか。',
        options: [
          '暑くなります。',
          '人がもっと多くなります。',
          '道が広くなります。',
          '空気が少なくなります。',
        ],
        answer: 3,
        evidence: 4,
        explanation:
          'Line 5: 上へ行くと空気が薄くなる: the higher you go, the less air there is, so you should climb slowly. The top is cold (line 4), not hot.',
      },
    ],
  },
];
