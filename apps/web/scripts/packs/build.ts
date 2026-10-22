/**
 * `bun run packs`: downloads the pinned sources (scripts/packs/sources.ts) into data/raw/, prunes
 * them, pre-tokenizes the sentences with kuromoji, tags their grammar and level, and writes
 * versioned gzip packs to public/packs/<version>/ with public/packs/manifest.json, plus the
 * fixture pack in public/packs/fixture/. Then it runs the theme check on the new packs.
 * The sources and their licences are in sources.ts.
 *
 * Flags: --refresh-tatoeba accepts a newer weekly Tatoeba dump than the pinned hashes.
 */
import { join, resolve } from 'node:path';
import { UNITS } from '../../src/domain/themes/units.ts';
import type { Sentence, Token } from '../../src/domain/types.ts';
import { joinKanaWords } from '../../src/lang/kana-join.ts';
import { EXTRA_WORDS, kanjiTable, pruneKanji, pruneWords } from './assemble.ts';
import { buildClusters } from './clusters.ts';
import { joinCompounds, kanaWordIds } from './compounds.ts';
import {
  levelContext,
  levelled,
  loadJlpt,
  loadResolved,
  type SourcePath,
  untaggedLevels,
} from './corpus.ts';
import { countByLevel, coverageReport, selectWithCoverage } from './coverage.ts';
import { ensureSource, type FetchOptions, readTgzJson } from './fetch.ts';
import { buildFixture, FIXTURE_TARGETS, type Pack } from './fixture.ts';
import { buildGrammarPack } from './grammar-pack.ts';
import { buildLookup, isCommon, type JmDict, type JmWord, type Lookup } from './jmdict.ts';
import type { KanjiDic, KradFile } from './kanji.ts';
import { buildLanguagePack } from './languages.ts';
import { reportPack, writeFixture, writeFull } from './output.ts';
import { preferReadings } from './readings.ts';
import { SOURCES } from './sources.ts';
import { checkThemes } from './themes/check.ts';
import { formatViolation } from './themes/rules.ts';
import { buildTokenizer } from './tokenizer.ts';
import { unitLearners, unitReach } from './unit-reach.ts';
import { buildUnits, unitCompounds, unitKanjiWordIds, unitWordLevels } from './units.ts';

const ROOT = resolve(import.meta.dir, '..', '..');
const PACKS = join(ROOT, 'public', 'packs');

/**
 * Coverage targets (U3, D56); `max` keeps all packs under 9 MB gzipped.
 * The quotas give beginners plenty of sentences at their level before N3 takes the rest.
 */
const COVERAGE = {
  focusPerWord: 3,
  perGrammar: 10,
  perWord: 30,
  max: 48_000,
  perPinned: 3,
  quota: [
    [5, 10_000],
    [4, 13_000],
    [3, 24_000],
  ] as const,
};

const options: FetchOptions = {
  rawDir: join(ROOT, 'data', 'raw'),
  refreshMoving: process.argv.includes('--refresh-tatoeba'),
};
const path: SourcePath = (source) => ensureSource(source, options);

function step(label: string): () => void {
  const start = performance.now();
  console.log(`· ${label}`);
  return () => console.log(`  done in ${((performance.now() - start) / 1000).toFixed(1)} s`);
}

async function loadDictionaries() {
  const done = step('JMdict, JLPT lists, KANJIDIC2, KRADFILE');
  const jmdict = readTgzJson<JmDict>(await path(SOURCES.jmdict));
  const jlpt = await loadJlpt(path, jmdict.words);
  const dic = readTgzJson<KanjiDic>(await path(SOURCES.kanjidic));
  const krad = readTgzJson<KradFile>(await path(SOURCES.kradfile)).kanji;
  const kanji = kanjiTable(dic, jmdict.words, jlpt);
  done();
  return { jmdict, jlpt, dic, krad, kanji };
}

type Dictionaries = Awaited<ReturnType<typeof loadDictionaries>>;

/** Preferred readings over all of JMdict (D56), counting the readings it changes. */
function preferIn(words: readonly JmWord[]) {
  const byId = new Map(words.map((w) => [w.id, w]));
  let changed = 0;
  const prefer = (tokens: Token[]) => {
    const out = preferReadings(tokens, byId);
    changed += out.changed;
    return out.tokens;
  };
  return Object.assign(prefer, { changed: () => changed });
}

