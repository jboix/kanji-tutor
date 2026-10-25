/**
 * Test fixtures for captures: the generic handout lines from capture.html, tokenized by hand the
 * way kuromoji splits them, and a small dictionary with JMdict-style readings (ids illustrative).
 * Used by domain and feature tests only.
 */
import type { DictionaryRepo } from '../repos.ts';
import type { Token, Word } from '../types.ts';

type Part = [surface: string, pos: string, reading: string, wordId?: string, base?: string];

function word(id: string, form: string, reading: string, gloss: string): Word {
  // Every capture word counts as N3, so an N3 learner's level gate (G3) lets them through.
  return { id, forms: [form], readings: [reading], glosses: [gloss], common: true, jlpt: 3 };
}

export const CAPTURE_WORDS = {
  nihon: word('c1', '日本', 'にほん', 'Japan'),
  chiiki: word('c2', '地域', 'ちいき', 'area; region'),
  samazama: word('c3', '様々', 'さまざま', 'various'),
  hougen: word('c4', '方言', 'ほうげん', 'dialect'),
  eikyou: word('c5', '影響', 'えいきょう', 'influence'),
  wakai: word('c6', '若い', 'わかい', 'young'),
  hito: word('c7', '人', 'ひと', 'person'),
  hyoujungo: word('c8', '標準語', 'ひょうじゅんご', 'standard language'),
  hanasu: word('c9', '話す', 'はなす', 'to speak'),
  heru: word('c10', '減る', 'へる', 'to decrease'),
  ooi: word('c11', '多い', 'おおい', 'many'),
} as const;

const W = CAPTURE_WORDS;

function tokens(parts: readonly Part[]): Token[] {
  let start = 0;
  return parts.map(([surface, pos, reading, wordId, base]) => {
    const token: Token = { surface, reading, base: base ?? surface, pos, start };
    if (wordId) token.wordId = wordId;
    start += surface.length;
    return token;
  });
}

const LINE_1: Part[] = [
  ['日本', 'noun', 'にほん', W.nihon.id],
  ['に', 'particle', 'に'],
  ['は', 'particle', 'は'],
  ['地域', 'noun', 'ちいき', W.chiiki.id],
  ['によって', 'particle', 'によって'],
  ['様々', 'noun', 'さまざま', W.samazama.id],
  ['な', 'auxiliary', 'な'],
  ['方言', 'noun', 'ほうげん', W.hougen.id],
  ['が', 'particle', 'が'],
  ['ある', 'verb', 'ある'],
  ['。', 'symbol', '。'],
];

const LINE_2: Part[] = [
  ['テレビ', 'noun', 'てれび'],
  ['の', 'particle', 'の'],
  ['影響', 'noun', 'えいきょう', W.eikyou.id],
  ['で', 'particle', 'で'],
  ['、', 'symbol', '、'],
  ['若い', 'adjective', 'わかい', W.wakai.id],
  ['人', 'noun', 'ひと', W.hito.id],
  ['は', 'particle', 'は'],
  ['標準語', 'noun', 'ひょうじゅんご', W.hyoujungo.id],
  ['を', 'particle', 'を'],
  ['話す', 'verb', 'はなす', W.hanasu.id],
  ['こと', 'noun', 'こと'],
  ['が', 'particle', 'が'],
  ['多い', 'adjective', 'おおい', W.ooi.id],
  ['。', 'symbol', '。'],
];

const LINE_3: Part[] = [
  ['しかし', 'conjunction', 'しかし'],
  ['、', 'symbol', '、'],
  ['方言', 'noun', 'ほうげん', W.hougen.id],
  ['を', 'particle', 'を'],
  ['話す', 'verb', 'はなす', W.hanasu.id],
  ['人', 'noun', 'ひと', W.hito.id],
  ['が', 'particle', 'が'],
  ['減っ', 'verb', 'へっ', W.heru.id, '減る'],
  ['て', 'particle', 'て'],
  ['いる', 'verb', 'いる'],
  ['わけ', 'noun', 'わけ'],
  ['で', 'auxiliary', 'で'],
  ['は', 'particle', 'は'],
  ['ない', 'auxiliary', 'ない'],
  ['。', 'symbol', '。'],
];

/** The three handout lines with their tokens. */
export const CAPTURE_LINES = [LINE_1, LINE_2, LINE_3].map((parts) => {
  const toks = tokens(parts);
  return { text: toks.map((t) => t.surface).join(''), tokens: toks };
});

/** A dictionary over the fixture words only (kanji lookups find nothing). */
export function captureDictionary(words: readonly Word[] = Object.values(W)): DictionaryRepo {
  const byId = new Map(words.map((entry) => [entry.id, entry]));
  const has = (entry: Word, text: string) =>
    entry.forms.includes(text) || entry.readings.includes(text);
  return {
    word: async (id) => byId.get(id),
    words: async (ids) => ids.map((id) => byId.get(id)),
    wordsByText: async (text) => words.filter((entry) => has(entry, text)),
    wordsByReadingPrefix: async (kana, limit) =>
      words.filter((entry) => entry.readings.some((r) => r.startsWith(kana))).slice(0, limit),
    kanji: async () => undefined,
    kanjiMany: async (chars) => chars.map(() => undefined),
    kanjiByPhonetic: async () => [],
    kanjiByComponent: async () => [],
    wordCount: async () => words.length,
  };
}
