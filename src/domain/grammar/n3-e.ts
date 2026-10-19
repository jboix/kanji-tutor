/** N3 grammar, part E: points the thematic units use (〜ず, 〜と呼ばれる, 〜にかけて). Written for D29. */
import { afterVerb, te } from './common.ts';
import { alt, b, not, prev, s, seq, tok } from './dsl.ts';
import type { GrammarEntry } from './types.ts';

/** Time words a 〜にかけて span can end on: months, seasons, parts of the day. */
const TIME_ENDS = [
  '月',
  '日',
  '年',
  '朝',
  '昼',
  '夜',
  '春',
  '夏',
  '秋',
  '冬',
  '週',
  '末',
  '頃',
  'ごろ',
];

export const N3_E: readonly GrammarEntry[] = [
  {
    id: 'zu',
    pattern: '〜ず',
    level: 3,
    family: 'manner',
    meaning: 'not …, and; without',
    formation: 'V-ない stem + ず (する → せず)',
    explanation:
      'ず is a written negative that links clauses: 成績が上がらず、不安になった means "my grades did not go up, and I got anxious". Followed by に it becomes 〜ずに, "without doing".',
    cloze: ['ず'],
    rule: seq(afterVerb, tok({ surface: 'ず', pos: 'auxiliary' }), not(s('に'))),
  },
  {
    id: 'to-yobareru',
    pattern: '〜と呼ばれる',
    level: 3,
    family: 'quotation',
    meaning: 'is called …; is known as …',
    formation: 'N + と呼ばれる',
    explanation:
      'The passive of と呼ぶ, "to call it …", used to name or define something: これは「落ち」と呼ばれる. It is common in explanations and textbooks.',
    cloze: ['と呼ば'],
    rule: seq(s('と'), b('呼ぶ'), b('れる')),
  },
  {
    id: 'ni-kakete',
    pattern: '〜から〜にかけて',
    level: 3,
    family: 'time',
    meaning: 'from … through …; over the period of',
    formation: '(N + から) N + にかけて',
    explanation:
      'にかけて marks a stretch of time or space with soft edges: 六月から七月にかけて, "from June into July". Unlike 〜から〜まで, the limits are approximate.',
    cloze: ['にかけ'],
    rule: seq(
      prev({ ends: TIME_ENDS }),
      alt(s('にかけて'), seq(s('に'), tok({ base: ['かける', '掛ける'] }), te)),
    ),
  },
];
