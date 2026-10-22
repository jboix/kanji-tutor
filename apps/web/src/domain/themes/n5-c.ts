/** N5 units 10–13: a ramen shop, a department store, cherry blossoms, the weekend. */
import type { Unit } from './types.ts';

export const N5_C: readonly Unit[] = [
  {
    id: 'ramen-shop',
    order: 10,
    level: 5,
    theme: 'At a ramen shop',
    titleJa: 'ラーメン屋',
    summary:
      'Many ramen shops take your order through a ticket machine at the door, and slurping is fine.',
    words: [
      { written: 'ラーメン', reading: 'ラーメン' },
      { written: '有名', reading: 'ゆうめい' },
      { written: '並ぶ', reading: 'ならぶ' },
      { written: '入口', reading: 'いりぐち' },
      { written: 'きかい', reading: 'きかい' },
      { written: 'チケット', reading: 'チケット' },
      { written: 'せき', reading: 'せき' },
      { written: '座る', reading: 'すわる' },
      { written: '渡す', reading: 'わたす' },
      { written: '水', reading: 'みず' },
      { written: '自分', reading: 'じぶん' },
      { written: '音', reading: 'おと' },
    ],
    grammar: ['te-iru', 'te-mo-ii', 'adj-kute'],
    passage: {
      sentences: [
        {
          ja: '駅の近くに有名なラーメンの店があります。',
          en: 'There is a famous ramen shop near the station.',
        },
        {
          ja: '昼ご飯の時間には、店の前にいつも人が並んでいます。',
          en: 'At lunchtime there is always a line of people in front of the shop.',
        },
        {
          ja: 'この店では、入口のきかいでチケットを買います。',
          en: 'In this shop you buy a meal ticket from the machine at the entrance.',
        },
        {
          ja: 'せきに座って、店の人にチケットを渡します。',
          en: 'You sit down and hand the ticket to the staff.',
        },
        { ja: '水は自分で入れます。', en: 'You pour your own water.' },
        {
          ja: 'ラーメンはとても熱くて、おいしかったです。',
          en: 'The ramen was very hot and delicious.',
        },
        {
          ja: '日本では、音を出してラーメンを食べてもいいです。',
          en: 'In Japan it is fine to slurp your ramen noisily.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この店では、どこでチケットを買いますか。',
        options: ['せき', '駅の前', '店の人', 'きかい'],
        answer: 3,
        evidence: 2,
        explanation:
          'Line 3: 入口のきかいでチケットを買います, from the machine at the entrance. The staff only take the ticket (line 4); they do not sell it, and the station is only where the shop is.',
      },
      {
        kind: 'content',
        prompt: '水はどうしますか。',
        options: [
          '店の人が持ってきます。',
          'きかいで買います。',
          'いりません。',
          '食べる人が入れます。',
        ],
        answer: 3,
        evidence: 4,
        explanation:
          'Line 5: 水は自分で入れます, you pour it yourself, so the people eating serve their own water. It is not bought, and the staff do not bring it.',
      },
      {
        kind: 'content',
        prompt: '昼ご飯の時間に、店の前はどうですか。',
        options: [
          '店が休みで、だれもいません。',
          'せきがたくさんあいています。',
          'たくさんの人が待っています。',
          'きかいの前に店の人がいます。',
        ],
        answer: 2,
        evidence: 1,
        explanation:
          'Line 2: 店の前にいつも人が並んでいます, people are always lining up, so many people are waiting. With a queue outside, the shop is neither closed nor empty, and the text never puts the staff at the machine.',
      },
    ],
  },
  {
    id: 'department-store',
    order: 11,
    level: 5,
    theme: 'Shopping at a department store',
    titleJa: 'デパート',
    summary: 'Department stores keep a whole food hall in the basement, called the depachika.',
    words: [
      { written: 'デパート', reading: 'デパート' },
      { written: '誕生日', reading: 'たんじょうび' },
      { written: 'プレゼント', reading: 'プレゼント' },
      { written: '地下', reading: 'ちか' },
      { written: 'うりば', reading: 'うりば' },
      { written: 'ネクタイ', reading: 'ネクタイ' },
      { written: 'エレベーター', reading: 'エレベーター' },
      { written: '色', reading: 'いろ' },
      { written: '黒い', reading: 'くろい' },
      { written: '青い', reading: 'あおい' },
      { written: '少し', reading: 'すこし' },
      { written: '来週', reading: 'らいしゅう' },
    ],
    grammar: ['ni-iku', 'node', 'ga-but'],
    passage: {
      sentences: [
        {
          ja: '来週は父の誕生日なので、デパートへプレゼントを買いに行きました。',
          en: 'Next week is my father’s birthday, so I went to a department store to buy a present.',
        },
        {
          ja: 'デパートの地下には食べ物のうりばがあります。',
          en: 'The basement of the store has a food floor.',
        },
        {
          ja: 'ネクタイのうりばは五階にあるので、エレベーターで行きました。',
          en: 'The tie section is on the fifth floor, so I took the lift.',
        },
        {
          ja: '青いネクタイと黒いネクタイがありました。',
          en: 'There was a blue tie and a black tie.',
        },
        {
          ja: '青いのは三千円で、黒いのは五千円でした。',
          en: 'The blue one was 3,000 yen and the black one 5,000 yen.',
        },
        {
          ja: '黒いほうがきれいでしたが、少し高かったです。',
          en: 'The black one was nicer, but a little expensive.',
        },
        {
          ja: '父は青い色が好きなので、青いネクタイを買いました。',
          en: 'My father likes blue, so I bought the blue tie.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'この人は何を買いにデパートへ行きましたか。',
        options: ['自分のネクタイ', '地下の食べ物', '父のプレゼント', '母のプレゼント'],
        answer: 2,
        evidence: 0,
        explanation:
          'Line 1: 父の誕生日なので、デパートへプレゼントを買いに行きました. The food floor is only described, not visited for shopping.',
      },
      {
        kind: 'content',
        prompt: '黒いネクタイはいくらでしたか。',
        options: ['三千円', '五千円', '八千円', '五百円'],
        answer: 1,
        evidence: 4,
        explanation:
          'Line 5: 黒いのは五千円でした. Three thousand yen is the price of the blue tie.',
      },
      {
        kind: 'reason',
        prompt: 'どうして青いネクタイを買いましたか。',
        options: [
          '黒いネクタイより安かったからです。',
          '黒いネクタイがなかったからです。',
          '店の人がいいと言ったからです。',
          'お父さんが青い色が好きだからです。',
        ],
        answer: 3,
        evidence: 6,
        explanation:
          'Line 7: 父は青い色が好きなので. The blue tie was also cheaper, but the reason the text gives with ので is the father’s favourite colour.',
      },
    ],
  },
  {
    id: 'cherry-blossoms',
    order: 12,
    level: 5,
    theme: 'Cherry-blossom viewing',
    titleJa: '花見',
    summary: 'For about a week each spring, friends and coworkers picnic under the cherry trees.',
    words: [
      { written: '花見', reading: 'はなみ' },
      { written: '咲く', reading: 'さく' },
      { written: '終わり', reading: 'おわり' },
      { written: '公園', reading: 'こうえん' },
      { written: '下', reading: 'した' },
      { written: 'ばしょ', reading: 'ばしょ' },
      { written: '早い', reading: 'はやい' },
      { written: '花', reading: 'はな' },
      { written: '撮る', reading: 'とる' },
      { written: '一週間', reading: 'いっしゅうかん' },
    ],
    grammar: ['masen-ka', 'tari-tari', 'shika-nai', 'toki'],
    passage: {
      sentences: [
        {
          ja: '三月の終わりごろ、日本ではさくらが咲きます。',
          en: 'Around the end of March the cherry trees bloom in Japan.',
        },
        {
          ja: 'さくらが咲いたとき、たくさんの人が公園へ花見に行きます。',
          en: 'When they bloom, many people go to parks to view the blossoms.',
        },
        {
          ja: '先週、友達が「土曜日に花見をしませんか」と言いました。',
          en: 'Last week a friend said, "Shall we go blossom viewing on Saturday?"',
        },
        {
          ja: 'いいばしょがほしかったので、わたしたちは朝早く公園へ行きました。',
          en: 'We wanted a good spot, so we went to the park early in the morning.',
        },
        {
          ja: '大きいさくらの下で、お弁当を食べたり、写真を撮ったりしました。',
          en: 'Under a big cherry tree we ate our bento and took photos.',
        },
        {
          ja: 'さくらの花は一週間ぐらいしか咲きません。',
          en: 'Cherry blossoms last only about a week.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'さくらはいつごろ咲きますか。',
        options: ['三月のはじめ', '二月の終わり', '四月の少し前', '五月の終わり'],
        answer: 2,
        evidence: 0,
        explanation:
          'Line 1: 三月の終わりごろ, around the end of March, which is just before April. The beginning of March is too early, and February and May are never mentioned.',
      },
      {
        kind: 'reason',
        prompt: 'どうして朝早く公園へ行きましたか。',
        options: [
          'さくらが一週間しか咲かないからです。',
          'いいばしょで花見をしたかったからです。',
          '朝のさくらがいちばんきれいだからです。',
          '友達が朝しか時間がないからです。',
        ],
        answer: 1,
        evidence: 3,
        explanation:
          "Line 4: いいばしょがほしかったので, they wanted a good spot for their blossom viewing. The short life of the blossoms is a fact in line 6, but it is not why they went early, and the text says nothing about the morning blossoms or the friend's free time.",
      },
      {
        kind: 'content',
        prompt: 'わたしたちはさくらの下で何をしましたか。',
        options: [
          'お弁当を食べて、写真も撮りました。',
          '歌を歌ったり、話したりしました。',
          '本を読んだり、寝たりしました。',
          '花を買ったり、散歩したりしました。',
        ],
        answer: 0,
        evidence: 4,
        explanation:
          'Line 5 lists the two things with 〜たり〜たり: お弁当を食べたり、写真を撮ったり, eating bento and taking photos. Singing, reading, sleeping and buying flowers are never mentioned.',
      },
    ],
  },
  {
    id: 'weekend',
    order: 13,
    level: 5,
    theme: 'A weekend at home and out',
    titleJa: '休みの日',
    summary:
      'A Japanese weekend often splits into chores on Saturday morning and time out after that.',
    words: [
      { written: '休み', reading: 'やすみ' },
      { written: 'たいてい', reading: 'たいてい' },
      { written: '掃除', reading: 'そうじ' },
      { written: '洗濯', reading: 'せんたく' },
      { written: '映画', reading: 'えいが' },
      { written: '買い物', reading: 'かいもの' },
      { written: '料理', reading: 'りょうり' },
      { written: '作る', reading: 'つくる' },
      { written: 'テレビ', reading: 'テレビ' },
      { written: '散歩', reading: 'さんぽ' },
      { written: '一日中', reading: 'いちにちじゅう' },
      { written: 'ゆっくり', reading: 'ゆっくり' },
    ],
    grammar: ['tari-tari', 'ni-iku', 'demo'],
    passage: {
      sentences: [
        {
          ja: 'わたしの会社は土曜日と日曜日が休みです。',
          en: 'At my company, Saturday and Sunday are days off.',
        },
        {
          ja: '土曜日の朝は、たいてい部屋の掃除や洗濯をします。',
          en: 'On Saturday mornings I usually clean my room and do the laundry.',
        },
        {
          ja: '午後は友達と映画を見に行ったり、買い物をしたりします。',
          en: 'In the afternoon I go to see films or go shopping with friends.',
        },
        { ja: 'でも、先週の土曜日は一日中雨でした。', en: 'But last Saturday it rained all day.' },
        {
          ja: '家で料理を作ったり、テレビを見たりしました。',
          en: 'I stayed home, cooked and watched TV.',
        },
        { ja: '日曜日はいい天気でした。', en: 'Sunday was a fine day.' },
        {
          ja: '午後、近くの公園をゆっくり散歩しました。',
          en: 'In the afternoon I took a slow walk in a nearby park.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '土曜日の朝は、たいてい何をしますか。',
        options: ['映画を見ます。', '家の仕事をします。', '料理を作ります。', '公園を散歩します。'],
        answer: 1,
        evidence: 1,
        explanation:
          'Line 2: 土曜日の朝は、たいてい部屋の掃除や洗濯をします, cleaning and laundry, that is, housework. Films are for the afternoon, cooking was on the rainy Saturday, and the walk in the park was on Sunday.',
      },
      {
        kind: 'reason',
        prompt: '先週の土曜日、どうしてどこへも行きませんでしたか。',
        options: [
          '仕事があったからです。',
          '天気がよかったからです。',
          '一日中雨だったからです。',
          '友達が来たからです。',
        ],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4 says it rained all day, and line 5 shows the result: they stayed home. The fine weather came on Sunday.',
      },
      {
        kind: 'content',
        prompt: '日曜日の午後は何をしましたか。',
        options: [
          'テレビを見ました。',
          '外を歩きました。',
          '買い物をしました。',
          '洗濯をしました。',
        ],
        answer: 1,
        evidence: 6,
        explanation:
          'Line 7: 近くの公園をゆっくり散歩しました, a slow walk in a nearby park, so they walked outside. Watching TV was on the rainy Saturday, and shopping and laundry are Saturday activities.',
      },
    ],
  },
];
