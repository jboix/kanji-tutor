/**
 * The fixture pack: a small, real subset of the full packs (≈500 words, 300 kanji, 300 sentences)
 * built around the words in the design mockups, for e2e tests and `VITE_PACKS=fixture` builds.
 */
import type {
  Cluster,
  GrammarPoint,
  Kanji,
  Sentence,
  UnitPack,
  Word,
} from '../../src/domain/types.ts';
import { buildClusters } from './clusters.ts';
import type { LanguagePack } from './languages.ts';

/** Words shown in the design mockups, plus kanji-page examples (生 family, 寺 and 青 families). */
export const FIXTURE_TARGETS = [
  '駅',
  '友達',
  '待つ',
  '間',
  '本',
  '読む',
  '紹介',
  '先生',
  '新しい',
  '一緒',
  '一生',
  '生',
  '学生',
  '生きる',
  '生まれる',
  '生ビール',
  '方言',
  '影響',
  '地域',
  '標準語',
  '様々',
  '持つ',
  '特',
  '時',
  '詩',
  '性',
  '星',
  '姓',
  '手紙',
  '人々',
  '学校',
  '嫌い',
  '好き',
  '漢字',
  '書く',
  '生活',
  '今日',
  '話す',
  '若い',
  '多い',
  '人',
  '日本語',
  'テレビ',
  '減る',
  '晴れる',
  '青い',
  '静か',
  '特に',
  '時間',
  // Used by the mock tutor's Japanese note (src/ai/fixtures), which e2e expects known at N5.
  '使う',
];

/** Extra kanji to show phonetic families and lookalikes on the Kanji page. */
const FIXTURE_KANJI = [...'待持特時詩寺侍青清晴精静情請生性星姓牲'];

export const FIXTURE_SIZES = {
  words: 500,
  kanji: 300,
  sentences: 300,
  perTarget: 4,
  perN5Grammar: 2,
  /** N5–N4 sentences long enough to cut into four or more chunks (J5 questions). */
  chunky: 80,
  /** Only the first units of the path, with their words and passages, keep the fixture small. */
  units: 4,
};

export interface Pack {
  words: Word[];
  kanji: Kanji[];
  /** Tatoeba sentences, then the units' passage sentences. */
  sentences: Sentence[];
  grammar: GrammarPoint[];
  clusters: Cluster[];
  units: UnitPack[];
  languages: LanguagePack[];
}

/** JMdict ids for each target: entries whose primary writing is the target, common first. */
function targetIds(words: Word[], targets: readonly string[]): string[][] {
  return targets.map((target) =>
    words
      .filter((w) => w.forms[0] === target || (w.forms.length === 0 && w.readings[0] === target))
      .sort((a, b) => Number(b.common) - Number(a.common) || Number(a.id) - Number(b.id))
      .slice(0, 3)
      .map((w) => w.id),
  );
}

function byLength(sentences: Sentence[]): Sentence[] {
  return [...sentences].sort(
    (a, b) => a.text.length - b.text.length || Number(a.sourceRef) - Number(b.sourceRef),
  );
}

/**
 * Up to `perTarget` short sentences per target word, preferring the full pack and falling back
 * to the wider pool of resolved sentences (only those whose words are all in the full pack), then
 * short sentences made only of `easy` words up to the fixture size.
 */
function pickSentences(full: Pack, pool: Sentence[], targets: string[][], easy: Set<string>) {
  const known = new Set(full.words.map((w) => w.id));
  const ranked = [
    ...byLength(full.sentences.filter((s) => s.source === 'tatoeba')),
    ...byLength(pool.filter((s) => s.wordIds.every((id) => known.has(id)))),
  ];
  const picked = new Map<string, Sentence>();
  for (const ids of targets) {
    const withWord = ranked.filter((s) => s.wordIds.some((id) => ids.includes(id)));
    for (const s of withWord.slice(0, FIXTURE_SIZES.perTarget)) picked.set(s.id, s);
  }
  for (const s of n5GrammarExamples(full)) picked.set(s.id, s);
  for (const s of chunkySentences(full)) picked.set(s.id, s);
  for (const s of byLength(full.sentences.filter((s) => s.source === 'tatoeba'))) {
    if (picked.size >= FIXTURE_SIZES.sentences) break;
    if (s.wordIds.every((id) => easy.has(id))) picked.set(s.id, s);
  }
  return [...picked.values()].sort((a, b) => Number(a.sourceRef) - Number(b.sourceRef));
}

