/**
 * Test fixtures for scanned lessons: synthetic weather pages written for these tests, tokenized
 * by hand the way kuromoji splits them, and a small dictionary (ids illustrative). Used by
 * domain and feature tests only.
 */

import type { DictionaryRepo } from '../domain/repos.ts';
import type { LineDraft, PageDraft } from '../domain/services/scan-build.ts';
import { NOTHING_LISTED } from '../domain/services/scan-match.ts';
import type { Kanji, Sentence, Token, Word } from '../domain/types.ts';
import { createFakeDictionary } from '../lang/testing/fake-dictionary.ts';

function word(id: string, form: string, reading: string, gloss: string, extra: Partial<Word> = {}) {
  return { id, forms: [form], readings: [reading], glosses: [gloss], common: true, ...extra };
}

export const SCAN_WORDS = {
  yohou: word('s1', '天気予報', 'てんきよほう', 'weather forecast', { jlpt: 4, pos: ['n'] }),
  hare: word('s2', '晴れ', 'はれ', 'clear weather', { jlpt: 4, pos: ['n'] }),
  ame: word('s3', '雨', 'あめ', 'rain', { jlpt: 5, pos: ['n'] }),
  furu: word('s4', '降る', 'ふる', 'to fall', { jlpt: 5, pos: ['v5r'] }),
  yuki: word('s5', '雪', 'ゆき', 'snow', { jlpt: 4, pos: ['n'] }),
  ashita: word('s6', '明日', 'あした', 'tomorrow', { jlpt: 5, pos: ['n'] }),
  hareru: word('s7', '晴れる', 'はれる', 'to clear up', { jlpt: 4, pos: ['v1'] }),
} as const;

const kanji = (char: string, meaning: string, on: string, kun: string, jlpt: Kanji['jlpt']) => ({
  char,
  meanings: [meaning],
  on: [on],
  kun: [kun],
  components: [],
  ...(jlpt ? { jlpt } : {}),
});

export const SCAN_KANJI: readonly Kanji[] = [
  kanji('雨', 'rain', 'ウ', 'あめ', 5),
  kanji('晴', 'clear up', 'セイ', 'は.れる', 3),
  kanji('雪', 'snow', 'セツ', 'ゆき', 3),
];

export function scanDictionary(): DictionaryRepo {
  return createFakeDictionary(Object.values(SCAN_WORDS), SCAN_KANJI);
}

type Part = [
  surface: string,
  pos: string,
  reading: string,
  wordId?: string | undefined,
  base?: string,
];

export function tokens(parts: readonly Part[]): Token[] {
  let start = 0;
  return parts.map(([surface, pos, reading, wordId, base]) => {
    const token: Token = { surface, reading, base: base ?? surface, pos, start };
    if (wordId) token.wordId = wordId;
    start += surface.length;
    return token;
  });
}

const W = SCAN_WORDS;

/** 明日は晴れるでしょう。 — でしょう is found by its detector. */
export const LINE_DESHOU: LineDraft = {
  text: '明日は晴れるでしょう。',
  verified: true,
  tokens: tokens([
    ['明日', 'noun', 'あした', W.ashita.id],
    ['は', 'particle', 'は'],
    ['晴れる', 'verb', 'はれる', W.hareru.id],
    ['でしょ', 'auxiliary', 'でしょ', undefined, 'です'],
    ['う', 'auxiliary', 'う'],
    ['。', 'symbol', '。'],
  ]),
};

/** 雨が降ります。 */
export const LINE_RAIN: LineDraft = {
  text: '雨が降ります。',
  verified: false,
  tokens: tokens([
    ['雨', 'noun', 'あめ', W.ame.id],
    ['が', 'particle', 'が'],
    ['降り', 'verb', 'ふり', W.furu.id, '降る'],
    ['ます', 'auxiliary', 'ます'],
    ['。', 'symbol', '。'],
  ]),
};

/** A kanji list page the tutor read: three kanji and three words, one not in our lists. */
export const KANJI_PAGE: PageDraft = {
  kind: 'kanji-list',
  title: 'Weather and plans',
  lines: [LINE_RAIN],
  listed: {
    kanji: [
      { text: '雨', meaning: 'rain' },
      { text: '晴', meaning: 'clear up' },
      { text: '曇', meaning: 'cloudy' },
    ],
    words: [
      {
        text: '天気予報',
        reading: { surface: '天気予報', reading: 'てんきよほう', verified: true },
      },
      { text: '晴れ', reading: { surface: '晴れ', reading: 'はれ', verified: true } },
      {
        text: '雪見日和',
        meaning: 'a fine day for viewing snow',
        reading: { surface: '雪見日和', reading: 'ゆきみびより', verified: false },
      },
    ],
    grammar: [],
  },
  questions: [],
};

/** A grammar page: the tutor names 〜そうだ; でしょう is in a line. */
export const GRAMMAR_PAGE: PageDraft = {
  kind: 'grammar',
  title: 'Looks like rain',
  lines: [LINE_DESHOU],
  listed: { ...NOTHING_LISTED, grammar: [{ text: '〜そうだ', meaning: 'looks like' }] },
  questions: [],
};

/** A handout: two questions, answered by the tutor. */
export const HANDOUT_PAGE: PageDraft = {
  kind: 'handout',
  lines: [],
  listed: NOTHING_LISTED,
  questions: [
    {
      number: '1',
      type: 'choose-form',
      stem: '雨が降り＿＿です。',
      choices: ['そう', 'よう'],
      answer: 'そう',
      answerVerified: true,
      explanation: 'そう joins the ます stem.',
      readings: [],
    },
    {
      number: '2',
      type: 'reading',
      stem: '明日の天気予報を見ましたか。',
      target: '天気予報',
      choices: [],
      answer: 'てんきよほう',
      answerVerified: true,
      explanation: '天気 is てんき.',
      readings: [],
    },
  ],
};

/** A pack sentence at N5 with its tokens: 雨が降ります。 */
export function packSentence(id: string, line: LineDraft, level: Sentence['level'] = 5): Sentence {
  const wordIds = [...new Set(line.tokens.flatMap((t) => t.wordId ?? []))];
  return {
    id,
    text: line.text,
    source: 'tatoeba',
    tokens: line.tokens,
    wordIds,
    level,
    verified: true,
  };
}
