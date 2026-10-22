/**
 * The tutor's view of the learner (A10, D35): level, coverage per JLPT level, recent mistakes, and
 * lookups of what the learner knows. Implements the `LearnerView` port over `Repos`; the app layer
 * builds one and hands it to the AI context.
 */
import { explanationLanguageOf } from '../defaults.ts';
import { parseItemId } from '../ids.ts';
import { hasKanji } from '../kana.ts';
import type {
  DictionaryHit,
  KnownCheck,
  KnownExample,
  KnownQuery,
  KnownState,
  LearnerCoverage,
  LearnerOverview,
  LearnerView,
  LevelCoverage,
  RecentMistake,
} from '../learner-view.ts';
import type { Repos } from '../repos.ts';
import type {
  GrammarPoint,
  KnowledgeLevel,
  LearnerLevel,
  Review,
  Sentence,
  Word,
} from '../types.ts';
import { type LearnedGroup, learnedGrammar, learnedKanji, learnedWords } from './learned.ts';

const MISTAKES = 20;
const MISTAKE_WINDOW_MS = 30 * 86_400_000;
const EXAMPLES = 5;
/** Items per kind a single `checkKnown` call answers; the rest are ignored. */
const MAX_CHECKS = 30;
/** Share of a level's words known before the estimate moves to the next level (D31). */
const MOVE_UP = 0.8;

/** Unseen (untracked or 0), learning (1–2) or known (3–4). */
export function knownState(level: KnowledgeLevel | undefined): KnownState {
  if (!level) return 'unseen';
  return level >= 3 ? 'known' : 'learning';
}

function coverageOf(groups: LearnedGroup[]): LevelCoverage[] {
  return groups.flatMap(({ level, known, total }) =>
    level === 'other' ? [] : [{ level, known, total }],
  );
}

/** Words, kanji and grammar known per level N5–N3 (P3 counts). */
export async function learnerCoverage(repos: Repos): Promise<LearnerCoverage> {
  const [words, kanji, grammar] = await Promise.all([
    learnedWords(repos),
    learnedKanji(repos),
    learnedGrammar(repos),
  ]);
  return { words: coverageOf(words), kanji: coverageOf(kanji), grammar: coverageOf(grammar) };
}

/** The first level whose words are under 80% known; N3 past that, N5 without lists. */
export function estimateLevel(words: readonly LevelCoverage[]): LearnerLevel {
  for (const { level, known, total } of words) {
    if (total === 0 || known / total < MOVE_UP) return level;
  }
  return 3;
}

async function targetOf(repos: Repos, review: Review): Promise<string> {
  const { kind, ref } = parseItemId(review.itemId);
  if (kind === 'kanjiReading') return ref.split(':')[0] ?? ref;
  if (kind !== 'word') return ref;
  const word = await repos.dictionary.word(ref);
  return word?.forms[0] ?? word?.readings[0] ?? ref;
}

async function toMistake(repos: Repos, review: Review): Promise<RecentMistake> {
  const mistake: RecentMistake = {
    at: review.at,
    target: await targetOf(repos, review),
    expected: review.expected,
    given: review.answer,
    verdict: review.verdict === 'near-miss' ? 'near-miss' : 'wrong',
  };
  if (review.errorType) mistake.errorType = review.errorType;
  return mistake;
}

/** The last wrong or near-miss answers of the past 30 days, newest first; skips are not mistakes. */
export async function recentMistakes(repos: Repos, now: number): Promise<RecentMistake[]> {
  const reviews = await repos.reviews.since(now - MISTAKE_WINDOW_MS);
  const missed = reviews
    .filter((review) => review.verdict !== 'correct' && !review.skipped)
    .sort((a, b) => b.at - a.at)
    .slice(0, MISTAKES);
  return Promise.all(missed.map((review) => toMistake(repos, review)));
}

async function overview(repos: Repos, now: number, withUnit: boolean): Promise<LearnerOverview> {
  const settings = await repos.settings.get();
  const coverage = await learnerCoverage(repos);
  const result: LearnerOverview = {
    level: settings.learnerLevel ?? estimateLevel(coverage.words),
    levelSource: settings.learnerLevel ? 'set' : 'estimated',
    explanationLanguage: explanationLanguageOf(settings),
    coverage,
    recentMistakes: await recentMistakes(repos, now),
  };
  if (settings.currentLesson) result.currentLesson = settings.currentLesson;
  if (!withUnit) return result;
  // The unit catalogue is large: loaded when the tutor asks, not with the app shell.
  const { currentUnit } = await import('./current-unit.ts');
  const unit = await currentUnit(repos);
  if (unit) result.currentUnit = unit;
  return result;
}

// ── Lookups ───────────────────────────────────────────────────────────────────

async function wordLevel(repos: Repos, words: readonly Word[]): Promise<KnowledgeLevel> {
  const items = await repos.items.getMany(words.map((word) => `word:${word.id}` as const));
  return Math.max(0, ...items.map((item) => item?.level ?? 0)) as KnowledgeLevel;
}

async function checkWord(repos: Repos, text: string): Promise<KnownCheck> {
  const words = await repos.dictionary.wordsByText(text);
  const check: KnownCheck = {
    kind: 'word',
    text,
    found: words.length > 0,
    state: knownState(await wordLevel(repos, words)),
  };
  const jlpt = words.find((word) => word.jlpt)?.jlpt;
  if (jlpt) check.jlpt = jlpt;
  return check;
}

