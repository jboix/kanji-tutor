/** N3 units 34–36: souvenirs for the office, kimono, the packed lunch. */
import type { Unit } from './types.ts';

export const N3_C: readonly Unit[] = [
  {
    id: 'souvenirs',
    order: 34,
    level: 3,
    theme: 'Souvenirs for the office',
    titleJa: 'お土産',
    summary:
      'Back from a trip, you bring individually wrapped sweets for every coworker, as thanks for covering.',
    words: [
      { written: 'お土産', reading: 'おみやげ' },
      { written: '職場', reading: 'しょくば' },
      { written: '同僚', reading: 'どうりょう' },
      { written: '迷惑', reading: 'めいわく' },
      { written: '包装', reading: 'ほうそう' },
      { written: 'お菓子', reading: 'おかし' },
      { written: '地方', reading: 'ちほう' },
      { written: '限定', reading: 'げんてい' },
      { written: '商品', reading: 'しょうひん' },
      { written: '空港', reading: 'くうこう' },
      { written: '名物', reading: 'めいぶつ' },
      { written: '選ぶ', reading: 'えらぶ' },
      { written: '喜ぶ', reading: 'よろこぶ' },
    ],
    grammar: ['dake-de-naku', 'rashii', 'zutsu', 'nagara'],
    passage: {
      sentences: [
        {
          ja: '日本では、旅行に行くと、家族や友達だけでなく、職場の同僚にもお土産を買って帰る人が多い。',
          en: 'In Japan many people bring back souvenirs not only for family and friends but for their coworkers too.',
        },
        {
          ja: '自分が休んでいる間に迷惑をかけたので、そのお礼という気持ちがあるらしい。',
          en: 'It seems to be a way of saying thanks for the trouble caused while they were away.',
        },
        {
          ja: '職場で配るお土産は、一つずつ包装されたお菓子が人気だ。',
          en: 'For the office, individually wrapped sweets are popular.',
        },
        {
          ja: 'みんなに同じように配ることができるからだ。',
          en: 'That is because they can be handed out to everyone equally.',
        },
        {
          ja: 'また、その地方だけで売っている「限定」の商品もよく売れる。',
          en: 'Limited-edition products sold only in that region also sell well.',
        },
        {
          ja: '空港や駅には名物のお菓子の店が並んでいて、帰る前に急いで買うこともできる。',
          en: 'Airports and stations are lined with shops selling local sweets, so you can buy them in a hurry before leaving.',
        },
        {
          ja: 'お土産を選ぶのは大変だが、同僚が喜ぶ顔を想像しながら選ぶのも、旅行の楽しみの一つだ。',
          en: 'Choosing souvenirs is hard work, but picturing your coworkers’ happy faces as you choose is one of the joys of travel.',
        },
      ],
    },
    questions: [
      {
        kind: 'reason',
        prompt: '職場の同僚にもお土産を買って帰るのは、どうしてか。',
        options: [
          '休みの間の迷惑へのお礼だから',
          '同僚に買ってきてと頼まれたから',
          '空港で安く売っているから',
          '会社の規則で決まっているから',
        ],
        answer: 0,
        evidence: 1,
        explanation:
          'Line 2: 迷惑をかけたので、そのお礼という気持ちがある, the gift thanks coworkers for the trouble caused while away. Nothing says coworkers ask for them, that airports sell them cheaply, or that a rule requires it.',
      },
      {
        kind: 'reason',
        prompt: '一つずつ包装されたお菓子が人気なのは、どうしてか。',
        options: [
          'ほかのお菓子よりおいしいから',
          'その地方でしか売っていないから',
          '一人に一つずつ分けやすいから',
          '値段がほかより安いから',
        ],
        answer: 2,
        evidence: 3,
        explanation:
          'Line 4 ends with からだ, giving the reason for line 3: みんなに同じように配ることができる, so each person can get one. Being sold only locally is about 限定 goods (line 5), and taste or price is never given as the reason.',
      },
      {
        kind: 'phrase-meaning',
        prompt: '「限定」の商品とは、どんな物か。',
        options: [
          'どこでも売っている物',
          '空港でしか売っていない物',
          '値段が高くて特別な物',
          'ほかの地方にはない物',
        ],
        answer: 3,
        evidence: 4,
        explanation:
          'Line 5 explains it: その地方だけで売っている「限定」の商品, goods sold only in that region, so you cannot buy them elsewhere. Airports sell local sweets (line 6), but that is not what 限定 means here, and price is not mentioned.',
      },
    ],
  },
  {
    id: 'kimono',
    order: 35,
    level: 3,
    theme: 'Wearing a kimono',
    titleJa: '着物',
    summary:
      'Kimono are now kept for big days, and the obi is so hard to tie that most people need help.',
    words: [
      { written: '着物', reading: 'きもの' },
      { written: '成人', reading: 'せいじん' },
      { written: '結婚式', reading: 'けっこんしき' },
      { written: '帯', reading: 'おび' },
      { written: '結ぶ', reading: 'むすぶ' },
      { written: '特に', reading: 'とくに' },
      { written: '祖母', reading: 'そぼ' },
      { written: '手伝う', reading: 'てつだう' },
      { written: 'やっと', reading: 'やっと' },
      { written: '柄', reading: 'がら' },
      { written: '観光', reading: 'かんこう' },
      { written: 'レンタル', reading: 'レンタル' },
      { written: '若者', reading: 'わかもの' },
      { written: '機会', reading: 'きかい' },
    ],
    grammar: ['shika-nai', 'ippou-de', 'te-morau', 'te-iru'],
    passage: {
      sentences: [
        {
          ja: '昔の日本人は毎日着物を着ていたが、今は特別な日にしか着なくなった。',
          en: 'Japanese people once wore kimono every day, but now they wear them only on special days.',
        },
        {
          ja: '例えば、成人式や結婚式、お正月などに着ることが多い。',
          en: 'For example, they are often worn for coming-of-age ceremonies, weddings and New Year.',
        },
        {
          ja: '着物は一人で着るのが難しく、特に帯を結ぶのは、慣れていないと上手にできない。',
          en: 'A kimono is hard to put on alone, and tying the obi in particular is hard to do well without practice.',
        },
        {
          ja: 'わたしも成人式のときは、祖母に手伝ってもらって、やっと着ることができた。',
          en: 'For my own coming-of-age ceremony, I finally managed to put one on with my grandmother’s help.',
        },
        {
          ja: 'それは祖母が若いころに着ていた着物で、花の柄がきれいだった。',
          en: 'It was a kimono my grandmother wore when she was young, with a lovely floral pattern.',
        },
        {
          ja: '最近は、観光地で着物をレンタルして町を歩く若者や外国人も増えている。',
          en: 'These days more young people and visitors rent kimono at tourist spots and walk around town in them.',
        },
        {
          ja: '着物を着る機会は減った一方で、新しい楽しみ方も生まれているのだ。',
          en: 'There are fewer occasions to wear kimono, but new ways to enjoy them are being born.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '今、着物を着るのは、どんなときが多いか。',
        options: ['毎日の生活', '仕事に行くとき', 'お祝いの日', '旅行に行くとき'],
        answer: 2,
        evidence: 1,
        explanation:
          'Line 2 lists the occasions: 成人式や結婚式、お正月など, all days of celebration. Line 1 says daily wear belongs to the past, and work or travel are never mentioned.',
      },
      {
        kind: 'reference',
        prompt: '「それ」は、何を指しているか。',
        options: [
          '筆者が成人式で着た着物',
          '観光地でレンタルした着物',
          '祖母が結婚式で着た帯',
          '新しく買った着物',
        ],
        answer: 0,
        evidence: 3,
        explanation:
          'それ opens line 5 and points back to line 4: the kimono the writer wore for the ceremony. Line 5 then says it was the grandmother’s from her youth.',
      },
      {
        kind: 'content',
        prompt: '最近増えているのは、どんな人か。',
        options: [
          '毎日着物を着て働く人',
          '一人で帯を上手に結ぶ人',
          '着物を借りて観光する人',
          '祖母の着物を直す人',
        ],
        answer: 2,
        evidence: 5,
        explanation:
          'Line 6: 観光地で着物をレンタルして町を歩く若者や外国人も増えている, more people rent a kimono to walk around tourist spots. Daily wear is a thing of the past (line 1), and tying the obi alone is hard (line 3).',
      },
    ],
  },
  {
    id: 'packed-lunch',
    order: 36,
    level: 3,
    theme: 'The packed lunch',
    titleJa: 'お弁当',
    summary:
      'A Japanese bento is planned for colour as much as nutrition, and seasoned to taste good cold.',
    words: [
      { written: '手作り', reading: 'てづくり' },
      { written: 'おかず', reading: 'おかず' },
      { written: '種類', reading: 'しゅるい' },
      { written: '詰める', reading: 'つめる' },
      { written: '栄養', reading: 'えいよう' },
      { written: 'バランス', reading: 'バランス' },
      { written: '特徴', reading: 'とくちょう' },
      { written: '卵', reading: 'たまご' },
      { written: 'トマト', reading: 'トマト' },
      { written: '見た目', reading: 'みため' },
      { written: '冷める', reading: 'さめる' },
      { written: '濃い', reading: 'こい' },
      { written: '工夫', reading: 'くふう' },
      { written: 'キャラクター', reading: 'キャラクター' },
      { written: '節約', reading: 'せつやく' },
    ],
    grammar: ['dake-de-naku', 'you-ni', 'te-mo', 'yori'],
    passage: {
      sentences: [
        {
          ja: '日本では、学校や会社に手作りのお弁当を持っていく人が多い。',
          en: 'In Japan many people take a home-made lunch box to school or work.',
        },
        {
          ja: 'お弁当には、ご飯と何種類かのおかずを、小さい箱にきれいに詰める。',
          en: 'Rice and several side dishes are packed neatly into a small box.',
        },
        {
          ja: '栄養のバランスだけでなく、色もよく考えて作るのが、日本のお弁当の特徴だ。',
          en: 'A Japanese bento is made with thought for colour as well as for a balanced diet.',
        },
        {
          ja: '例えば、赤いトマトや黄色い卵を入れると、見た目が明るくなる。',
          en: 'For example, red tomatoes or yellow egg make it look brighter.',
        },
        {
          ja: 'また、冷めてもおいしく食べられるように、味を少し濃くするなどの工夫もする。',
          en: 'Cooks also use tricks such as seasoning a little more strongly, so that the food tastes good even cold.',
        },
        {
          ja: '子どものために、アニメのキャラクターの形にしたお弁当を作る親もいる。',
          en: 'Some parents make lunches shaped like anime characters for their children.',
        },
        {
          ja: '朝早く起きて作るのは大変だが、外で食べるより安いので、節約にもなる。',
          en: 'Getting up early to make it is hard, but it is cheaper than eating out, so it saves money too.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '日本のお弁当の特徴は何か。',
        options: [
          '大きい箱に一種類のおかずを入れること',
          '栄養と色の両方を考えること',
          '温かいまま食べること',
          '毎日同じおかずを入れること',
        ],
        answer: 1,
        evidence: 2,
        explanation:
          'Line 3 names the 特徴 directly: 栄養のバランスだけでなく、色もよく考えて作る, both nutrition and colour are planned. Line 2 puts several side dishes in a small box, so the first option is the opposite.',
      },
      {
        kind: 'reason',
        prompt: '味を少し濃くするのは、何のためか。',
        options: [
          'アニメの形にして楽しくするため',
          '見た目を明るくするため',
          '冷たくてもおいしく食べるため',
          'お金を節約するため',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: 冷めてもおいしく食べられるように, so the food still tastes good once it is cold. Brightness comes from the colours (line 4), character shapes are for children (line 6), and saving money is a reason to make lunch at all (line 7), not to season it.',
      },
      {
        kind: 'content',
        prompt: '筆者によると、お弁当のいい点は何か。',
        options: ['作るのが簡単だ。', '朝ゆっくり寝られる。', '量が多い。', 'お金の節約になる。'],
        answer: 3,
        evidence: 6,
        explanation:
          'Line 7: 外で食べるより安いので、節約にもなる, it is cheaper than eating out, so it saves money. The same line says getting up early to make it is hard, so it is neither easy nor a chance to sleep in.',
      },
    ],
  },
];
