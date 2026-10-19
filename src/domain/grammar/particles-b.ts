/**
 * Listing, ending and linking particles (G5): や, か, ね, よ, けど, が (but), より, しか, だけ,
 * ので, のに. Each links the catalogue point with the same sense. Written for this app.
 */
import { afterPred } from './common.ts';
import { s, seq } from './dsl.ts';
import { particle, use } from './particles-a.ts';
import type { FunctionWord } from './types.ts';

export const OTHER_PARTICLES: readonly FunctionWord[] = [
  {
    id: 'particle-ya',
    pattern: 'や',
    level: 5,
    meaning: 'and (among others)',
    explanation:
      'や lists a few examples and implies there are more. と lists every item; や often ends with など "and so on".',
    uses: [
      use(
        'Some examples of many',
        'りんごやみかんを買いました。',
        'I bought apples, oranges and so on.',
      ),
      use(
        'With など at the end',
        '机の上に本やペンなどがあります。',
        'There are books, pens and such on the desk.',
      ),
    ],
    rule: particle('や'),
    grammarId: 'ya',
  },
  {
    id: 'particle-ka',
    pattern: 'か',
    level: 5,
    meaning: 'question marker; or',
    explanation:
      'か at the end turns a sentence into a question, so no question mark is needed. Between nouns it means "or".',
    uses: [
      use('A question', '明日、来ますか。', 'Are you coming tomorrow?'),
      use('Or', 'お茶かコーヒーを飲みます。', "I'll have tea or coffee."),
      use('Some-, after a question word', 'だれかが来ました。', 'Someone came.'),
    ],
    rule: particle('か'),
    grammarId: 'ka-question',
  },
  {
    id: 'particle-ne',
    pattern: 'ね',
    level: 5,
    meaning: "isn't it?, right?",
    explanation:
      'ね at the end invites the listener to agree or checks something both people know. It makes speech warmer.',
    uses: [
      use('Seeking agreement', '今日は暑いですね。', "It's hot today, isn't it?"),
      use('Checking a detail', '会議は三時からですね。', 'The meeting is from three, right?'),
    ],
    rule: particle('ね', 'ねえ'),
    grammarId: 'ne',
  },
  {
    id: 'particle-yo',
    pattern: 'よ',
    level: 5,
    meaning: 'I tell you, you know',
    explanation:
      'よ at the end tells the listener something they may not know, or presses a point. Used too much it can sound pushy.',
    uses: [
      use(
        'New information for the listener',
        'このケーキ、おいしいですよ。',
        'This cake is good, you know.',
      ),
      use('Pressing advice', '早く寝たほうがいいよ。', 'You should go to bed early.'),
    ],
    rule: particle('よ'),
    grammarId: 'yo',
  },
  {
    id: 'particle-kedo',
    pattern: 'けど',
    level: 4,
    meaning: 'but, although',
    explanation:
      'けど joins two clauses with "but" in everyday speech. At the end of a sentence it leaves something unsaid, softening a request.',
    uses: [
      use('But', '高いけど、買いました。', 'It was expensive, but I bought it.'),
      use('Softening, at the end', 'ちょっと聞きたいんですけど。', "I'd like to ask something…"),
    ],
    rule: s('けど', 'けれど', 'けれども'),
    grammarId: 'kedo',
  },
  {
    id: 'particle-ga-but',
    pattern: 'が (but)',
    level: 5,
    meaning: 'but',
    explanation:
      'が after a full sentence means "but", a little more formal than けど. It can also lead in politely before a question.',
    uses: [
      use('But', '雨が降っていますが、出かけます。', "It's raining, but I'm going out."),
      use(
        'A polite lead-in',
        'ちょっと聞きたいんですが、駅はどこですか。',
        'Can I ask you something? Where is the station?',
      ),
    ],
    rule: seq(afterPred, particle('が')),
    grammarId: 'ga-but',
  },
  {
    id: 'particle-yori',
    pattern: 'より',
    level: 5,
    meaning: 'than',
    explanation:
      'より marks what something is compared against: A は B より… is "A is more … than B".',
    uses: [
      use('Than, in a comparison', '電車はバスより速いです。', 'The train is faster than the bus.'),
      use('Rather than', '肉より魚が好きです。', 'I like fish more than meat.'),
    ],
    rule: particle('より'),
    grammarId: 'yori',
  },
  {
    id: 'particle-shika',
    pattern: 'しか',
    level: 5,
    meaning: 'only (with a negative)',
    explanation:
      'しか always comes with a negative verb: しか…ない means "only", stressing that it is less than hoped.',
    uses: [
      use(
        'Only, and not enough',
        '財布に百円しかありません。',
        'I only have a hundred yen in my wallet.',
      ),
      use('Nothing but', '日曜日は家にしかいなかった。', 'On Sunday I stayed nowhere but home.'),
    ],
    rule: particle('しか'),
    grammarId: 'shika-nai',
  },
  {
    id: 'particle-dake',
    pattern: 'だけ',
    level: 5,
    meaning: 'only, just',
    explanation: 'だけ limits something to what it follows, without the negative feeling of しか.',
    uses: [
      use('Only, just', '水だけください。', 'Just water, please.'),
      use('Only, after a verb', '見るだけです。', "I'm just looking."),
    ],
    rule: particle('だけ'),
    grammarId: 'dake',
  },
  {
    id: 'particle-node',
    pattern: 'ので',
    level: 4,
    meaning: 'because, since',
    explanation:
      'ので gives a reason as a matter of fact. It is softer than から, so it suits polite excuses.',
    uses: [
      use('A reason as a fact', '雨なので、家にいます。', "It's raining, so I'm staying home."),
      use(
        'A polite excuse',
        '用事があるので、先に帰ります。',
        "I have something to do, so I'll head home first.",
      ),
    ],
    rule: s('ので'),
    grammarId: 'node',
  },
  {
    id: 'particle-noni',
    pattern: 'のに',
    level: 4,
    meaning: 'although, even though',
    explanation:
      'のに joins two facts where the second is not what you would expect, often with surprise or regret.',
    uses: [
      use(
        'Although, against expectation',
        '薬を飲んだのに、まだ頭が痛い。',
        'I took medicine, but my head still hurts.',
      ),
      use('Regret, at the end', 'もっと早く来ればよかったのに。', 'You should have come earlier.'),
    ],
    rule: s('のに'),
    grammarId: 'noni',
  },
];
