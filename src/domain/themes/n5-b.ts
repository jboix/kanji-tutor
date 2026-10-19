/** N5 units 6–9: the station, weather and seasons, the Japanese home, vending machines (D33). */
import type { Unit } from './types.ts';

export const N5_B: readonly Unit[] = [
  {
    id: 'at-the-station',
    order: 6,
    level: 5,
    theme: 'At the station',
    titleJa: '駅で',
    summary:
      'Big Tokyo stations have dozens of exits, and station staff are used to giving directions.',
    words: [
      { written: '駅', reading: 'えき' },
      { written: '切符', reading: 'きっぷ' },
      { written: 'ホーム', reading: 'ホーム' },
      { written: '乗る', reading: 'のる' },
      { written: '降りる', reading: 'おりる' },
      { written: '地下鉄', reading: 'ちかてつ' },
      { written: '出口', reading: 'でぐち' },
      { written: '道', reading: 'みち' },
      { written: '公園', reading: 'こうえん' },
      { written: '外', reading: 'そと' },
    ],
    grammar: ['te-kudasai', 'adj-kute', 'te-kara'],
    passage: {
      sentences: [
        { ja: '土曜日に友達と上野へ行きました。', en: 'On Saturday I went to Ueno with a friend.' },
        {
          ja: '新宿駅はとても大きくて、出口がたくさんあります。',
          en: 'Shinjuku Station is very big and has a lot of exits.',
        },
        {
          ja: '切符を買ってから、駅の人に道を聞きました。',
          en: 'After buying tickets, we asked a station attendant the way.',
        },
        {
          ja: '駅の人は「三番ホームの電車に乗ってください」と言いました。',
          en: 'The attendant said, "Please take the train from platform 3."',
        },
        {
          ja: '「それから、地下鉄に乗ってください」とも言いました。',
          en: 'He also said, "Then please take the subway."',
        },
        {
          ja: '上野駅で降りて、一番出口から外へ出ました。',
          en: 'We got off at Ueno Station and went out through Exit 1.',
        },
        {
          ja: '駅の近くに大きくてきれいな公園がありました。',
          en: 'Near the station there was a big, beautiful park.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '二人はどこで電車を降りましたか。',
        options: ['新宿駅', '上野駅', '中野駅', '目黒駅'],
        answer: 1,
        evidence: 5,
        explanation:
          'Line 6: 上野駅で降りて, they got off at Ueno. They started at Shinjuku, and Nakano and Meguro are never mentioned.',
      },
      {
        kind: 'content',
        prompt: '二人は駅の人に何を聞きましたか。',
        options: ['電車の時間', '公園の名前', '切符を買う所', '道'],
        answer: 3,
        evidence: 2,
        explanation:
          'Line 3: 駅の人に道を聞きました, they asked the way. They had already bought their tickets, and the park is only seen at the end.',
      },
      {
        kind: 'content',
        prompt: '上野駅の近くに何がありましたか。',
        options: [
          '大きくて新しい駅',
          'きれいで大きい公園',
          '地下鉄の出口',
          '大きくてきれいなデパート',
        ],
        answer: 1,
        evidence: 6,
        explanation:
          'Line 7: 駅の近くに大きくてきれいな公園がありました, a big, beautiful park. The big station in the text is Shinjuku, not Ueno, and no department store is mentioned.',
      },
    ],
  },
  {
    id: 'weather-and-seasons',
    order: 7,
    level: 5,
    theme: 'Weather and the four seasons',
    titleJa: '天気ときせつ',
    summary:
      'People in Japan talk about the season all the time, and the June rains have their own name.',
    words: [
      { written: '天気', reading: 'てんき' },
      { written: 'きせつ', reading: 'きせつ' },
      { written: '春', reading: 'はる' },
      { written: '夏', reading: 'なつ' },
      { written: '秋', reading: 'あき' },
      { written: '冬', reading: 'ふゆ' },
      { written: '暖かい', reading: 'あたたかい' },
      { written: '暑い', reading: 'あつい' },
      { written: '涼しい', reading: 'すずしい' },
      { written: '寒い', reading: 'さむい' },
      { written: '雪', reading: 'ゆき' },
      { written: 'つゆ', reading: 'つゆ' },
      { written: 'さくら', reading: 'さくら' },
    ],
    grammar: ['adj-kute', 'ga-but', 'ichiban'],
    passage: {
      sentences: [
        { ja: '日本には四つのきせつがあります。', en: 'Japan has four seasons.' },
        {
          ja: '春は暖かくて、さくらがきれいです。',
          en: 'Spring is warm, and the cherry blossoms are beautiful.',
        },
        { ja: '六月には雨の日が多いです。', en: 'In June there are many rainy days.' },
        { ja: 'この雨のきせつを「つゆ」と言います。', en: 'This rainy season is called tsuyu.' },
        {
          ja: '夏はとても暑いですが、海や山へ行く人が多いです。',
          en: 'Summer is very hot, but many people go to the sea or the mountains.',
        },
        {
          ja: '秋は涼しくて、食べ物がおいしいです。',
          en: 'Autumn is cool, and the food is delicious.',
        },
        {
          ja: '冬は寒くて、北海道では雪がたくさん降ります。',
          en: 'Winter is cold, and a lot of snow falls in Hokkaido.',
        },
        {
          ja: 'わたしは四つのきせつの中で秋が一番好きです。',
          en: 'Of the four seasons, I like autumn best.',
        },
      ],
    },
    questions: [
      {
        kind: 'reference',
        prompt: '「この雨のきせつ」はいつですか。',
        options: ['三月', '六月', '九月', '十二月'],
        answer: 1,
        evidence: 2,
        explanation:
          'この points back to the line before: 六月には雨の日が多いです. The rainy month is June; the other months are never mentioned.',
      },
      {
        kind: 'content',
        prompt: '雪がたくさん降るのはいつですか。',
        options: ['春', '夏', '秋', '冬'],
        answer: 3,
        evidence: 6,
        explanation: 'Line 7: 冬は寒くて、北海道では雪がたくさん降ります. Snow belongs to winter.',
      },
      {
        kind: 'content',
        prompt: 'この人はどのきせつが一番好きですか。',
        options: ['秋', '冬', '春', '夏'],
        answer: 0,
        evidence: 7,
        explanation:
          'The last line: 秋が一番好きです. Spring is described as beautiful, but the writer’s favourite is autumn.',
      },
    ],
  },
  {
    id: 'japanese-home',
    order: 8,
    level: 5,
    theme: 'Inside a Japanese home',
    titleJa: '日本の家',
    summary:
      'Shoes come off at the genkan, futons come out on the tatami, and the bath water is shared.',
    words: [
      { written: '玄関', reading: 'げんかん' },
      { written: '靴', reading: 'くつ' },
      { written: '脱ぐ', reading: 'ぬぐ' },
      { written: '部屋', reading: 'へや' },
      { written: 'たたみ', reading: 'たたみ' },
      { written: 'ふとん', reading: 'ふとん' },
      { written: '台所', reading: 'だいどころ' },
      { written: 'お風呂', reading: 'おふろ' },
      { written: '同じ', reading: 'おなじ' },
      { written: '体', reading: 'からだ' },
      { written: '洗う', reading: 'あらう' },
      { written: '古い', reading: 'ふるい' },
    ],
    grammar: ['toki', 'te-wa-ikenai', 'mae-ni'],
    passage: {
      sentences: [
        {
          ja: '日本の家に入るとき、玄関で靴を脱ぎます。',
          en: 'When you enter a Japanese home, you take off your shoes at the entrance.',
        },
        {
          ja: '部屋に靴で入ってはいけません。',
          en: 'You must not go into the rooms with your shoes on.',
        },
        {
          ja: 'わたしが住んでいる家は古くて、たたみの部屋があります。',
          en: 'The house I live in is old and has a tatami room.',
        },
        {
          ja: 'たたみの部屋では、夜、ふとんを出して寝ます。',
          en: 'In the tatami room we put out futons at night and sleep.',
        },
        {
          ja: '一階に台所とお風呂があって、二階に部屋が二つあります。',
          en: 'The kitchen and the bath are on the ground floor, and there are two rooms upstairs.',
        },
        {
          ja: 'お風呂は家族みんなが使うので、入る前に体を洗います。',
          en: 'The whole family shares the bath, so you wash your body before getting in.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '日本の家では、どこで靴を脱ぎますか。',
        options: ['部屋', '台所', '玄関', '二階'],
        answer: 2,
        evidence: 0,
        explanation:
          'Line 1: 玄関で靴を脱ぎます. Line 2 adds that wearing shoes into the rooms is not allowed, so they come off before that.',
      },
      {
        kind: 'content',
        prompt: 'ふとんはどこで使いますか。',
        options: ['くつをぬぐ玄関', 'たたみがある所', '体を洗うお風呂', '一階にある台所'],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: たたみの部屋では、夜、ふとんを出して寝ます, the futons come out in the tatami room. Shoes come off at the entrance, the bath is for washing, and nobody sleeps in the kitchen on the ground floor.',
      },
      {
        kind: 'reason',
        prompt: 'どうしてお風呂に入る前に体を洗いますか。',
        options: [
          'お風呂の水がとても熱いからです。',
          '家が古くてお風呂が小さいからです。',
          'みんなが同じお風呂に入るからです。',
          'お風呂が二階の部屋にあるからです。',
        ],
        answer: 2,
        evidence: 5,
        explanation:
          'Line 6 gives the reason with ので: お風呂は家族みんなが使う, everyone in the family gets into the same bath. The heat of the water and the size of the bath are never mentioned, and the bath is on the ground floor.',
      },
    ],
  },
  {
    id: 'vending-machine',
    order: 9,
    level: 5,
    theme: 'At the vending machine',
    titleJa: 'じどうはんばいき',
    summary:
      'Japan has millions of vending machines, and in winter many of them sell hot drinks in cans.',
    words: [
      { written: 'じどうはんばいき', reading: 'じどうはんばいき' },
      { written: '町', reading: 'まち' },
      { written: '冷たい', reading: 'つめたい' },
      { written: 'あたたかい', reading: 'あたたかい' },
      { written: '熱い', reading: 'あつい' },
      { written: 'お茶', reading: 'おちゃ' },
      { written: 'かん', reading: 'かん' },
      { written: 'ボタン', reading: 'ボタン' },
      { written: '押す', reading: 'おす' },
      { written: 'お金', reading: 'おかね' },
      { written: '入れる', reading: 'いれる' },
      { written: '売る', reading: 'うる' },
    ],
    grammar: ['node', 'adj-katta', 'te-iru'],
    passage: {
      sentences: [
        {
          ja: '日本の町にはじどうはんばいきがたくさんあります。',
          en: 'There are lots of vending machines in Japanese towns.',
        },
        {
          ja: '駅の前にも、公園の中にも、山にもあります。',
          en: 'They are in front of stations, in parks, even up in the mountains.',
        },
        {
          ja: '夏は冷たい飲み物を、冬はあたたかい飲み物を売っています。',
          en: 'They sell cold drinks in summer and hot drinks in winter.',
        },
        {
          ja: '青いボタンは冷たい物で、赤いボタンはあたたかい物です。',
          en: 'Blue buttons are for cold drinks and red buttons for hot ones.',
        },
        {
          ja: '昨日はとても寒かったので、あたたかいお茶を買いました。',
          en: 'Yesterday it was very cold, so I bought a hot tea.',
        },
        {
          ja: 'お金を入れて、赤いボタンを押しました。',
          en: 'I put the money in and pressed a red button.',
        },
        { ja: 'かんがとても熱かったです。', en: 'The can was very hot.' },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '赤いボタンの飲み物はどうですか。',
        options: ['冷たいです。', '熱いです。', '高いです。', '安いです。'],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: 赤いボタンはあたたかい物です, red is for hot drinks, and line 7 confirms that the can from the red button was very hot. Blue is for cold drinks; prices are not mentioned.',
      },
      {
        kind: 'reason',
        prompt: 'どうしてあたたかいお茶を買いましたか。',
        options: [
          '冷たいお茶が高かったからです。',
          '暑い日だったからです。',
          '寒い日だったからです。',
          '安かったからです。',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: 昨日はとても寒かったので, "because it was very cold yesterday": it was a cold day. Prices are never mentioned, and a hot day would call for a cold drink.',
      },
      {
        kind: 'content',
        prompt: 'じどうはんばいきはどこにありますか。',
        options: [
          '駅の前だけにあります。',
          '公園の中だけにあります。',
          '家の中にあります。',
          'いろいろな所にあります。',
        ],
        answer: 3,
        evidence: 1,
        explanation:
          'Line 2 lists stations, parks and even mountains (〜にも、〜にも), so they are in many places, not only one. Homes are not mentioned.',
      },
    ],
  },
];