/** The first examples of every N5 grammar point, so the fixture can introduce N5 grammar. */
function n5GrammarExamples(full: Pack): Sentence[] {
  const byId = new Map(full.sentences.map((s) => [s.id, s]));
  return full.grammar
    .filter((point) => point.level === 5)
    .flatMap((point) => point.exampleSentenceIds.slice(0, FIXTURE_SIZES.perN5Grammar))
    .flatMap((id) => byId.get(id) ?? []);
}

/** Short N5–N4 sentences with at least six tokens besides punctuation, shortest first. */
function chunkySentences(full: Pack): Sentence[] {
  const long = (s: Sentence) => s.tokens.filter((t) => t.pos !== 'symbol').length >= 6;
  return byLength(
    full.sentences.filter((s) => s.source === 'tatoeba' && (s.level ?? 0) >= 4 && long(s)),
  ).slice(0, FIXTURE_SIZES.chunky);
}

function kanjiOf(words: Word[]): Set<string> {
  return new Set(
    words.flatMap((w) => [...(w.forms[0] ?? '')].filter((c) => /\p{Script=Han}/u.test(c))),
  );
}

/**
 * Kanji of the target words and of the sentences (with their components and the family
 * examples) always; the kanji of filler words and then the most frequent kanji only up to the
 * fixture size.
 */
function pickKanji(all: Kanji[], needed: Word[], filler: Word[]): Kanji[] {
  const byChar = new Map(all.map((k) => [k.char, k]));
  const chars = new Set([...kanjiOf(needed), ...FIXTURE_KANJI]);
  for (const char of [...chars]) {
    for (const part of byChar.get(char)?.components ?? []) chars.add(part);
  }
  const ranked = [...all].sort(
    (a, b) => (a.freq ?? 9999) - (b.freq ?? 9999) || a.char.localeCompare(b.char),
  );
  for (const char of [...kanjiOf(filler), ...ranked.map((k) => k.char)]) {
    if (chars.size >= FIXTURE_SIZES.kanji) break;
    chars.add(char);
  }
  return all.filter((k) => chars.has(k.char));
}

/** Catalogue points with only the examples that are in the fixture. */
function fixtureGrammar(full: Pack, sentences: Sentence[]): GrammarPoint[] {
  const ids = new Set(sentences.map((s) => s.id));
  return full.grammar.map((point) => ({
    ...point,
    exampleSentenceIds: point.exampleSentenceIds.filter((id) => ids.has(id)),
  }));
}

/** The first units with their passages; tagged sentences only when they are in the fixture. */
function fixtureUnits(full: Pack, sentences: Sentence[]): UnitPack[] {
  const ids = new Set(sentences.map((s) => s.id));
  return full.units.slice(0, FIXTURE_SIZES.units).map((unit) => ({
    ...unit,
    sentenceIds: unit.sentenceIds.filter((id) => ids.has(id)),
  }));
}

function fixtureLanguages(full: Pack, words: Word[], sentences: Sentence[]): LanguagePack[] {
  const wordIds = new Set(words.map((w) => w.id));
  const sentenceIds = new Set(sentences.map((s) => s.id));
  return full.languages.map((lang) => ({
    language: lang.language,
    glosses: lang.glosses.filter((g) => wordIds.has(g.id)),
    translations: lang.translations.filter((t) => sentenceIds.has(t.id)),
  }));
}

function fixtureWords(full: Pack, targets: string[][], sentences: Sentence[]): Set<string> {
  const unitWords = full.units.slice(0, FIXTURE_SIZES.units).flatMap((u) => u.wordIds);
  const wordIds = new Set([...targets.flat(), ...sentences.flatMap((s) => s.wordIds)]);
  const fill = full.words.filter((w) => w.common && w.jlpt && w.jlpt >= 4).map((w) => w.id);
  for (const id of fill) {
    if (wordIds.size >= FIXTURE_SIZES.words) break;
    wordIds.add(id);
  }
  for (const id of unitWords) wordIds.add(id);
  return wordIds;
}

