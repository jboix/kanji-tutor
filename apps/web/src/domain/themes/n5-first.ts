/**
 * N5 unit 1, the first lesson from zero (T8): は, です and じゃありません with a few nouns, in kana
 * and the first N5 kanji only. Written for the app.
 */
import type { Unit } from './types.ts';

export const N5_FIRST: readonly Unit[] = [
  {
    id: 'i-am-a-student',
    order: 1,
    level: 5,
    theme: 'I am a student',
    titleJa: 'わたしは学生です',
    summary:
      'A Japanese sentence often starts with what it is about: わたしは, "as for me", then what that is.',
    words: [
      { written: 'わたし', reading: 'わたし' },
      { written: '学生', reading: 'がくせい' },
      { written: '大学生', reading: 'だいがくせい' },
      { written: '先生', reading: 'せんせい' },
      { written: '人', reading: 'ひと' },
      { written: '日本人', reading: 'にほんじん' },
      { written: '中国人', reading: 'ちゅうごくじん' },
      { written: '会社', reading: 'かいしゃ' },
      { written: 'はい', reading: 'はい' },
      { written: 'いいえ', reading: 'いいえ' },
    ],
    grammar: ['desu', 'ja-nai', 'ka-question'],
    passage: {
      sentences: [
        { ja: 'わたしはアンナです。', en: 'I am Anna.' },
        { ja: 'アメリカ人です。', en: 'I am American.' },
        { ja: '日本人じゃありません。', en: 'I am not Japanese.' },
        { ja: 'わたしは大学生です。', en: 'I am a university student.' },
        { ja: 'リンさんは中国人です。', en: 'Lin is Chinese.' },
        { ja: 'リンさんは学生ではありません。', en: 'Lin is not a student.' },
        { ja: 'リンさんは会社の人です。', en: 'Lin works for a company.' },
        {
          ja: '山本さんは先生ですか。はい、先生です。',
          en: 'Is Ms Yamamoto a teacher? Yes, she is.',
        },
      ],
    },
    questions: [
      {
        kind: 'content',
        prompt: 'アンナさんはどこの人ですか。',
        options: ['日本の人', 'アメリカの人', '中国の人', 'フランスの人'],
        answer: 1,
        evidence: 1,
        explanation:
          'Line 2 says アメリカ人です, "I am American", so she is アメリカの人. Line 3 says she is not Japanese, the Chinese person is Lin, and France is never mentioned.',
      },
      {
        kind: 'content',
        prompt: 'リンさんは学生ですか。',
        options: [
          'はい、大学生です。',
          'いいえ、会社の人です。',
          'はい、先生です。',
          'いいえ、日本の人です。',
        ],
        answer: 1,
        evidence: 5,
        explanation:
          'Line 6: リンさんは学生ではありません, "Lin is not a student", and line 7 says what Lin is: 会社の人, someone who works for a company. The university student is Anna, the teacher is Ms Yamamoto, and Lin is Chinese, not Japanese.',
      },
      {
        kind: 'content',
        prompt: 'だれが先生ですか。',
        options: ['アンナさん', 'リンさん', '山本さん', 'わたし'],
        answer: 2,
        evidence: 7,
        explanation:
          'Line 8: 山本さんは先生ですか。はい、先生です, "Is Ms Yamamoto a teacher? Yes". Anna, who writes わたし, is a student, and Lin works for a company.',
      },
    ],
  },
];
