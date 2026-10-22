/** N4 grammar, part B: aspect, compound verbs, conditionals, passive, causative, keigo. */
import { afterDict, afterPast, afterPred, afterVerb, aru, ii, suru, te } from './common.ts';
import { alt, b, gap, not, notPrev, prev, s, seq, tok } from './dsl.ts';
import type { GrammarEntry } from './types.ts';

const afterStem = prev({ pos: 'verb', plain: false });
const causativeBase = ['せる', 'させる'];
const honorificPrefix = alt(
  seq(s('お'), tok({ pos: ['verb', 'suffix'] })),
  seq(s('ご'), tok({ pos: 'noun' })),
);

export const N4_B: readonly GrammarEntry[] = [
  {
    id: 'te-shimau',
    pattern: '〜てしまう',
    level: 4,
    family: 'aspect',
    meaning: 'end up doing; do completely',
    formation: 'V-て + しまう',
    explanation:
      'てしまう marks an action as done and over, often with regret: 財布を忘れてしまった. Sometimes it only stresses that a task is finished.',
    cloze: ['てしま', 'でしま'],
    rule: seq(te, b('しまう')),
  },
  {
    id: 'te-aru',
    pattern: '〜てある',
    level: 4,
    family: 'aspect',
    meaning: 'has been done (and stays so)',
    formation: 'transitive V-て + ある',
    explanation:
      "てある describes a state left by someone's deliberate action, like a window that has been opened. The object usually takes が.",
    cloze: ['てあ', 'であ'],
    rule: seq(te, aru),
  },
  {
    id: 'te-oku',
    pattern: '〜ておく',
    level: 4,
    family: 'aspect',
    meaning: 'do in advance; leave as is',
    formation: 'V-て + おく',
    explanation:
      'ておく is doing something now to be ready for later, or leaving things as they are. In speech it often shrinks to とく.',
    cloze: ['てお', 'でお'],
    rule: seq(te, b('おく', '置く')),
  },
  {
    id: 'te-iku',
    pattern: '〜ていく',
    level: 4,
    family: 'aspect',
    meaning: 'go on doing; change from now on',
    formation: 'V-て + いく',
    explanation:
      'ていく moves away from the speaker, in space or in time: a change that will continue from now on. It is the counterpart of てくる.',
    cloze: ['てい', 'でい', 'て行', 'で行'],
    rule: seq(te, b('いく', '行く')),
  },
  {
    id: 'te-kuru',
    pattern: '〜てくる',
    level: 4,
    family: 'aspect',
    meaning: 'start to; come after doing',
    formation: 'V-て + くる',
    explanation:
      'てくる moves toward the speaker: a change that has begun and reaches now, or going somewhere and coming back. 雨が降ってきた is "it started to rain".',
    cloze: ['てき', 'でき', 'てく', 'でく', 'て来', 'で来', 'てこ', 'でこ'],
    rule: seq(te, b('くる', '来る')),
  },
  {
    id: 'tokoro-da',
    pattern: '〜ところだ',
    level: 4,
    family: 'aspect',
    meaning: 'be about to; be in the middle of',
    formation: 'V-dictionary / V-ている + ところだ',
    explanation:
      'ところ points to a moment in an action. With the dictionary form it is just before the action, and with ている it is in the middle of it.',
    cloze: ['ところ', '所'],
    rule: seq(
      alt(afterDict, prev({ base: 'いる' })),
      s('ところ', '所'),
      tok({ surface: ['だ', 'です'], pos: 'auxiliary' }),
    ),
  },
  {
    id: 'ta-bakari',
    pattern: '〜たばかり',
    level: 4,
    family: 'aspect',
    meaning: 'have just done',
    formation: 'V-た + ばかり',
    explanation:
      "たばかり says that not much time has passed since the action, in the speaker's eyes. It can be weeks, if it still feels recent.",
    cloze: ['ばかり'],
    rule: seq(afterPast, s('ばかり')),
  },
  {
    id: 'te-miru',
    pattern: '〜てみる',
    level: 4,
    family: 'attempt',
    meaning: 'try doing (and see)',
    formation: 'V-て + みる',
    explanation:
      'てみる is doing something to find out how it is. It is written in kana, because it is not "see" with the eyes.',
    cloze: ['てみ', 'でみ'],
    rule: seq(te, b('みる')),
  },
  {
    id: 'hajimeru',
    pattern: '〜始める',
    level: 4,
    family: 'compound-verb',
    meaning: 'begin to',
    formation: 'V-stem + 始める',
    explanation:
      '始める after a masu-stem marks the start of an action or a change. It conjugates as an ordinary verb.',
    cloze: ['始め', 'はじめ'],
    rule: seq(afterStem, b('始める', 'はじめる')),
  },
  {
    id: 'owaru',
    pattern: '〜終わる',
    level: 4,
    family: 'compound-verb',
    meaning: 'finish doing',
    formation: 'V-stem + 終わる',
    explanation:
      '終わる after a masu-stem says that an action is complete, like reading a book to the end.',
    cloze: ['終わ', '終え', 'おわ'],
    rule: seq(afterStem, b('終わる', '終える', 'おわる')),
  },
  {
    id: 'tsuzukeru',
    pattern: '〜続ける',
    level: 4,
    family: 'compound-verb',
    meaning: 'keep doing',
    formation: 'V-stem + 続ける',
    explanation:
      '続ける after a masu-stem says that an action goes on without stopping. 歩き続けた is "kept walking".',
    cloze: ['続け', 'つづけ'],
    rule: seq(afterStem, b('続ける', 'つづける')),
  },
  {
    id: 'tara',
    pattern: '〜たら',
    level: 4,
    family: 'conditional',
    meaning: 'if; when; after',
    formation: 'V / adj in the た form + ら',
    explanation:
      'たら sets a condition, or a moment after which something happens. It is the most flexible conditional in speech.',
    cloze: ['たら', 'だら'],
    rule: seq(tok({ surface: ['たら', 'だら'], pos: 'auxiliary' }), not(alt(s('どう'), ii))),
  },
  {
    id: 'ba',
    pattern: '〜ば',
    level: 4,
    family: 'conditional',
    meaning: 'if',
    formation: 'V (〜えば) / い-adj (〜ければ)',
    explanation:
      'ば states a condition and what follows from it, often in general truths or advice. The main clause rarely gives an order.',
    cloze: ['ば'],
    rule: seq(
      notPrev({ surface: 'なけれ' }),
      afterPred,
      tok({ surface: 'ば', pos: 'particle' }),
      not(ii),
    ),
  },
  {
    id: 'to-conditional',
    pattern: '〜と (条件)',
    level: 4,
    family: 'conditional',
    meaning: 'whenever, if (then naturally)',
    formation: 'V-dictionary / V-ない + と',
    explanation:
      'This と links a cause and its natural, automatic result, like pressing a button and a door opening. The second clause cannot be a request.',
    cloze: ['と'],
    rule: seq(
      alt(afterDict, prev({ pos: 'adjective', plain: true }), prev({ surface: 'ない' })),
      tok({ surface: 'と', pos: 'particle' }),
      not(tok({ pos: ['verb', 'particle', 'auxiliary'] })),
    ),
  },
  {
    id: 'nara',
    pattern: '〜なら',
    level: 4,
    family: 'conditional',
    meaning: 'if (that is the case); as for',
    formation: 'plain form / N + なら',
    explanation:
      'なら picks up something just said or assumed and gives advice about it: "if you are going to Japan, …". It does not express time order.',
    cloze: ['なら'],
    rule: seq(tok({ surface: 'なら', pos: 'auxiliary' }), notPrev({ surface: 'なけれ' })),
  },
  {
    id: 'passive',
    pattern: '〜られる (受身)',
    level: 4,
    family: 'passive-causative',
    meaning: 'be done (passive)',
    formation: 'godan V-ない stem + れる / ichidan V + られる',
    explanation:
      'The passive turns the receiver of an action into the subject, and the doer takes に. It often adds a feeling of being troubled by it.',
    cloze: ['れ', 'られ'],
    rule: alt(
      seq(afterVerb, notPrev({ base: causativeBase }), b('れる')),
      seq(s('に'), gap(4), afterVerb, notPrev({ base: causativeBase }), b('られる')),
    ),
  },
  {
    id: 'causative',
    pattern: '〜させる',
    level: 4,
    family: 'passive-causative',
    meaning: 'make or let (someone) do',
    formation: 'godan V-ない stem + せる / ichidan V + させる',
    explanation:
      'The causative says that someone makes or allows another person to act. The person who acts takes に or を.',
    cloze: ['せ', 'させ'],
    rule: seq(afterVerb, b(...causativeBase), not(b('られる', 'れる'))),
  },
  {
    id: 'causative-passive',
    pattern: '〜させられる',
    level: 4,
    family: 'passive-causative',
    meaning: 'be made to do',
    formation: 'V-causative (〜させ) + られる',
    explanation:
      'This form says that someone was made to do something against their will. The person who forced it takes に.',
    cloze: ['せられ', 'させられ'],
    rule: seq(b(...causativeBase), b('られる')),
  },
  {
    id: 'sonkei-verbs',
    pattern: 'いらっしゃる・おっしゃる (尊敬語)',
    level: 4,
    family: 'honorific',
    meaning: 'respectful verbs',
    formation: 'special verbs: いらっしゃる, おっしゃる, 召し上がる, なさる, ご覧になる',
    explanation:
      'A few common verbs have their own respectful forms, used for what a superior or a customer does. You never use them for yourself.',
    cloze: ['いらっしゃ', 'おっしゃ', '召し上が', 'めしあが', 'なさ', 'ご覧'],
    rule: alt(
      b('いらっしゃる', 'おっしゃる', '召し上がる', 'めしあがる'),
      tok({ base: 'なさる', surface: ['なさっ', 'なさる', 'なさら'] }),
      seq(s('ご'), s('覧')),
    ),
  },
  {
    id: 'o-ni-naru',
    pattern: 'お〜になる',
    level: 4,
    family: 'honorific',
    meaning: 'respectful form of a verb',
    formation: 'お + V-stem + になる',
    explanation:
      'お + masu-stem + になる raises the person who acts. It works for most verbs that have no special respectful form.',
    cloze: ['にな'],
    rule: seq(honorificPrefix, s('に'), b('なる')),
  },
  {
    id: 'kenjou-verbs',
    pattern: '参る・申す (謙譲語)',
    level: 4,
    family: 'honorific',
    meaning: 'humble verbs',
    formation: 'special verbs: 参る, 申す, いたす, 伺う, 拝見する, おる',
    explanation:
      "Humble verbs lower the speaker's own actions to show respect for the listener. 参ります replaces 行きます and 来ます.",
    cloze: ['参', '申', 'いた', '致', '伺', 'うかが', '拝見', 'おり'],
    rule: alt(
      b('参る', '申す', '申し上げる', 'いたす', '致す', '伺う', 'うかがう', '存じる'),
      s('拝見'),
      seq(prev({ surface: ['て', 'で'] }), tok({ base: 'おる', surface: 'おり' })),
    ),
  },
  {
    id: 'o-suru',
    pattern: 'お〜する',
    level: 4,
    family: 'honorific',
    meaning: 'humbly do (for someone)',
    formation: 'お + V-stem + する / いたす',
    explanation:
      'お + masu-stem + する is a humble way to offer or do something for a superior. With いたす it is humbler still.',
    cloze: ['お', 'ご'],
    rule: seq(honorificPrefix, alt(suru, b('いたす', '致す'))),
  },
  {
    id: 'gozaimasu',
    pattern: '〜でございます',
    level: 4,
    family: 'honorific',
    meaning: 'is (very polite)',
    formation: 'N + でございます',
    explanation:
      'でございます is a very polite です, heard in shops, hotels and announcements. ございます alone is a polite あります.',
    cloze: ['ござい'],
    rule: b('ござる', 'ご座る'),
  },
];
