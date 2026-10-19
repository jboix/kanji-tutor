/** Pruning of words and kanji around the selected sentences. Pure. */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Kanji, Sentence, Word } from '../../src/domain/types.ts';
import type { JmWord } from './jmdict.ts';
import { isCommon, toWord, usualKanjiForm } from './jmdict.ts';
import {
  assignPhonetics,
  componentsOf,
  isJoyo,
  type KanjiDic,
  type KradFile,
  partCandidates,
  toKanji,
  vocabularyKanjiLevels,
} from './kanji.ts';
import { wordVariants } from './readings.ts';

/**
 * Words kept even when not common, on a list or in a sentence: fused polite forms the units
 * use, and words the unit authors needed (D40).
 */
export const EXTRA_WORDS = [
  'お正月',
  'お客',
  'お寺',
  'お盆',
  'お礼',
  '食券',
  'お湯',
  '番線',
  '保険証',
  '成人式',
  '卵焼き',
  '揺れ',
  '一期一会',
];

const HAN = /\p{Script=Han}/u;

function hanChars(forms: Iterable<string>): Set<string> {
  return new Set([...forms].flatMap((f) => [...f].filter((c) => HAN.test(c))));
}

/**
 * Every KANJIDIC2 kanji as `Kanji` (no components yet), for sentence levels. Its level comes
 * from the listed words usually written with it, else from KANJIDIC2 (D56).
 */
export function kanjiTable(
  dic: KanjiDic,
  words: readonly JmWord[],
  jlpt: ReadonlyMap<string, JlptLevel | undefined>,
): Map<string, Kanji> {
  const easy = words.filter((w) => (jlpt.get(w.id) ?? 0) >= 3);
  const inN3Words = hanChars(easy.flatMap((w) => w.kanji.map((k) => k.text)));
  const listed = words.filter((w) => jlpt.has(w.id));
  const vocab = vocabularyKanjiLevels(
    listed.map((w) => ({ form: usualKanjiForm(w), level: jlpt.get(w.id) })),
  );
  return new Map(
    dic.characters.map((c) => [
      c.literal,
      toKanji(c, inN3Words.has(c.literal), vocab.get(c.literal)),
    ]),
  );
}

/** The Jōyō kanji plus every kanji written in a kept word, with components and phonetics. */
export function pruneKanji(
  dic: KanjiDic,
  krad: KradFile['kanji'],
  table: Map<string, Kanji>,
  words: readonly Word[],
): Kanji[] {
  const inWords = hanChars(words.flatMap((w) => w.forms));
  const kept = dic.characters.filter((c) => isJoyo(c) || inWords.has(c.literal));
  const joyo = new Map(
    dic.characters.filter(isJoyo).map((c) => {
      const k = table.get(c.literal) as Kanji;
      return [c.literal, { strokes: k.strokes ?? 0, on: k.on }];
    }),
  );
  const parts = partCandidates(krad, joyo);
  const kanji = kept
    .map((c) => table.get(c.literal) as Kanji)
    .map((k) => ({
      ...k,
      components: componentsOf({ ...k, strokes: k.strokes ?? 99 }, krad, parts),
    }))
    .sort((a, b) => (a.char < b.char ? -1 : 1));
  assignPhonetics(kanji);
  return kanji;
}

/** Ids of the JMdict entries written `text` (any kanji or kana writing). */
function idsWritten(words: readonly JmWord[], texts: ReadonlySet<string>): string[] {
  return words
    .filter((w) => [...w.kanji, ...w.kana].some((t) => texts.has(t.text)))
    .map((w) => w.id);
}

export interface WordNeeds {
  jlpt: ReadonlyMap<string, JlptLevel | undefined>;
  sentences: readonly Sentence[];
  /** Words that must be kept, e.g. unit words. */
  ids: Iterable<string>;
  /** Writings whose entries are kept: mockup words and `EXTRA_WORDS`. */
  writings: Iterable<string>;
}

/** Common and JLPT words, the words of the kept sentences, and the needed ids and writings. */
export function pruneWords(words: readonly JmWord[], needs: WordNeeds): Word[] {
  const keep = new Set<string>(needs.ids);
  for (const w of words) if (isCommon(w) || needs.jlpt.has(w.id)) keep.add(w.id);
  for (const s of needs.sentences) for (const id of s.wordIds) keep.add(id);
  for (const id of idsWritten(words, new Set(needs.writings))) keep.add(id);
  return words.filter((w) => keep.has(w.id)).map((w) => withVariants(w, toWord(w, needs.jlpt)));
}

/** The word with its valid reading variants (D56), when it has any. */
function withVariants(jm: JmWord, word: Word): Word {
  const variants = wordVariants(jm, word.forms[0], word.readings[0]);
  return variants ? { ...word, variants } : word;
}
