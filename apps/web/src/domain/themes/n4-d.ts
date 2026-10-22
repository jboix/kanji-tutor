/** N4 units 23–25: New Year cards, the turn of the year, the school trip (D33). */
import type { Unit } from './types.ts';

export const N4_D: readonly Unit[] = [
  {
    id: 'new-year-cards',
    order: 23,
    level: 4,
    theme: 'New Year cards',
    titleJa: 'ねんがじょう',
    summary:
      'Cards posted by late December are held by the post office and all delivered on New Year’s Day.',
    words: [
      { written: 'ねんがじょう', reading: 'ねんがじょう' },
      { written: 'お正月', reading: 'おしょうがつ' },
      { written: 'どんな', reading: 'どんな' },
      { written: '習慣', reading: 'しゅうかん' },
      { written: 'あいさつ', reading: 'あいさつ' },
      { written: 'はがき', reading: 'はがき' },
      { written: '郵便局', reading: 'ゆうびんきょく' },
      { written: '届く', reading: 'とどく' },
      { written: 'お礼', reading: 'おれい' },
      { written: '動物', reading: 'どうぶつ' },
      { written: '絵', reading: 'え' },
      { written: '最近', reading: 'さいきん' },
      { written: 'メール', reading: 'メール' },
      { written: '増える', reading: 'ふえる' },
      { written: 'へる', reading: 'へる' },
    ],
    grammar: ['made-ni', 'to-conditional', 'sou-hearsay', 'to-iu'],
    passage: {
      sentences: [
        {
          ja: '日本には、お正月にねんがじょうを送る習慣があります。',
          en: 'In Japan it is the custom to send New Year cards.',
        },
        {
          ja: 'ねんがじょうは新しい年のあいさつを書いたはがきで、十一月になると郵便局で売り始めます。',
          en: 'A nengajō is a postcard with New Year greetings; post offices start selling them in November.',
        },
        {
          ja: '十二月二十五日ごろまでに出すと、一月一日に届きます。',
          en: 'If you post them by about 25 December, they arrive on 1 January.',
        },
        {
          ja: 'はがきには、去年のお礼や「今年もよろしく」という言葉を書きます。',
          en: 'On the card you write thanks for the past year and "I hope for your goodwill this year too."',
        },
        {
          ja: 'その年の動物の絵があるねんがじょうも多いです。',
          en: 'Many cards also show the animal of that year.',
        },
        {
          ja: '最近はメールであいさつする人が増えて、ねんがじょうはへっているそうです。',
          en: 'More people now send greetings by email, and they say the number of cards is falling.',
        },
        {
          ja: 'でも、手で書いたねんがじょうをもらうと、わたしはとてもうれしくなります。',
          en: 'But when I get a handwritten card, it makes me very happy.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '一月一日に届けたいとき、いつまでに出しますか。',
        options: ['十一月の初め', '十二月二十五日ごろ', '十二月三十一日', '一月一日になってから'],
        answer: 1,
        evidence: 2,
        explanation:
          'Line 3: 十二月二十五日ごろまでに出すと、一月一日に届きます. までに marks the deadline. November is when the cards go on sale, and the 31st is too late.',
      },
      {
        kind: 'content',
        prompt: 'ねんがじょうに何を書きますか。',
        options: [
          '自分の住所と新しい電話番号',
          '去年行った旅行の話',
          'お礼と新しい年のあいさつ',
          'メールで送った写真',
        ],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4: 去年のお礼や「今年もよろしく」という言葉を書きます: thanks for the past year and a greeting for the new one. The passage mentions no address, trip or photo.',
      },
      {
        kind: 'content',
        prompt: '最近、ねんがじょうはどうなっていますか。',
        options: [
          '増えています。',
          '前より高くなっています。',
          '少なくなっています。',
          '売っていません。',
        ],
        answer: 2,
        evidence: 5,
        explanation:
          'Line 6: ねんがじょうはへっているそうです. へる means to become fewer. What is growing is email greetings, not the cards, and nothing is said about the price.',
      },
      {
        kind: 'content',
        prompt: 'この人は、どんなときにうれしくなりますか。',
        options: [
          'メールであいさつをもらったとき',
          '郵便局でねんがじょうを買ったとき',
          '動物の絵を見たとき',
          '手で書かれたはがきが届いたとき',
        ],
        answer: 3,
        evidence: 6,
        explanation:
          'Line 7: 手で書いたねんがじょうをもらうと、わたしはとてもうれしくなります. Email greetings come before でも, as the contrast.',
      },
    ],
  },
  {
    id: 'year-end-and-new-year',
    order: 24,
    level: 4,
    theme: 'The turn of the year',
    titleJa: 'ねんまつねんし',
    summary:
      'The year ends with a big clean, noodles and 108 temple bells, and begins with a shrine visit.',
    words: [
      { written: 'ねんまつ', reading: 'ねんまつ' },
      { written: '大掃除', reading: 'おおそうじ' },
      { written: 'おおみそか', reading: 'おおみそか' },
      { written: 'そば', reading: 'そば' },
      { written: '細い', reading: 'ほそい' },
      { written: 'ねがい', reading: 'ねがい' },
      { written: '生きる', reading: 'いきる' },
      { written: 'かね', reading: 'かね' },
      { written: '鳴る', reading: 'なる' },
      { written: 'はつもうで', reading: 'はつもうで' },
      { written: '特別', reading: 'とくべつ' },
      { written: 'しんせき', reading: 'しんせき' },
      { written: '集まる', reading: 'あつまる' },
      { written: 'おとしだま', reading: 'おとしだま' },
      { written: '楽しみ', reading: 'たのしみ' },
    ],
    grammar: ['to-conditional', 'you-ni', 'tara', 'sou-hearsay'],
    passage: {
      sentences: [
        {
          ja: '日本では、ねんまつになると、家族で大掃除をします。',
          en: 'In Japan, at the end of the year, families give the house a big clean.',
        },
        {
          ja: '十二月三十一日はおおみそかと言って、夜にそばを食べます。',
          en: '31 December is called Ōmisoka, and people eat soba noodles that night.',
        },
        {
          ja: 'そばのように細く長く生きられるように、というねがいがあるそうです。',
          en: 'It is said to carry a wish to live a long life, thin and long like the noodles.',
        },
        {
          ja: '夜の十二時が近くなると、お寺のかねが百八回鳴ります。',
          en: 'As midnight comes near, temple bells ring 108 times.',
        },
        {
          ja: '一月一日になったら、神社やお寺へはつもうでに行きます。',
          en: 'On 1 January people make their first shrine or temple visit of the year.',
        },
        {
          ja: 'お正月にはしんせきが集まって、特別な料理を食べます。',
          en: 'At New Year relatives gather and eat special dishes.',
        },
        {
          ja: '子どもたちは大人からおとしだまをもらうので、お正月を楽しみにしています。',
          en: 'Children get New Year money from the adults, so they look forward to it.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'おおみそかの夜に何を食べますか。',
        options: ['そば', '特別な料理', 'ケーキ', 'ラーメン'],
        answer: 0,
        evidence: 1,
        explanation:
          'Line 2: 夜にそばを食べます. The special dishes are for New Year’s Day, with the relatives.',
      },
      {
        kind: 'reason',
        prompt: 'どうしてそばを食べますか。',
        options: [
          '体が暖かくなるからです。',
          'お寺のかねが鳴るからです。',
          '長く生きたいからです。',
          '安くて作りやすいからです。',
        ],
        answer: 2,
        evidence: 2,
        explanation:
          'Line 3: そばのように細く長く生きられるように, the wish for a long life. そうです marks it as something people say. The bells ring later that night, and nothing is said about health or price.',
      },
      {
        kind: 'reason',
        prompt: '子どもたちは、どうしてお正月を楽しみにしていますか。',
        options: [
          '大掃除をしなくてもいいからです。',
          'はつもうでに行くからです。',
          'しんせきが集まるからです。',
          '大人からお金をもらうからです。',
        ],
        answer: 3,
        evidence: 6,
        explanation:
          'Line 7 gives the reason with ので: 大人からおとしだまをもらう, and おとしだま is New Year money. The relatives and the shrine visit are mentioned, but not as the children’s reason.',
      },
    ],
  },
  {
    id: 'school-trip',
    order: 25,
    level: 4,
    theme: 'The school trip',
    titleJa: 'しゅうがくりょこう',
    summary: 'Almost every pupil takes a class trip to Kyoto or Nara, and remembers it for life.',
    words: [
      { written: 'しゅうがくりょこう', reading: 'しゅうがくりょこう' },
      { written: 'クラス', reading: 'クラス' },
      { written: 'バス', reading: 'バス' },
      { written: '見学', reading: 'けんがく' },
      { written: '自由', reading: 'じゆう' },
      { written: 'グループ', reading: 'グループ' },
      { written: '分かれる', reading: 'わかれる' },
      { written: '地図', reading: 'ちず' },
      { written: 'シカ', reading: 'シカ' },
      { written: 'せんべい', reading: 'せんべい' },
      { written: 'しかる', reading: 'しかる' },
      { written: '思い出', reading: 'おもいで' },
    ],
    grammar: ['nagara', 'zutsu', 'you-ni', 'passive'],
    passage: {
      sentences: [
        {
          ja: '中学校三年生の秋、しゅうがくりょこうで京都へ行きました。',
          en: 'In the autumn of my third year of junior high, we went to Kyoto on the school trip.',
        },
        {
          ja: '一日目は、クラスのみんなでバスに乗って、有名なお寺をいくつか見学しました。',
          en: 'On the first day the whole class went by bus and visited several famous temples.',
        },
        {
          ja: '二日目は自由な日で、五人ずつのグループに分かれて町を歩きました。',
          en: 'The second day was free, and we split into groups of five to walk around the town.',
        },
        {
          ja: 'わたしたちのグループは、地図を見ながら、自分たちで決めた所を回りました。',
          en: 'Our group went round the places we had chosen ourselves, map in hand.',
        },
        {
          ja: '大きい公園にはシカがたくさんいて、せんべいをあげると、頭を下げるように動きました。',
          en: 'A big park was full of deer, and when we gave them crackers they moved their heads as if bowing.',
        },
        {
          ja: '夜は旅館で友達と遅くまで話していて、先生にしかられました。',
          en: 'At night we talked with friends at the inn until late and got told off by the teacher.',
        },
        {
          ja: 'しゅうがくりょこうは、今でも一番の思い出です。',
          en: 'The school trip is still my best memory.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '二日目は何をしましたか。',
        options: [
          'クラスのみんなでバスに乗りました。',
          'グループで町を見て回りました。',
          '旅館で一日中休みました。',
          '先生とお寺を見学しました。',
        ],
        answer: 1,
        evidence: 2,
        explanation:
          'Line 3: 五人ずつのグループに分かれて町を歩きました, groups of five walking round the town. The bus and the temples were on the first day.',
      },
      {
        kind: 'content',
        prompt: 'シカは、せんべいをもらうとどうしましたか。',
        options: [
          '走ってどこかへ逃げました。',
          'すぐに寝てしまいました。',
          '大きな声でもっとほしいと鳴きました。',
          'あいさつをするように見えました。',
        ],
        answer: 3,
        evidence: 4,
        explanation:
          'Line 5: せんべいをあげると、頭を下げるように動きました. 頭を下げる is a bow, the Japanese greeting, and ように means "as if": the deer look as though they bow. They do not run, sleep or call out.',
      },
      {
        kind: 'reason',
        prompt: 'どうして先生にしかられましたか。',
        options: [
          '地図をなくしたからです。',
          '夜遅くまで起きていたからです。',
          'シカにせんべいをあげたからです。',
          'グループの人と分かれたからです。',
        ],
        answer: 1,
        evidence: 5,
        explanation:
          'Line 6: 友達と遅くまで話していて、先生にしかられました. Talking until late means staying up late; the 〜ていて clause gives the cause. The map and the deer were part of the day, with no scolding.',
      },
    ],
  },
];
