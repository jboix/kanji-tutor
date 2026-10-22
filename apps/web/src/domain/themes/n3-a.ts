/** N3 units 28–30: honorific speech, dialects, earthquakes and preparedness. */
import type { Unit } from './types.ts';

export const N3_A: readonly Unit[] = [
  {
    id: 'honorific-speech',
    order: 28,
    level: 3,
    theme: 'Honorific speech',
    titleJa: '敬語',
    summary:
      'Keigo changes the verb itself depending on who acts and who listens, and natives relearn it at work.',
    words: [
      { written: '敬語', reading: 'けいご' },
      { written: '相手', reading: 'あいて' },
      { written: '関係', reading: 'かんけい' },
      { written: '話し方', reading: 'はなしかた' },
      { written: '筆者', reading: 'ひっしゃ' },
      { written: '目上', reading: 'めうえ' },
      { written: '召し上がる', reading: 'めしあがる' },
      { written: 'いただく', reading: 'いただく' },
      { written: '言い方', reading: 'いいかた' },
      { written: '低い', reading: 'ひくい' },
      { written: '社会人', reading: 'しゃかいじん' },
      { written: '間違える', reading: 'まちがえる' },
      { written: '表す', reading: 'あらわす' },
    ],
    grammar: ['ni-yotte', 'ni-totte', 'wake-dewa-nai', 'you-to-suru'],
    passage: {
      sentences: [
        {
          ja: '日本語には「敬語」という特別な話し方がある。',
          en: 'Japanese has a special way of speaking called keigo.',
        },
        {
          ja: '敬語は、相手と自分の関係によって変えなければならない。',
          en: 'Keigo has to change according to your relationship with the listener.',
        },
        {
          ja: '例えば、目上の人が食べるときは「召し上がる」と言い、自分が食べるときは「いただく」と言う。',
          en: 'For example, when a superior eats you say meshiagaru, and when you eat you say itadaku.',
        },
        {
          ja: 'つまり、相手を高くする言い方と、自分を低くする言い方があるのだ。',
          en: 'In other words, there are forms that raise the other person and forms that lower yourself.',
        },
        {
          ja: '日本人にとっても敬語は簡単ではなく、社会人になってから勉強し直す人も少なくない。',
          en: 'Keigo is not easy even for Japanese people, and quite a few study it again once they start work.',
        },
        {
          ja: 'ただ、敬語を間違えても、それだけで失礼になるわけではない。',
          en: 'Still, getting keigo wrong does not by itself make you rude.',
        },
        {
          ja: '大切なのは、正しい言葉で話すことより、相手を大切に思う気持ちを言葉で表そうとすることだろう。',
          en: 'What matters is less speaking perfectly than trying to put your respect for the other person into words.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '自分が食べるときは、どう言うか。',
        options: ['召し上がる', 'いらっしゃる', '食べられる', 'いただく'],
        answer: 3,
        evidence: 2,
        explanation:
          'Line 3: 自分が食べるときは「いただく」と言う. 召し上がる is for a superior who eats, so it raises the other person.',
      },
      {
        kind: 'phrase-meaning',
        prompt: '「勉強し直す」とは、どういう意味か。',
        options: [
          'もう一度勉強する',
          '勉強をやめる',
          '人に勉強を教える',
          '間違いを直しながら勉強する',
        ],
        answer: 0,
        evidence: 4,
        explanation:
          'In line 5, 〜直す after a verb stem means doing it again. Working adults relearn keigo; they do not stop or teach it.',
      },
      {
        kind: 'content',
        prompt: 'この文章で、筆者が一番言いたいことは何か。',
        options: [
          '敬語は社会人になってから勉強すればいい。',
          '敬語を間違えるのはとても失礼だ。',
          '敬語は日本人にとって簡単だ。',
          '言葉の正しさより、相手への気持ちが大切だ。',
        ],
        answer: 3,
        evidence: 6,
        explanation:
          'The last line states the point with 大切なのは: trying to show respect for the other person matters more than perfect words. Line 6 says a mistake alone is not rude, and line 5 says keigo is hard even for Japanese people.',
      },
    ],
  },
  {
    id: 'dialects',
    order: 29,
    level: 3,
    theme: 'Regional dialects',
    titleJa: '方言',
    summary:
      'In Kansai, naosu can mean "put away", which once left a Tokyo student fixing a book that was not broken.',
    words: [
      { written: '方言', reading: 'ほうげん' },
      { written: '標準語', reading: 'ひょうじゅんご' },
      { written: 'かなり', reading: 'かなり' },
      { written: 'ニュース', reading: 'ニュース' },
      { written: '関西', reading: 'かんさい' },
      { written: '片付ける', reading: 'かたづける' },
      { written: '直す', reading: 'なおす' },
      { written: '壊れる', reading: 'こわれる' },
      { written: '困る', reading: 'こまる' },
      { written: '知る', reading: 'しる' },
      { written: 'きょり', reading: 'きょり' },
      { written: '気', reading: 'き' },
      { written: '地元', reading: 'じもと' },
      { written: 'つい', reading: 'つい' },
    ],
    grammar: ['ni-yotte', 'to-iu', 'ki-ga-suru', 'te-shimau'],
    passage: {
      sentences: [
        {
          ja: '日本は小さい国だが、地方によって言葉がかなり違う。',
          en: 'Japan is a small country, but its speech varies a lot from region to region.',
        },
        {
          ja: '地方の言葉を「方言」と言い、テレビのニュースで使われる言葉を「標準語」と言う。',
          en: 'Regional speech is called hōgen, and the language of TV news is called hyōjungo, the standard.',
        },
        {
          ja: '例えば関西では、「片付ける」という意味で「なおす」と言うことがある。',
          en: 'In Kansai, for example, people sometimes say naosu to mean "put away".',
        },
        {
          ja: '東京からおおさかの大学に入ったとき、友達に「この本、なおしておいて」と言われた。',
          en: 'When I moved from Tokyo to a university in Osaka, a friend told me, "Naoshite oite this book."',
        },
        {
          ja: '本はどこも壊れていなかったので、わたしはとても困ってしまった。',
          en: 'The book was not broken anywhere, so I was completely at a loss.',
        },
        {
          ja: 'あとで、「なおす」が「片付ける」という意味だと知って、二人で笑った。',
          en: 'Later, when I learned that naosu meant "put away", we both laughed.',
        },
        {
          ja: '方言で話すと、相手とのきょりが近くなるような気がする。',
          en: 'Speaking in dialect seems to bring you closer to people.',
        },
        {
          ja: '今では、地元の友達に会っても、つい関西の言葉が出てしまう。',
          en: 'Now, even when I meet friends back home, Kansai words slip out before I know it.',
        },
      ],
    },
    questions: [
      {
        kind: 'phrase-meaning',
        prompt: '関西では、「なおす」はどういう意味で使われることがあるか。',
        options: ['壊れた所をきれいに直す', 'もとの所にもどす', '声に出して読む', 'もう一度買う'],
        answer: 1,
        evidence: 2,
        explanation:
          'Line 3: 「片付ける」という意味で「なおす」と言う. 片付ける is to put things back where they belong. "Repair" is the standard meaning, which is exactly what confused the writer.',
      },
      {
        kind: 'reason',
        prompt: '筆者は、どうして困ってしまったのか。',
        options: [
          '友達の話が速すぎたから',
          '本をなくしてしまったから',
          '直す所がなかったから',
          'おおさかの大学が遠かったから',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: 本はどこも壊れていなかったので. The writer took なおす as "repair", but the book was not broken, so there was nothing to repair. The book was there, not lost.',
      },
      {
        kind: 'content',
        prompt: '「標準語」とは、どんな言葉か。',
        options: [
          'ニュースで聞く言葉',
          '関西で使われる言葉',
          '地方に昔からある言葉',
          '友達と話すときの言葉',
        ],
        answer: 0,
        evidence: 1,
        explanation:
          'Line 2 defines it: テレビのニュースで使われる言葉を「標準語」と言う, the language you hear on the TV news. Kansai speech and other regional speech are 方言.',
      },
      {
        kind: 'content',
        prompt: '筆者は、方言で話すとどう感じると言っているか。',
        options: [
          '相手と親しくなれる気がする。',
          '話が速くなって、わかりにくい。',
          '少し失礼な感じがする。',
          '標準語より難しい。',
        ],
        answer: 0,
        evidence: 6,
        explanation:
          'Line 7: 相手とのきょりが近くなるような気がする: the distance to the other person seems to shrink, so you feel closer. The writer says nothing about dialect being fast, rude or hard.',
      },
    ],
  },
  {
    id: 'earthquakes',
    order: 30,
    level: 3,
    theme: 'Earthquakes and preparedness',
    titleJa: '地震と防災',
    summary:
      'Drills start in primary school, and every home is meant to keep water and a meeting point ready.',
    words: [
      { written: '地震', reading: 'じしん' },
      { written: '起きる', reading: 'おきる' },
      { written: '防災', reading: 'ぼうさい' },
      { written: '訓練', reading: 'くんれん' },
      { written: '行う', reading: 'おこなう' },
      { written: '揺れる', reading: 'ゆれる' },
      { written: '守る', reading: 'まもる' },
      { written: '急ぐ', reading: 'いそぐ' },
      { written: 'あわてる', reading: 'あわてる' },
      { written: '用意', reading: 'ようい' },
      { written: '別々', reading: 'べつべつ' },
      { written: '必要', reading: 'ひつよう' },
      { written: '普段', reading: 'ふだん' },
      { written: '備える', reading: 'そなえる' },
    ],
    grammar: ['tame-reason', 'zu-ni', 'te-mo', 'te-oku'],
    passage: {
      sentences: [
        {
          ja: '日本は地震が多い国で、小さい地震なら毎日のように起きている。',
          en: 'Japan has many earthquakes; small ones happen almost every day.',
        },
        {
          ja: '昔から大きい地震が何度もあったため、学校や会社では年に一、二回、防災訓練が行われる。',
          en: 'Because big earthquakes have struck many times, schools and companies hold disaster drills once or twice a year.',
        },
        {
          ja: '地震で揺れ始めたら、まず机の下に入って頭を守ることが大切だ。',
          en: 'When the shaking starts, the first thing is to get under a desk and protect your head.',
        },
        {
          ja: '地震が終わっても、あわてて外へ出てはいけない。',
          en: 'Even when the quake is over, you must not rush outside.',
        },
        {
          ja: 'また、家には水や食べ物、ラジオなどを用意しておいたほうがいい。',
          en: 'It is also wise to keep water, food, a radio and so on ready at home.',
        },
        {
          ja: '家族が別々の場所にいるときのために、どこに集まるか決めておくことも必要だ。',
          en: 'In case the family is in different places, you also need to decide where to meet.',
        },
        {
          ja: '「まだ大丈夫だろう」と思わずに、普段から備えておくことが大事なのだ。',
          en: 'Instead of thinking "it will be fine for now", it is important to be prepared every day.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '揺れ始めたら、まず何をするか。',
        options: [
          '急いで家の外へ出る。',
          'ラジオを聞く。',
          '家族に電話する。',
          '机の下で頭を守る。',
        ],
        answer: 3,
        evidence: 2,
        explanation:
          'Line 3: まず机の下に入って頭を守る. Line 4 warns against rushing outside, and the radio is something to keep ready beforehand.',
      },
      {
        kind: 'reason',
        prompt: 'どうして集まる場所を決めておくのか。',
        options: [
          '防災訓練で決まっているから',
          'ちがう所にいる家族と会うため',
          '家に水や食べ物がないから',
          '地震の後ですぐに外へ出るため',
        ],
        answer: 1,
        evidence: 5,
        explanation:
          'Line 6: 家族が別々の場所にいるときのために, for the case where the family is apart when it strikes, so that they can find each other. Water and food are to keep at home (line 5), and line 4 warns against rushing outside.',
      },
      {
        kind: 'phrase-meaning',
        prompt: '「普段から備えておく」とは、どういうことか。',
        options: [
          '地震が来てから急いで準備すること',
          '何もない時から準備しておくこと',
          '年に一回だけ訓練すること',
          '地震のことを考えないようにすること',
        ],
        answer: 1,
        evidence: 6,
        explanation:
          '普段 means everyday, ordinary times. The line contrasts it with thinking まだ大丈夫だろう: you get ready in advance, not after the quake.',
      },
    ],
  },
];
