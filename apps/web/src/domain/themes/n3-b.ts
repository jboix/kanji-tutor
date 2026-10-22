/** N3 units 31–33: kabuki, rakugo, the tea ceremony (D33). */
import type { Unit } from './types.ts';

export const N3_B: readonly Unit[] = [
  {
    id: 'kabuki',
    order: 31,
    level: 3,
    theme: 'Kabuki theatre',
    titleJa: 'かぶき',
    summary:
      'In kabuki men play every role, and the audience shouts actors’ names at the big moments.',
    words: [
      { written: 'かぶき', reading: 'かぶき' },
      { written: '以上', reading: 'いじょう' },
      { written: '伝統', reading: 'でんとう' },
      { written: '芸能', reading: 'げいのう' },
      { written: '役者', reading: 'やくしゃ' },
      { written: '舞台', reading: 'ぶたい' },
      { written: '役', reading: 'やく' },
      { written: '演じる', reading: 'えんじる' },
      { written: '化粧', reading: 'けしょう' },
      { written: '衣装', reading: 'いしょう' },
      { written: '観客', reading: 'かんきゃく' },
      { written: '応援', reading: 'おうえん' },
      { written: '理解', reading: 'りかい' },
      { written: '劇場', reading: 'げきじょう' },
    ],
    grammar: ['teki', 'koto-ga-aru', 'rashii', 'koto-ga-dekiru'],
    passage: {
      sentences: [
        {
          ja: 'かぶきは四百年以上前に始まった、日本の伝統的な芸能だ。',
          en: 'Kabuki is a traditional Japanese performing art that began over four hundred years ago.',
        },
        {
          ja: '今のかぶきでは男性の役者だけが舞台に立ち、女性の役も男性が演じる。',
          en: 'In today’s kabuki only male actors appear on stage, and men also play the female roles.',
        },
        {
          ja: '役者は顔に白い化粧をして、美しい衣装を着る。',
          en: 'The actors paint their faces white and wear beautiful costumes.',
        },
        {
          ja: '舞台の途中で、観客が役者の名前を大きな声で呼ぶことがある。',
          en: 'In the middle of a play, audience members sometimes call out an actor’s name loudly.',
        },
        {
          ja: 'これには、役者を応援する意味があるらしい。',
          en: 'This is apparently meant to cheer the actor on.',
        },
        {
          ja: '昔の言葉が使われるので、日本人でも全部理解するのは簡単ではない。',
          en: 'Old language is used, so even Japanese people find it hard to understand everything.',
        },
        {
          ja: 'しかし、劇場では英語の説明を聞くこともできるので、外国人でも十分に楽しむことができる。',
          en: 'But theatres offer explanations in English, so visitors from abroad can enjoy it fully too.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '今のかぶきで女性の役を演じるのは、だれか。',
        options: ['女の役者', '男の役者', '観客', '子どもの役者'],
        answer: 1,
        evidence: 1,
        explanation:
          'Line 2: 男性の役者だけが舞台に立ち、女性の役も男性が演じる. Only men appear on stage, so women’s roles are played by male actors; there are no actresses, and the audience does not act.',
      },
      {
        kind: 'reference',
        prompt: '「これ」は、何を指しているか。',
        options: [
          '役者が顔に白い化粧をすること',
          '昔の言葉が使われること',
          '客が役者の名前をさけぶこと',
          '劇場で英語の説明を聞くこと',
        ],
        answer: 2,
        evidence: 3,
        explanation:
          'これ opens line 5 and points back to line 4: 観客が役者の名前を大きな声で呼ぶ, the audience shouting an actor’s name. Line 5 explains why: to cheer the actor on. The white make-up (line 3) and the old language (line 6) are not what これ refers to.',
      },
      {
        kind: 'reason',
        prompt: '日本人でもかぶきを全部理解するのが簡単ではないのは、どうしてか。',
        options: [
          '男性しか舞台に立たないから',
          '使われる言葉が古いから',
          '英語の説明しかないから',
          '観客がうるさいから',
        ],
        answer: 1,
        evidence: 5,
        explanation:
          'Line 6 gives the reason with ので: 昔の言葉が使われる, the language used is old. Men-only casting (line 2) has nothing to do with understanding, and the English guide is an extra help (line 7), not the only one.',
      },
    ],
  },
  {
    id: 'rakugo',
    order: 32,
    level: 3,
    theme: 'Rakugo storytelling',
    titleJa: '落語',
    summary: 'One storyteller on a cushion plays every character with just a fan and a cloth.',
    words: [
      { written: '落語', reading: 'らくご' },
      { written: '落語家', reading: 'らくごか' },
      { written: '座布団', reading: 'ざぶとん' },
      { written: '面白い', reading: 'おもしろい' },
      { written: '道具', reading: 'どうぐ' },
      { written: 'せんす', reading: 'せんす' },
      { written: '手ぬぐい', reading: 'てぬぐい' },
      { written: '財布', reading: 'さいふ' },
      { written: '表情', reading: 'ひょうじょう' },
      { written: '場面', reading: 'ばめん' },
      { written: '想像', reading: 'そうぞう' },
      { written: '落ち', reading: 'おち' },
      { written: '笑う', reading: 'わらう' },
      { written: '寄席', reading: 'よせ' },
    ],
    grammar: ['to-yobareru', 'teki', 'nagara', 'dake'],
    passage: {
      sentences: [
        {
          ja: '落語は、一人の落語家が座布団の上に座って、面白い話をする伝統的な芸能だ。',
          en: 'Rakugo is a traditional art in which a single storyteller sits on a cushion and tells a funny story.',
        },
        {
          ja: '使う道具は、せんすと手ぬぐいだけだ。',
          en: 'The only props are a folding fan and a hand towel.',
        },
        {
          ja: '例えば、せんすが箸になったり、手ぬぐいが財布になったりする。',
          en: 'For example, the fan becomes chopsticks and the towel becomes a wallet.',
        },
        {
          ja: '落語家は顔の表情や声を変えて、一人で何人もの人を演じる。',
          en: 'The storyteller changes expression and voice to play many people alone.',
        },
        {
          ja: 'だから観客は、話を聞きながら、頭の中で場面を想像しなければならない。',
          en: 'So the audience has to picture each scene in their heads as they listen.',
        },
        {
          ja: '話の最後には「落ち」と呼ばれる面白い終わり方があって、そこで観客はみんな笑う。',
          en: 'Each story ends with a punchline called the ochi, and that is where everyone laughs.',
        },
        {
          ja: '東京には「寄席」という落語のための劇場があり、ほとんど毎日落語を聞くことができる。',
          en: 'Tokyo has yose, theatres for rakugo, where you can hear it almost every day.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '落語家が使う道具について、正しいものはどれか。',
        options: [
          '道具は何も使わない。',
          '本物の箸と財布を使う。',
          '二つの道具しか使わない。',
          'いろいろな道具をたくさん使う。',
        ],
        answer: 2,
        evidence: 1,
        explanation:
          'Line 2: 使う道具は、せんすと手ぬぐいだけだ, only a fan and a towel, so just two props. Chopsticks and a wallet are what those props stand for in a story (line 3); they are not real props.',
      },
      {
        kind: 'reason',
        prompt: '観客が頭の中で場面を想像しなければならないのは、どうしてか。',
        options: [
          '話が昔の言葉で、わかりにくいから',
          '一人で演じ、道具も少ないから',
          '寄席が暗くて、よく見えないから',
          '話の最後に「落ち」があるから',
        ],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: one performer plays every character alone, with only two props (line 2). Line 5 then draws the result with だから. Nothing says the language is old or the hall is dark, and the 落ち (line 6) is what makes people laugh.',
      },
      {
        kind: 'reference',
        prompt: '「そこで」の「そこ」は、どこを指しているか。',
        options: ['寄席の入り口', '座布団の上', '話が始まるところ', '話が終わるところ'],
        answer: 3,
        evidence: 5,
        explanation:
          'In line 6 そこ points back in the same sentence to 話の最後の「落ち」: the end of the story, where everyone laughs. It is a moment in the story, not a place such as the hall or the cushion.',
      },
    ],
  },
  {
    id: 'tea-ceremony',
    order: 33,
    level: 3,
    theme: 'The tea ceremony',
    titleJa: '茶道',
    summary: 'Every movement in a tea room has its form, but the point is care for the guest.',
    words: [
      { written: '茶道', reading: 'さどう' },
      { written: '作法', reading: 'さほう' },
      { written: 'まっちゃ', reading: 'まっちゃ' },
      { written: '茶室', reading: 'ちゃしつ' },
      { written: '狭い', reading: 'せまい' },
      { written: '飾る', reading: 'かざる' },
      { written: '和菓子', reading: 'わがし' },
      { written: '受け取る', reading: 'うけとる' },
      { written: '正面', reading: 'しょうめん' },
      { written: '避ける', reading: 'さける' },
      { written: '正座', reading: 'せいざ' },
      { written: '体験', reading: 'たいけん' },
      { written: '心', reading: 'こころ' },
    ],
    grammar: ['tame-ni', 'te-shimau', 'to-iu-koto-da'],
    passage: {
      sentences: [
        {
          ja: '茶道は、決まった作法でまっちゃをいれて、客に出す日本の文化だ。',
          en: 'The tea ceremony is a Japanese art of making matcha by set forms and serving it to guests.',
        },
        {
          ja: '茶室はたいてい狭くて静かで、季節の花が一つだけ飾られている。',
          en: 'A tea room is usually small and quiet, with a single seasonal flower on display.',
        },
        {
          ja: '客は、まず和菓子を食べてからまっちゃを飲む。',
          en: 'Guests first eat a Japanese sweet and then drink the tea.',
        },
        {
          ja: '茶碗を受け取ったら、正面を避けるために、少し回してから飲むのが作法だ。',
          en: 'When you receive the bowl, the form is to turn it a little so as to avoid its front, and then drink.',
        },
        {
          ja: '初めて体験したときは、ずっと正座をしていたので、足が痛くなってしまった。',
          en: 'The first time I tried it, I knelt the whole time and my legs started to hurt.',
        },
        {
          ja: '先生は「作法も大切だが、一番大切なのは客を思う心だ」と教えてくれた。',
          en: 'The teacher told me, "The forms matter, but what matters most is caring for your guest."',
        },
        {
          ja: '茶道の作法は全部、客のことを考えて生まれたものだということだ。',
          en: 'She said every form in the tea ceremony was born from thinking of the guest.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: '客は、まっちゃを飲む前に何をするか。',
        options: [
          '季節の花を飾る。',
          '先生と少し話す。',
          '茶碗をきれいに洗う。',
          'あまい物を食べる。',
        ],
        answer: 3,
        evidence: 2,
        explanation:
          'Line 3: まず和菓子を食べてからまっちゃを飲む. A 和菓子 is a Japanese sweet, so guests eat something sweet first. The flower is already on display in the room (line 2).',
      },
      {
        kind: 'reason',
        prompt: '茶碗を少し回してから飲むのは、何のためか。',
        options: [
          'お茶の量を少なくするため',
          '正面に口をつけないため',
          '季節の花をよく見るため',
          '和菓子をあとで食べるため',
        ],
        answer: 1,
        evidence: 3,
        explanation:
          'Line 4: 正面を避けるために, the bowl is turned so that you do not drink from its front. The sweet is eaten before the tea (line 3), and nothing links the turning to the flower or the amount of tea.',
      },
      {
        kind: 'content',
        prompt: '筆者は、初めて体験したとき、どうなったか。',
        options: [
          'まっちゃが苦すぎた。',
          '茶碗を落としてしまった。',
          '正座で足が痛くなった。',
          '作法を全部覚えた。',
        ],
        answer: 2,
        evidence: 4,
        explanation:
          'Line 5: ずっと正座をしていたので、足が痛くなってしまった, kneeling the whole time made the writer’s legs hurt. The text says nothing about bitter tea, a dropped bowl or learning every form.',
      },
      {
        kind: 'content',
        prompt: '先生によると、茶道で一番大切なのは何か。',
        options: [
          '正しい作法を守ること',
          '高くて古い茶碗を使うこと',
          '季節の花を一つ飾ること',
          '客を大事にする気持ち',
        ],
        answer: 3,
        evidence: 5,
        explanation:
          'Line 6: 一番大切なのは客を思う心だ, what matters most is caring for the guest. The teacher says the forms matter too, but puts the guest first; the flower (line 2) is part of the room, not the main point.',
      },
    ],
  },
];
