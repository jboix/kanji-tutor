/** N5 grammar, part C: change, purpose, likes, degree, adjectives, endings and giving. */
import { afterNoun, afterPlain, afterPred, aru, naAdjective, naru, neg, suru } from './common.ts';
import { alt, b, end, gap, not, notPrev, prev, s, seq, tok } from './dsl.ts';
import type { GrammarEntry } from './types.ts';

const adjectiveKu = tok({ pos: 'adjective', ends: 'く' });

export const N5_C: readonly GrammarEntry[] = [
  {
    id: 'ku-naru',
    pattern: '〜くなる／〜になる',
    level: 5,
    family: 'change',
    meaning: 'become',
    formation: 'い-adj (〜く) / な-adj, N + に + なる',
    explanation:
      'なる describes a change of state. An い-adjective takes its く form before it; a noun or a な-adjective takes に.',
    cloze: ['くなる', 'くなり', 'くなっ', 'になる', 'になり', 'になっ'],
    rule: seq(
      alt(adjectiveKu, seq(afterNoun, notPrev({ surface: ['よう', 'こと', '気'] }), s('に'))),
      naru,
    ),
  },
  {
    id: 'ku-suru',
    pattern: '〜くする／〜にする',
    level: 5,
    family: 'change',
    meaning: 'make (something) …',
    formation: 'い-adj (〜く) / な-adj + に + する',
    explanation:
      'する after an adverb form says that someone changes a thing on purpose. Compare 静かになる, "becomes quiet", with 静かにする, "makes it quiet".',
    cloze: ['くする', 'くし', 'にする', 'にし'],
    rule: seq(alt(adjectiveKu, seq(naAdjective, s('に'))), suru),
  },
  {
    id: 'ni-iku',
    pattern: '〜に行く',
    level: 5,
    family: 'purpose',
    meaning: 'go (somewhere) to do',
    formation: 'V-stem + に + 行く / 来る / 帰る',
    explanation:
      'The masu-stem with に gives the purpose of going or coming. 飲みに行く is "go out to drink".',
    cloze: ['に行', 'にい', 'に来', 'にき', 'にく', 'に帰'],
    rule: seq(
      prev({ pos: 'verb', plain: false }),
      s('に'),
      b('行く', 'いく', '来る', 'くる', '帰る', 'かえる'),
    ),
  },
  {
    id: 'no-ga-suki',
    pattern: '〜のが好き',
    level: 5,
    family: 'preference',
    meaning: 'like doing',
    formation: 'V-dictionary + のが好き / 嫌い',
    explanation:
      'の turns a verb phrase into a noun, so it can take が before 好き. The same frame works with 嫌い and 大好き.',
    cloze: ['のが好き', 'のがすき', 'のが嫌い', 'のがきらい', 'のが大好き'],
    rule: seq(afterPlain, s('の'), s('が'), s('好き', 'すき', '嫌い', 'きらい', '大好き')),
  },
  {
    id: 'no-ga-jouzu',
    pattern: '〜のが上手',
    level: 5,
    family: 'preference',
    meaning: 'be good at doing',
    formation: 'V-dictionary + のが上手 / 下手 / 得意 / 苦手',
    explanation:
      "上手 praises someone else's skill; for yourself, 得意 sounds less boastful. 下手 and 苦手 are the opposites.",
    cloze: ['のが上手', 'のが下手', 'のが得意', 'のが苦手'],
    rule: seq(afterPlain, s('の'), s('が'), s('上手', '下手', '得意', '苦手')),
  },
  {
    id: 'amari-nai',
    pattern: 'あまり〜ない',
    level: 5,
    family: 'degree',
    meaning: 'not very, not much',
    formation: 'あまり + negative',
    explanation:
      'あまり with a negative softens it to "not very" or "not often". With a positive verb it means something else, so watch the ending.',
    cloze: ['あまり', 'あんまり'],
    rule: seq(s('あまり', 'あんまり'), gap(5), neg),
  },
  {
    id: 'zenzen-nai',
    pattern: '全然〜ない',
    level: 5,
    family: 'degree',
    meaning: 'not at all',
    formation: '全然 + negative',
    explanation: '全然 with a negative makes it total: "not at all". It is stronger than あまり.',
    cloze: ['全然', 'ぜんぜん'],
    rule: seq(s('全然', 'ぜんぜん'), gap(5), neg),
  },
  {
    id: 'adj-kute',
    pattern: '〜くて',
    level: 5,
    family: 'adjective',
    meaning: 'and (joining adjectives); because it is …',
    formation: 'い-adj (〜い → 〜くて)',
    explanation:
      'くて is the て form of an い-adjective. It links one description to the next, and sometimes gives the reason for it.',
    cloze: ['くて'],
    rule: seq(adjectiveKu, s('て')),
  },
  {
    id: 'adj-katta',
    pattern: '〜かった',
    level: 5,
    family: 'adjective',
    meaning: 'was (い-adjective past)',
    formation: 'い-adj (〜い → 〜かった)',
    explanation:
      'An い-adjective has its own past form: 寒い becomes 寒かった. Do not use でした for it; add です after かった to be polite.',
    cloze: ['かった'],
    rule: seq(tok({ pos: 'adjective', ends: 'かっ' }), s('た')),
  },
  {
    id: 'adj-ku-nai',
    pattern: '〜くない',
    level: 5,
    family: 'adjective',
    meaning: 'is not (い-adjective negative)',
    formation: 'い-adj (〜い → 〜くない)',
    explanation:
      'The negative of an い-adjective swaps い for くない. いい is the exception: it becomes よくない.',
    cloze: ['くない', 'くなかっ'],
    rule: seq(adjectiveKu, b('ない')),
  },
  {
    id: 'ne',
    pattern: '〜ね',
    level: 5,
    family: 'sentence-ending',
    meaning: "isn't it? right? (seeking agreement)",
    formation: 'sentence + ね',
    explanation:
      'ね at the end invites the listener to agree, or checks that they share a feeling. It makes speech friendly.',
    cloze: ['ね'],
    rule: seq(tok({ surface: ['ね', 'ねえ'], pos: 'particle' }), end),
  },
  {
    id: 'yo',
    pattern: '〜よ',
    level: 5,
    family: 'sentence-ending',
    meaning: 'I tell you (new information)',
    formation: 'sentence + よ',
    explanation:
      'よ marks something the listener does not know yet. Used too often it can sound pushy.',
    cloze: ['よ'],
    rule: seq(afterPred, tok({ surface: 'よ', pos: 'particle' }), end),
  },
  {
    id: 'ka-question',
    pattern: '〜か',
    level: 5,
    family: 'sentence-ending',
    meaning: 'question marker',
    formation: 'sentence + か',
    explanation:
      'か at the end turns a polite sentence into a question, so no question mark is needed. In casual speech rising intonation does the job instead.',
    cloze: ['か'],
    rule: seq(afterPred, tok({ surface: 'か', pos: 'particle' }), end),
  },
  {
    id: 'ga-aru',
    pattern: '〜がある',
    level: 5,
    family: 'existence',
    meaning: 'there is (a thing); have',
    formation: 'place + に + N + があります',
    explanation:
      'ある is for things that do not move by themselves, like books and buildings. It also means "to have" a thing or an event.',
    cloze: ['があ'],
    rule: seq(s('が'), aru, not(seq(gap(2), s('ば')))),
  },
  {
    id: 'ga-iru',
    pattern: '〜がいる',
    level: 5,
    family: 'existence',
    meaning: 'there is (a living thing)',
    formation: 'place + に + N + がいます',
    explanation:
      'いる is for people and animals. Use it for family too: 兄がいます means "I have an older brother".',
    cloze: ['がい'],
    rule: seq(s('が'), tok({ base: 'いる', pos: 'verb' })),
  },
  {
    id: 'ageru',
    pattern: '〜をあげる',
    level: 5,
    family: 'giving-receiving',
    meaning: 'give (to someone else)',
    formation: 'person + に + N + をあげる',
    explanation:
      "あげる is giving away from the speaker's side to someone else. For a gift that comes to you, use くれる.",
    cloze: ['あげ'],
    rule: seq(s('を'), b('あげる')),
  },
  {
    id: 'kureru',
    pattern: '〜をくれる',
    level: 5,
    family: 'giving-receiving',
    meaning: 'give (to me or my side)',
    formation: 'person + が + N + をくれる',
    explanation:
      "くれる is giving toward the speaker or the speaker's family. The giver is the subject.",
    cloze: ['くれ'],
    rule: seq(s('を'), b('くれる')),
  },
  {
    id: 'morau',
    pattern: '〜をもらう',
    level: 5,
    family: 'giving-receiving',
    meaning: 'receive',
    formation: 'person + に / から + N + をもらう',
    explanation:
      "もらう looks at the same gift from the receiver's side. The giver is marked with に or から.",
    cloze: ['もら', '貰'],
    rule: seq(s('を'), b('もらう', '貰う')),
  },
  {
    id: 'deshou',
    pattern: '〜でしょう',
    level: 5,
    family: 'conjecture',
    meaning: 'probably; right?',
    formation: 'plain form (N / な-adj without だ) + でしょう',
    explanation:
      'でしょう makes a guess about the future or about something you cannot see. With a rising tone it asks for agreement instead.',
    cloze: ['でしょう'],
    rule: seq(s('でしょ'), s('う')),
  },
];
