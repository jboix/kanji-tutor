/** N5 grammar, part A: copula, polite and plain verb forms, invitations, wants and requests. */
import { afterNoun, afterVerb, iru, neg, te } from './common.ts';
import { alt, b, end, gap, not, notPrev, prev, s, seq, tok } from './dsl.ts';
import type { GrammarEntry } from './types.ts';

const ませ = s('ませ');
const ん = s('ん');

export const N5_A: readonly GrammarEntry[] = [
  {
    id: 'desu',
    pattern: '〜です',
    level: 5,
    family: 'copula',
    meaning: 'is, am, are (polite)',
    formation: 'N + です',
    explanation:
      'です links a topic to a noun and makes the statement polite. It works like "is" in English, but it sits at the end of the sentence.',
    cloze: ['です'],
    rule: seq(afterNoun, s('です')),
  },
  {
    id: 'da',
    pattern: '〜だ',
    level: 5,
    family: 'copula',
    meaning: 'is, am, are (plain)',
    formation: 'N + だ',
    explanation:
      'だ is the plain counterpart of です. Friends use it in speech, and it is common in writing and inside longer sentences.',
    cloze: ['だ'],
    rule: seq(afterNoun, tok({ surface: 'だ', base: 'だ', pos: 'auxiliary' })),
  },
  {
    id: 'ja-nai',
    pattern: '〜じゃない／ではありません',
    level: 5,
    family: 'copula',
    meaning: 'is not',
    formation: 'N + じゃない / ではない / ではありません',
    explanation:
      'This is the negative of です and だ. じゃ is the spoken contraction of では, and ありません is the polite ending.',
    cloze: ['じゃない', 'じゃありません', 'ではない', 'ではありません'],
    rule: seq(
      afterNoun,
      alt(s('じゃ'), seq(tok({ surface: 'で', pos: 'particle' }), s('は'))),
      alt(neg, seq(b('ある'), ませ, ん)),
    ),
  },
  {
    id: 'deshita',
    pattern: '〜でした',
    level: 5,
    family: 'copula',
    meaning: 'was, were (polite)',
    formation: 'N + でした',
    explanation:
      'でした is the past form of です. Use it for a noun or a na-adjective that described things in the past.',
    cloze: ['でした'],
    rule: seq(afterNoun, s('でし'), s('た')),
  },
  {
    id: 'masu',
    pattern: '〜ます',
    level: 5,
    family: 'politeness',
    meaning: 'polite non-past verb ending',
    formation: 'V-stem + ます',
    explanation:
      'ます makes a verb polite. The same form covers habits, the present and the future, so context tells which one is meant.',
    cloze: ['ます'],
    rule: seq(afterVerb, s('ます')),
  },
  {
    id: 'masen',
    pattern: '〜ません',
    level: 5,
    family: 'politeness',
    meaning: 'polite negative: do not, will not',
    formation: 'V-stem + ません',
    explanation:
      'ません is the negative of ます. It says that someone does not or will not do something, politely.',
    cloze: ['ません'],
    rule: seq(afterVerb, ませ, ん, not(s('でし')), not(s('か'))),
  },
  {
    id: 'mashita',
    pattern: '〜ました',
    level: 5,
    family: 'politeness',
    meaning: 'polite past: did',
    formation: 'V-stem + ました',
    explanation: 'ました is the past form of ます. It reports a finished action in polite speech.',
    cloze: ['ました'],
    rule: seq(afterVerb, s('まし'), s('た')),
  },
  {
    id: 'masen-deshita',
    pattern: '〜ませんでした',
    level: 5,
    family: 'politeness',
    meaning: 'polite past negative: did not',
    formation: 'V-stem + ませんでした',
    explanation:
      'Add でした after ません to say that something did not happen. It is the polite way to deny a past action.',
    cloze: ['ませんでした'],
    rule: seq(afterVerb, ませ, ん, s('でし'), s('た')),
  },
  {
    id: 'nai-form',
    pattern: '〜ない',
    level: 5,
    family: 'plain-form',
    meaning: 'plain negative: do not',
    formation: 'V-ない',
    explanation:
      'The ない form is the plain negative of a verb. It is what friends say instead of ません, and many patterns are built on it.',
    cloze: ['ない', 'なかっ'],
    rule: seq(afterVerb, tok({ base: 'ない', pos: 'auxiliary' })),
  },
  {
    id: 'ta-form',
    pattern: '〜た',
    level: 5,
    family: 'plain-form',
    meaning: 'plain past: did',
    formation: 'V-た',
    explanation:
      'The た form is the plain past of a verb. Its sound changes follow the same rules as the て form, so 読む becomes 読んだ.',
    cloze: ['た', 'だ'],
    rule: seq(afterVerb, tok({ surface: ['た', 'だ'], pos: 'auxiliary' })),
  },
  {
    id: 'mashou',
    pattern: '〜ましょう',
    level: 5,
    family: 'suggestion',
    meaning: "let's",
    formation: 'V-stem + ましょう',
    explanation:
      'ましょう invites the listener to do something together, or agrees to a plan. It is warm and polite.',
    cloze: ['ましょう'],
    rule: seq(afterVerb, s('ましょ'), s('う'), not(s('か'))),
  },
  {
    id: 'masen-ka',
    pattern: '〜ませんか',
    level: 5,
    family: 'suggestion',
    meaning: "won't you…? would you like to…?",
    formation: 'V-stem + ませんか',
    explanation:
      'Asking in the negative is a gentle way to invite someone. It leaves room to say no, so it sounds softer than ましょう.',
    cloze: ['ませんか'],
    rule: seq(afterVerb, ませ, ん, s('か')),
  },
  {
    id: 'mashou-ka',
    pattern: '〜ましょうか',
    level: 5,
    family: 'suggestion',
    meaning: 'shall I…? shall we…?',
    formation: 'V-stem + ましょうか',
    explanation:
      'ましょうか offers to do something for the listener, or asks whether to do it together. The question mark makes it an offer, not a plan.',
    cloze: ['ましょうか'],
    rule: seq(afterVerb, s('ましょ'), s('う'), s('か')),
  },
  {
    id: 'tai',
    pattern: '〜たい',
    level: 5,
    family: 'desire',
    meaning: 'want to',
    formation: 'V-stem + たい',
    explanation:
      'たい turns a verb into an i-adjective of wanting. It speaks about the speaker, or asks the listener; for a third person Japanese prefers たがる.',
    cloze: ['たい', 'たく', 'たかっ'],
    rule: seq(afterVerb, tok({ base: 'たい', pos: 'auxiliary' })),
  },
  {
    id: 'hoshii',
    pattern: '〜がほしい',
    level: 5,
    family: 'desire',
    meaning: 'want (a thing)',
    formation: 'N + がほしい',
    explanation:
      'ほしい is an i-adjective that says you want something. The thing wanted is marked with が, and you cannot use it for what others want.',
    cloze: ['がほしい', 'が欲しい', 'がほしかっ', 'が欲しかっ'],
    rule: seq(s('が'), b('ほしい', '欲しい')),
  },
  {
    id: 'te-kudasai',
    pattern: '〜てください',
    level: 5,
    family: 'request',
    meaning: 'please do',
    formation: 'V-て + ください',
    explanation:
      'てください asks someone to do something. It is polite, but it is still a request, so teachers and signs use it a lot.',
    cloze: ['てください', 'でください'],
    rule: seq(notPrev({ base: 'ない' }), te, s('ください', '下さい'), not(s('まし', 'ます'))),
  },
  {
    id: 'naide-kudasai',
    pattern: '〜ないでください',
    level: 5,
    family: 'request',
    meaning: 'please do not',
    formation: 'V-ない + でください',
    explanation:
      'Put でください after the ない form to ask someone not to do something. It is the polite way to forbid or warn.',
    cloze: ['ないでください'],
    rule: seq(afterVerb, s('ない'), s('で'), s('ください', '下さい')),
  },
  {
    id: 'o-kudasai',
    pattern: '〜をください',
    level: 5,
    family: 'request',
    meaning: 'please give me',
    formation: 'N + (を) ください',
    explanation:
      'With a noun, ください asks for the thing itself. It is what you say when ordering in a shop or a café.',
    cloze: ['ください', '下さい'],
    rule: seq(
      notPrev({ surface: ['て', 'で'] }),
      prev({ pos: ['noun', 'pronoun', 'suffix', 'particle'] }),
      s('ください', '下さい'),
      end,
    ),
  },
  {
    id: 'te-iru',
    pattern: '〜ている',
    level: 5,
    family: 'aspect',
    meaning: 'is doing; is in a state',
    formation: 'V-て + いる',
    explanation:
      'ている shows an action in progress or a state that results from a change. 食べている is "is eating", but 結婚している is "is married".',
    cloze: ['てい', 'でい'],
    rule: seq(te, iru),
  },
  {
    id: 'mada-te-inai',
    pattern: 'まだ〜ていない',
    level: 5,
    family: 'aspect',
    meaning: 'not yet',
    formation: 'まだ + V-て + いない / いません',
    explanation:
      'まだ with a negative ている says that something has not happened yet but still might. Japanese uses ている here, not the past.',
    cloze: ['ていない', 'ていません', 'でいない', 'でいません'],
    rule: seq(s('まだ'), gap(6), te, iru, neg),
  },
  {
    id: 'mou-ta',
    pattern: 'もう〜た',
    level: 5,
    family: 'aspect',
    meaning: 'already did',
    formation: 'もう + V-た / V-ました',
    explanation:
      'もう with a past verb says that something is already done. The answer "not yet" to such a question is まだです.',
    cloze: ['もう'],
    rule: seq(
      s('もう'),
      not(b('少し', 'すこし', '一度', '一回', '一つ', 'ひとつ', '一人')),
      gap(6),
      alt(
        seq(afterVerb, tok({ surface: ['た', 'だ'], pos: 'auxiliary' })),
        seq(s('まし'), s('た')),
      ),
    ),
  },
];