/** Each unit word's reachable candidates, for its simulated learner (D56). */
function reachOf(d: Dictionaries, lookup: Lookup, candidates: Sentence[]) {
  const untagged = untaggedLevels(d.jmdict.words, d.jlpt, d.kanji);
  const units = UNITS.map((u) => ({ ...u, wordIds: unitKanjiWordIds(u, lookup) }));
  const ids = new Set([
    ...candidates.flatMap((s) => s.wordIds),
    ...units.flatMap((u) => u.wordIds),
  ]);
  const wordJlpt = new Map(
    [...ids].map((id) => [id, d.jlpt.get(id) ?? untagged.get(id) ?? 1] as const),
  );
  const reach = unitReach(unitLearners(units, wordJlpt), candidates, wordJlpt);
  const none = [...reach].filter(([, list]) => list.length === 0).map(([key]) => key);
  console.log(`  ${reach.size} unit words to reach, ${none.length} only through their passage`);
  return reach;
}

async function selectSentences(d: Dictionaries) {
  let done = step('Tatoeba: pair, filter, tokenize, grammar, level');
  const lookup = buildLookup(d.jmdict.words);
  const tokenize = await buildTokenizer(ROOT);
  const untagged = untaggedLevels(d.jmdict.words, d.jlpt, d.kanji);
  const levels = levelContext(d.jlpt, d.kanji, untagged, unitWordLevels(UNITS, lookup));
  const compounds = unitCompounds(UNITS, { lookup, tokenize });
  const prefer = preferIn(d.jmdict.words);
  const kanaWords = kanaWordIds(d.jmdict.words);
  // In place: the 189,000 token lists are the pipeline's largest data.
  const resolved = await loadResolved({ path, lookup, tokenize });
  for (const r of resolved) {
    r.tokens = prefer(joinKanaWords(joinCompounds(r.tokens, compounds), kanaWords));
  }
  console.log(`  ${prefer.changed()} token readings set to the preferred reading`);
  const candidates = levelled(resolved, levels);
  resolved.length = 0;
  console.log(`  candidates by level ${JSON.stringify(countByLevel(candidates))}`);
  done();
  done = step('Select with coverage');
  const core = new Set(
    d.jmdict.words.filter((w) => isCommon(w) || d.jlpt.has(w.id)).map((w) => w.id),
  );
  const reach = reachOf(d, lookup, candidates);
  const coverage = { ...COVERAGE, core, wordLevel: levels.wordLevel, pinned: reach };
  const kept = selectWithCoverage(candidates, coverage);
  console.log(`  kept ${kept.length} by level ${JSON.stringify(countByLevel(kept))}`);
  console.log(`  ${coverageReport(kept, candidates, coverage)}`);
  const units = buildUnits(UNITS, kept, { lookup, tokenize, levels, reach, compounds, prefer });
  for (const g of units.unknownGrammar) console.log(`  unit grammar not in the catalogue: ${g}`);
  done();
  return { candidates, kept, units };
}

async function assemble(d: Dictionaries, s: Awaited<ReturnType<typeof selectSentences>>) {
  const done = step('Prune, grammar, clusters, languages');
  const sentences = [...s.kept, ...s.units.sentences];
  const words = pruneWords(d.jmdict.words, {
    jlpt: d.jlpt,
    sentences,
    ids: s.units.units.flatMap((u) => u.wordIds),
    writings: [...FIXTURE_TARGETS, ...EXTRA_WORDS],
  });
  const kanji = pruneKanji(d.dic, d.krad, d.kanji, words);
  const base = { words, sentences: s.kept };
  const pack: Pack = {
    words,
    kanji,
    sentences,
    grammar: buildGrammarPack(s.kept),
    clusters: buildClusters(words, s.kept),
    units: s.units.units,
    languages: [
      await buildLanguagePack('fr', path, base),
      await buildLanguagePack('es', path, base),
    ],
  };
  done();
  return pack;
}

async function themeCheck(): Promise<void> {
  const done = step('Theme check against the new packs');
  const violations = await checkThemes(UNITS, join(PACKS, 'manifest.json'), ROOT);
  for (const v of violations) console.log(`  ${formatViolation(v)}`);
  done();
  if (violations.length > 0) throw new Error(`${violations.length} theme violations`);
}

async function main(): Promise<void> {
  const dictionaries = await loadDictionaries();
  const selected = await selectSentences(dictionaries);
  const pack = await assemble(dictionaries, selected);
  const done = step('Emit');
  reportPack('full', pack);
  writeFull(PACKS, pack);
  writeFixture(PACKS, buildFixture(pack, selected.candidates));
  done();
  await themeCheck();
}

await main();
