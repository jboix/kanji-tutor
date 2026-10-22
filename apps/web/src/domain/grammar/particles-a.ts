/** Case particles (G5): が, は, を, に, で, と, も, の, へ, から, まで. Written for this app. */
import { afterNoun, afterPred } from './common.ts';
import { seq, tok } from './dsl.ts';
import type { FunctionWord, FunctionWordUse } from './types.ts';

/** A use with its example and translation. */
export function use(what: string, example: string, translation: string): FunctionWordUse {
  return { use: what, example, translation };
}

/** The particle token itself, written one of `surface`. */
export function particle(...surface: string[]): ReturnType<typeof tok> {
  return tok({ surface, pos: 'particle' });
}

export const CASE_PARTICLES: readonly FunctionWord[] = [
  {
    id: 'particle-ga',
    pattern: 'が',
    level: 5,
    meaning: 'subject marker',
    explanation:
      'が marks who or what does something, or what the sentence is about when it is new information. It answers "who?" or "what?".',
    uses: [
      use('The subject, often new information', '雨が降っています。', 'It is raining.'),
      use('What exists, with ある and いる', '公園に犬がいます。', 'There is a dog in the park.'),
      use('What is liked, wanted or understood', '私は猫が好きです。', 'I like cats.'),
      use('Who, in a question and its answer', 'だれが来ましたか。', 'Who came?'),
    ],
    rule: seq(afterNoun, particle('が')),
  },
  {
    id: 'particle-wa',
    pattern: 'は',
    level: 5,
    meaning: 'topic marker: as for',
    explanation:
      'は sets the topic: what the rest of the sentence talks about. It is read わ. The topic is usually something already known.',
    uses: [
      use('The topic of the sentence', '私は学生です。', 'I am a student.'),
      use(
        'Contrast with something else',
        '肉は食べますが、魚は食べません。',
        "I eat meat, but I don't eat fish.",
      ),
      use(
        'After another particle, to make it the topic',
        '日本では車は左を走ります。',
        'In Japan, cars drive on the left.',
      ),
    ],
    rule: particle('は'),
  },
  {
    id: 'particle-wo',
    pattern: 'を',
    level: 5,
    meaning: 'object marker',
    explanation:
      'を marks the thing an action is done to. It is read お. With verbs of movement it marks the place you go through or leave.',
    uses: [
      use('The object of a verb', '毎朝コーヒーを飲みます。', 'I drink coffee every morning.'),
      use('The place you move through', '公園を散歩しました。', 'I took a walk through the park.'),
      use('The place you leave', '八時に家を出ます。', 'I leave home at eight.'),
    ],
    rule: particle('を'),
  },
  {
    id: 'particle-ni',
    pattern: 'に',
    level: 5,
    meaning: 'at, in, to (a point)',
    explanation:
      'に points at one spot: a time, a place where something is, a destination, or a person who receives something. Context tells which.',
    uses: [
      use('A point in time', '七時に起きます。', 'I get up at seven.'),
      use(
        'Where something is, with ある and いる',
        '机の上に本があります。',
        'There is a book on the desk.',
      ),
      use('A destination', '来週、京都に行きます。', 'I am going to Kyoto next week.'),
      use('Who receives or is asked', '友達に手紙を書きました。', 'I wrote a letter to a friend.'),
    ],
    rule: particle('に'),
  },
  {
    id: 'particle-de',
    pattern: 'で',
    level: 5,
    meaning: 'at, in, by, with',
    explanation:
      'で marks where an action happens, or the means or cause of it. Unlike に, the place with で is where something is done, not where something is.',
    uses: [
      use('Where an action happens', '図書館で勉強します。', 'I study at the library.'),
      use('A means or tool', 'バスで学校に行きます。', 'I go to school by bus.'),
      use('A cause', '風邪で会社を休みました。', 'I stayed off work with a cold.'),
      use('A range or group', 'クラスで一番背が高い。', 'He is the tallest in the class.'),
    ],
    rule: seq(afterNoun, particle('で')),
  },
  {
    id: 'particle-to',
    pattern: 'と',
    level: 5,
    meaning: 'and, with; quotation',
    explanation:
      'と between nouns lists all of them ("A and B"). After a person it means "with". After words or a sentence it quotes them.',
    uses: [
      use('And, listing every item', 'パンと卵を買いました。', 'I bought bread and eggs.'),
      use('With someone', '母と買い物に行きました。', 'I went shopping with my mother.'),
      use(
        'Quoting what was said or thought',
        '先生は明日休むと言いました。',
        'The teacher said she would be off tomorrow.',
      ),
    ],
    rule: particle('と'),
  },
  {
    id: 'particle-mo',
    pattern: 'も',
    level: 5,
    meaning: 'also, too; even',
    explanation:
      'も replaces は, が or を to say "also". After an amount it stresses how much, and with a question word and a negative it means "not any".',
    uses: [
      use('Also, too', '私も行きます。', 'I am going too.'),
      use(
        'As many as, stressing an amount',
        '三時間も待ちました。',
        'I waited a whole three hours.',
      ),
      use(
        'Not any, with a question word',
        '今日は何も食べていません。',
        "I haven't eaten anything today.",
      ),
    ],
    rule: particle('も'),
  },
  {
    id: 'particle-no',
    pattern: 'の',
    level: 5,
    meaning: "of, 's",
    explanation:
      'の links two nouns: the first one describes or owns the second. After a verb it turns the clause into a noun.',
    uses: [
      use('Whose', 'これは姉のかばんです。', "This is my sister's bag."),
      use('What kind', '日本語の先生に会いました。', 'I met the Japanese teacher.'),
      use('Where or when', '駅の前で待っています。', 'I am waiting in front of the station.'),
      use('Turning a verb into a noun', '本を読むのが好きです。', 'I like reading books.'),
    ],
    // The nominaliser の (読むのが) is tagged a noun.
    rule: tok({ surface: 'の', pos: ['particle', 'noun'] }),
  },
  {
    id: 'particle-e',
    pattern: 'へ',
    level: 5,
    meaning: 'to, toward',
    explanation:
      'へ marks the direction of movement. It is read え. It is close to に for destinations, with more weight on the way there.',
    uses: [
      use(
        'Direction of movement',
        '夏休みに北海道へ行きます。',
        'I am going to Hokkaido in the summer holidays.',
      ),
      use(
        'Who a letter or gift is for, as への',
        '母への手紙を書きました。',
        'I wrote a letter to my mother.',
      ),
    ],
    rule: particle('へ'),
  },
  {
    id: 'particle-kara-from',
    pattern: 'から (from)',
    level: 5,
    meaning: 'from',
    explanation:
      'から after a noun marks where or when something starts, or who something comes from. After a sentence it means "because" instead.',
    uses: [
      use(
        'A starting place',
        '駅から歩いて十分です。',
        'It is ten minutes on foot from the station.',
      ),
      use('A starting time', '授業は九時から始まります。', 'Class starts at nine.'),
      use('Who it comes from', '友達からメールが来ました。', 'An email came from a friend.'),
    ],
    rule: seq(afterNoun, particle('から')),
  },
  {
    id: 'particle-kara-because',
    pattern: 'から (because)',
    level: 5,
    meaning: 'because, so',
    explanation:
      'から after a sentence gives a reason for what follows. It sounds direct and personal.',
    uses: [
      use(
        'A reason, before the result',
        '寒いから、窓を閉めます。',
        "It's cold, so I'll close the window.",
      ),
      use(
        'A reason after the fact, with です',
        '行きません。忙しいですから。',
        "I won't go. I'm busy.",
      ),
    ],
    rule: seq(afterPred, particle('から')),
    grammarId: 'kara-reason',
  },
  {
    id: 'particle-made',
    pattern: 'まで',
    level: 5,
    meaning: 'until, as far as',
    explanation:
      'まで marks an end point in time or space. With から it gives both ends: 九時から五時まで.',
    uses: [
      use('Until a time', '五時まで働きます。', 'I work until five.'),
      use('As far as a place', '駅まで送りましょう。', "I'll take you as far as the station."),
      use('Even, as an extreme', '子供まで知っています。', 'Even children know it.'),
    ],
    rule: particle('まで'),
  },
];