const LEVEL_WORD_LEVELS = [5, 4] as const;

/** Kanji of `level` that no word of that level among `words` carries. */
function unprovedKanji(kanji: readonly Kanji[], words: readonly Word[], level: number) {
  const carried = kanjiOf(words.filter((w) => w.jlpt === level));
  return new Set(kanji.filter((k) => k.jlpt === level && !carried.has(k.char)).map((k) => k.char));
}

/** Greedy: the full pack's words of `level` that carry the most of `missing`, common first. */
function coveringWords(full: Pack, missing: Set<string>, level: number, inPack: Set<string>) {
  const added: Word[] = [];
  const candidates = full.words.filter((w) => w.jlpt === level && w.forms.length > 0);
  const gain = (w: Word) => [...kanjiOf([w])].filter((c) => missing.has(c)).length;
  const fits = (w: Word) => [...kanjiOf([w])].every((c) => inPack.has(c));
  while (missing.size > 0) {
    const ranked = candidates
      .filter((w) => gain(w) > 0)
      .sort(
        (a, b) =>
          Number(fits(b)) - Number(fits(a)) ||
          gain(b) - gain(a) ||
          Number(b.common) - Number(a.common) ||
          Number(a.id) - Number(b.id),
      );
    const best = ranked[0];
    if (!best) break;
    added.push(best);
    for (const c of kanjiOf([best])) missing.delete(c);
  }
  return added;
}

/**
 * Adds, for every N5 and N4 kanji of the fixture, a word of that level carrying it, so marking a
 * level known proves its kanji as it does in the full pack (P4). The clusters and the
 * language packs follow the new word list.
 */
export function withLevelWords(full: Pack, fixture: Pack): Pack {
  const inPack = new Set(fixture.kanji.map((k) => k.char));
  const words = [...fixture.words];
  for (const level of LEVEL_WORD_LEVELS) {
    words.push(...coveringWords(full, unprovedKanji(fixture.kanji, words, level), level, inPack));
  }
  const ids = new Set(words.map((w) => w.id));
  const all = full.words.filter((w) => ids.has(w.id));
  const tatoeba = fixture.sentences.filter((s) => s.source === 'tatoeba');
  return {
    ...fixture,
    words: all,
    clusters: buildClusters(all, tatoeba),
    languages: fixtureLanguages(full, all, fixture.sentences),
  };
}

/** Builds the fixture pack from the full pack and the pool of all resolved sentences. */
export function buildFixture(full: Pack, pool: Sentence[]): Pack {
  const targets = targetIds(full.words, FIXTURE_TARGETS);
  const easy = new Set(full.words.filter((w) => w.jlpt === 5 || w.jlpt === 4).map((w) => w.id));
  const units = new Set(full.units.slice(0, FIXTURE_SIZES.units).map((u) => u.id));
  const passages = full.sentences.filter(
    (s) => s.source === 'unit' && units.has(s.sourceRef ?? ''),
  );
  const sentences = [...pickSentences(full, pool, targets, easy), ...passages];
  const wordIds = fixtureWords(full, targets, sentences);
  const neededIds = new Set([
    ...targets.flat(),
    ...sentences.flatMap((s) => s.wordIds),
    ...full.units.slice(0, FIXTURE_SIZES.units).flatMap((u) => u.wordIds),
  ]);
  const needed = full.words.filter((w) => neededIds.has(w.id));
  const words = full.words.filter((w) => wordIds.has(w.id));
  const tatoeba = sentences.filter((s) => s.source === 'tatoeba');
  return withLevelWords(full, {
    words,
    kanji: pickKanji(full.kanji, needed, words),
    sentences,
    grammar: fixtureGrammar(full, tatoeba),
    clusters: [],
    units: fixtureUnits(full, tatoeba),
    languages: [],
  });
}
