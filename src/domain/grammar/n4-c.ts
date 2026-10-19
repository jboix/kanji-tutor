/** N4 grammar, part C: lists, contrast, purpose, advice, degree, ease and quoting. */
import {
  afterDict,
  afterNoun,
  afterPast,
  afterPlain,
  afterPred,
  afterVerb,
  copula,
  ii,
  iru,
  neg,
  QUESTION_WORDS,
  te,
} from './common.ts';
import { alt, b, gap, not, notBehind, notPrev, prev, s, seq, tok } from './dsl.ts';
import type { GrammarEntry } from './types.ts';

const よう = s('よう');
const に = s('に');
const KNOW_VERBS = ['知る', '分かる', 'わかる', '教える', '聞く', '覚える', '忘れる', '調べる'];

export const N4_C: readonly GrammarEntry[] = [
  {
    id: 'shi',
    pattern: '〜し',
    level: 4,
    family: 'listing',
    meaning: 'and what is more (listing reasons)',
    formation: 'plain form + し',
    explanation:
      'し lists one or more reasons, and hints that there are others. The conclusion often follows at the end.',
    cloze: ['し'],
    rule: seq(afterPred, tok({ surface: 'し', pos: 'particle' })),
  },
  {
    id: 'noni',
    pattern: '〜のに',
    level: 4,
    family: 'contrast',
    meaning: 'even though, despite',
    formation: 'plain form (な-adj / N + な) + のに',
    explanation:
      'のに joins two facts that clash, and carries surprise or frustration about the result. It cannot be followed by a request.',
    cloze: ['のに'],
    rule: seq(
      alt(afterPred, prev({ surface: 'な' })),
      s('のに'),
      not(b('使う', '必要', '便利', 'いい', 'かかる', '忙しい', '役立つ', '十分')),
    ),
  },
  {
    id: 'te-mo',
    pattern: '〜ても',
    level: 4,
    family: 'contrast',
    meaning: 'even if, even though',
    formation: 'V-て / い-adj (〜くて) + も',
    explanation:
      'ても says that the result does not change whatever the condition. Followed by いい it becomes permission instead, so check what comes next.',
    cloze: ['ても', 'でも'],
    rule: seq(te, s('も'), not(alt(ii, b('かまう', '構う')))),
  },
  {
    id: 'tame-ni',
    pattern: '〜ために',
    level: 4,
    family: 'purpose',
    meaning: 'in order to',
    formation: 'V-dictionary / N + の + ために',
    explanation:
      'ために gives a goal the subject chooses to pursue. The verb before it is something you can do on purpose.',
    cloze: ['ために', '為に'],
    rule: seq(alt(afterDict, prev({ surface: 'の' })), s('ため', '為'), に),
  },
  {
    id: 'you-ni',
    pattern: '〜ように',
    level: 4,
    family: 'purpose',
    meaning: 'so that',
    formation: 'V-dictionary / potential / V-ない + ように',
    explanation:
      'ように gives an aim that is a state or something outside direct control: so that I do not forget. Compare ために, whose aim is an action.',
    cloze: ['ように'],
    rule: seq(
      afterPlain,
      よう,
      に,
      not(b('なる', 'する', '見える', '言う', 'いう', '頼む', '伝える', '注意')),
      not(tok({ pos: 'adjective' })),
    ),
  },
  {
    id: 'hodo-nai',
    pattern: '〜ほど〜ない',
    level: 4,
    family: 'comparison',
    meaning: 'not as … as',
    formation: 'N + ほど + negative',
    explanation:
      'ほど with a negative says that something does not reach the level of the thing compared. 去年ほど暑くない is "not as hot as last year".',
    cloze: ['ほど'],
    rule: seq(afterNoun, s('ほど'), gap(3), notBehind(seq(tok({ pos: 'noun' }), s('は')), 2), neg),
  },
  {
    id: 'hou-ga-ii',
    pattern: '〜たほうがいい',
    level: 4,
    family: 'advice',
    meaning: 'had better, should',
    formation: 'V-た / V-ない + ほうがいい',
    explanation:
      'ほうがいい gives fairly strong advice. The past form is usual for "you should do it", and ない for "you had better not".',
    cloze: ['ほうがい', '方がい', 'ほうがよ', '方がよ'],
    rule: seq(
      alt(afterPast, prev({ surface: 'ない' })),
      tok({ surface: ['ほう', '方'], reading: 'ほう' }),
      s('が'),
      ii,
    ),
  },
  {
    id: 'ba-ii',
    pattern: '〜ばいい',
    level: 4,
    family: 'advice',
    meaning: 'should; it would be good to',
    formation: 'V (〜えば) / V-たら + いい',
    explanation:
      'ばいい suggests an easy solution, or asks what to do: どうすればいいですか. たらいい means much the same.',
    cloze: ['ばいい', 'ばよ', 'ば良', 'たらいい', 'だらいい'],
    rule: seq(
      alt(tok({ surface: 'ば', pos: 'particle' }), s('たら', 'だら')),
      not(s('よかっ', '良かっ')),
      ii,
    ),
  },
  {
    id: 'tara-dou',
    pattern: '〜たらどうですか',
    level: 4,
    family: 'advice',
    meaning: "why don't you …?",
    formation: 'V-たら + どうですか',
    explanation:
      'This is a soft suggestion that leaves the choice to the listener. どうでしょうか is more polite still.',
    cloze: ['たらどう', 'だらどう'],
    rule: seq(s('たら', 'だら'), s('どう')),
  },
  {
    id: 'sugiru',
    pattern: '〜すぎる',
    level: 4,
    family: 'degree',
    meaning: 'too much, over-',
    formation: 'V-stem / い-adj (drop い) / な-adj + すぎる',
    explanation:
      'すぎる says that something goes beyond what is good: 食べすぎた, "I ate too much". It conjugates as an ichidan verb.',
    cloze: ['すぎ', '過ぎ'],
    rule: seq(
      alt(prev({ pos: ['verb', 'adjective'], plain: false }), prev({ pos: 'noun' })),
      b('すぎる', '過ぎる'),
    ),
  },
  {
    id: 'yasui',
    pattern: '〜やすい',
    level: 4,
    family: 'ease',
    meaning: 'easy to',
    formation: 'V-stem + やすい',
    explanation:
      'やすい after a masu-stem makes an い-adjective of ease: 書きやすいペン, "a pen that is easy to write with". It can also mean "likely to".',
    cloze: ['やす'],
    rule: seq(afterVerb, b('やすい')),
  },
  {
    id: 'nikui',
    pattern: '〜にくい',
    level: 4,
    family: 'ease',
    meaning: 'hard to',
    formation: 'V-stem + にくい',
    explanation:
      'にくい is the opposite of やすい: the action is difficult because of the thing itself. 飲みにくい薬 is a medicine that is hard to swallow.',
    cloze: ['にく'],
    rule: seq(afterVerb, b('にくい')),
  },
  {
    id: 'n-desu',
    pattern: '〜んです',
    level: 4,
    family: 'explanation',
    meaning: 'it is that … (explaining)',
    formation: 'plain form (な-adj / N + な) + んです / のです',
    explanation:
      'んです presents a statement as an explanation or asks for one. It sounds involved and personal; overused it can sound pushy.',
    cloze: ['んです', 'んだ', 'のです', 'のだ', 'んでしょ', 'んじゃ'],
    rule: seq(
      alt(afterPred, prev({ surface: 'な' })),
      tok({ surface: ['ん', 'の'], pos: 'noun' }),
      copula,
    ),
  },
  {
    id: 'to-iu',
    pattern: '〜という',
    level: 4,
    family: 'quotation',
    meaning: 'called, named',
    formation: 'N + という + N',
    explanation:
      'という names something the listener may not know: 田中という人, "a person called Tanaka".',
    cloze: ['という'],
    rule: seq(
      alt(afterNoun, afterPlain, prev({ surface: ['」', '』'] })),
      s('という'),
      tok({ pos: 'noun' }),
      notPrev({ surface: ['こと', 'の'] }),
    ),
  },
  {
    id: 'to-omou',
    pattern: '〜と思う',
    level: 4,
    family: 'quotation',
    meaning: 'I think that',
    formation: 'plain form + と思う',
    explanation:
      "と思う marks an opinion or a guess as the speaker's own. Before it, a noun or a な-adjective needs だ.",
    cloze: ['と思', 'とおも'],
    rule: seq(afterPred, s('と'), b('思う', 'おもう')),
  },
  {
    id: 'to-itte-ita',
    pattern: '〜と言っていた',
    level: 4,
    family: 'quotation',
    meaning: 'said that',
    formation: 'plain form + と言っていた',
    explanation:
      'と言っていた passes on what someone said earlier. The ている form shows that the message is still relevant.',
    cloze: ['と言って', 'といって'],
    rule: seq(afterPred, s('と'), b('言う', 'いう'), te, iru),
  },
  {
    id: 'ka-dou-ka',
    pattern: '〜かどうか',
    level: 4,
    family: 'quotation',
    meaning: 'whether or not',
    formation: 'plain form + かどうか',
    explanation:
      'かどうか embeds a yes-or-no question inside a sentence. Verbs like 分からない and 知っている often follow it.',
    cloze: ['かどうか'],
    rule: seq(s('か'), s('どう'), s('か')),
  },
  {
    id: 'embedded-ka',
    pattern: '〜か (疑問の埋め込み)',
    level: 4,
    family: 'quotation',
    meaning: 'what / where / who … (embedded question)',
    formation: 'question word … plain form + か + 知る / 分かる',
    explanation:
      'A question with a question word can sit inside a sentence with か. 駅はどこか知っていますか asks whether you know where the station is.',
    cloze: ['か'],
    rule: seq(
      alt(prev({ surface: QUESTION_WORDS }), seq(notPrev({ surface: 'どう' }), afterPred)),
      s('か'),
      b(...KNOW_VERBS),
    ),
  },
];