async function checkKanji(repos: Repos, char: string): Promise<KnownCheck> {
  const [entry, readings] = await Promise.all([
    repos.dictionary.kanji(char),
    repos.kanjiReadings.byKanji(char),
  ]);
  const level = Math.max(0, ...readings.map((row) => row.level)) as KnowledgeLevel;
  const check: KnownCheck = { kind: 'kanji', text: char, found: !!entry, state: knownState(level) };
  if (entry?.jlpt) check.jlpt = entry.jlpt;
  return check;
}

const bare = (pattern: string) => pattern.replace(/[〜~～\s]/g, '');

/** The catalogue point named by an id or a pattern such as "〜わけではない". */
export function findGrammar(points: readonly GrammarPoint[], query: string) {
  const wanted = bare(query);
  return points.find((point) => point.id === query.trim() || bare(point.pattern) === wanted);
}

async function checkGrammar(repos: Repos, points: GrammarPoint[], text: string) {
  const point = findGrammar(points, text);
  const item = point ? await repos.items.get(`grammar:${point.id}`) : undefined;
  const check: KnownCheck = {
    kind: 'grammar',
    text,
    found: !!point,
    state: knownState(item?.level),
  };
  if (point?.level) check.jlpt = point.level;
  return check;
}

const firstOf = (list: readonly string[] | undefined) => (list ?? []).slice(0, MAX_CHECKS);

async function checkKnown(repos: Repos, query: KnownQuery): Promise<KnownCheck[]> {
  const grammar = firstOf(query.grammar);
  const points = grammar.length > 0 ? await repos.grammar.all() : [];
  return Promise.all([
    ...firstOf(query.words).map((text) => checkWord(repos, text)),
    ...firstOf(query.kanji).map((char) => checkKanji(repos, char)),
    ...grammar.map((text) => checkGrammar(repos, points, text)),
  ]);
}

/** The readings with the preferred one first and the less common variants flagged (R10). */
function readingsOfHit(
  word: Word,
): Pick<DictionaryHit, 'readings' | 'preferredReading' | 'lessCommon'> {
  const variants = new Set(word.variants ?? []);
  const usual = word.readings.filter((reading) => !variants.has(reading));
  const readings = [...usual, ...word.readings.filter((reading) => variants.has(reading))];
  const preferred = readings[0];
  return {
    readings,
    ...(preferred ? { preferredReading: preferred } : {}),
    ...(variants.size > 0 ? { lessCommon: [...variants] } : {}),
  };
}

async function toHit(repos: Repos, word: Word): Promise<DictionaryHit> {
  const hit: DictionaryHit = {
    forms: word.forms,
    ...readingsOfHit(word),
    meanings: word.glosses.slice(0, 3),
    common: word.common,
    state: knownState(await wordLevel(repos, [word])),
  };
  if (word.jlpt) hit.jlpt = word.jlpt;
  return hit;
}

async function lookupWord(repos: Repos, text: string): Promise<DictionaryHit[]> {
  const words = await repos.dictionary.wordsByText(text.trim());
  return Promise.all(words.slice(0, EXAMPLES).map((word) => toHit(repos, word)));
}

// ── Examples ──────────────────────────────────────────────────────────────────

async function knownWords(repos: Repos): Promise<Word[]> {
  const items = (await repos.items.byKind('word')).filter((item) => item.level >= 3);
  const words = await repos.dictionary.words(items.map((item) => item.ref));
  return words.flatMap((word) => (word ? [word] : []));
}

async function wordsWithKanji(repos: Repos, char: string): Promise<KnownExample[]> {
  const words = (await knownWords(repos)).filter((word) => word.forms[0]?.includes(char));
  return words.slice(0, EXAMPLES).map((word) => ({
    kind: 'word',
    text: word.forms[0] ?? '',
    reading: word.readings[0] ?? '',
    meaning: word.glosses[0] ?? '',
  }));
}

async function candidateSentences(repos: Repos, query: string): Promise<Sentence[]> {
  const point = findGrammar(await repos.grammar.all(), query);
  if (point) {
    const rows = await repos.sentences.getMany(point.exampleSentenceIds);
    return rows.flatMap((row) => (row ? [row] : []));
  }
  const words = (await repos.dictionary.wordsByText(query.trim())).slice(0, 2);
  const lists = await Promise.all(words.map((word) => repos.sentences.containingWord(word.id)));
  return lists.flat();
}

/** Verified sentences using the query, those with the fewest unknown words first. */
async function sentencesUsing(repos: Repos, query: string): Promise<KnownExample[]> {
  const known = new Set((await knownWords(repos)).map((word) => word.id));
  const unknown = (row: Sentence) => row.wordIds.filter((id) => !known.has(id)).length;
  const rows = (await candidateSentences(repos, query)).filter((row) => row.verified);
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  return unique
    .sort((a, b) => unknown(a) - unknown(b))
    .slice(0, EXAMPLES)
    .map((row) => ({ kind: 'sentence', text: row.text, meaning: row.translation ?? '' }));
}

function knownExamples(repos: Repos, query: string): Promise<KnownExample[]> {
  const text = query.trim();
  const single = [...text].length === 1 && hasKanji(text);
  return single ? wordsWithKanji(repos, text) : sentencesUsing(repos, text);
}

/** The `LearnerView` over the app's repositories (A10). */
export function createLearnerView(repos: Repos, now: () => number = Date.now): LearnerView {
  return {
    getLearnerProfile: (options) => overview(repos, now(), options?.withUnit === true),
    checkKnown: (query) => checkKnown(repos, query),
    lookupWord: (text) => lookupWord(repos, text),
    knownExamples: (query) => knownExamples(repos, query),
  };
}
