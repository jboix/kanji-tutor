/**
 * Everything the intro card (L1), the teaching card under a skip and the hint sheet (L2) show for
 * one target, from the dictionary and the learner's items. No AI.
 */

import { toHiragana } from 'wanakana';
import { alignReading, type RubyPart, rubyParts } from '../../domain/knowledge.ts';
import { glossesIn } from '../../domain/localized.ts';
import { PART_MEANINGS, plainMeaning, plainMeanings } from '../../domain/radicals.ts';
import type { Repos } from '../../domain/repos.ts';
import { learnerLevelOf, readingLabel } from '../../domain/services/index.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import type { Item, Kanji, LearnerLevel, Word } from '../../domain/types.ts';
import type { Translate } from '../../ui/i18n/types.ts';
import { type KanjiParts, type Part, wordHooks } from './parts-hook.ts';
import { partOfSpeech } from './pos.ts';

export interface KanjiCard {
  char: string;
  meanings: string[];
  parts: Part[];
  /** The KANJIDIC reading this word uses, when the word's reading aligns (R11): ガク, ま・つ. */
  usedReading?: string;
  /** KANJIDIC readings other than the one this word uses (on in katakana, kun with ・). */
  otherReadings: string[];
}

export interface WordTeaching {
  wordId: string;
  /** Dictionary form as written, e.g. 待つ for 待って. */
  surface: string;
  /**
   * The reading taught: the one the word has in this sentence when it is one of the dictionary's
   * (R15), else the dictionary's first. Never rendered by the hint sheet.
   */
  reading?: string;
  /** The dictionary's usual reading, when this sentence reads the word another way (にち, ひ). */
  usual?: string;
  /** The surface with its reading over each kanji where it aligns (R11). Hidden like `reading`. */
  ruby?: RubyPart[];
  meanings: string[];
  /** True when the meanings are the English ones, standing in for the learner's language (N9). */
  meaningsInEnglish: boolean;
  pos?: string;
  kanji: KanjiCard[];
  /** "Why it's here" lines. */
  why: string[];
  /** Hooks built from the parts (no AI, no readings). */
  hooks: string[];
}

const HAN = /\p{Script=Han}/u;

function kanjiChars(form: string): string[] {
  return [...new Set([...form].filter((c) => HAN.test(c) && c !== '々'))];
}

async function partsOf(repos: Repos, kanji: readonly Kanji[]): Promise<Map<string, Part>> {
  const chars = [...new Set(kanji.flatMap((k) => k.components))];
  const found = await repos.dictionary.kanjiMany(chars);
  const parts = new Map<string, Part>();
  chars.forEach((char, i) => {
    const meaning = PART_MEANINGS[char] ?? plainMeaning(found[i]?.meanings[0]);
    parts.set(char, { char, meaning });
  });
  return parts;
}

/** The kanji reading each kanji carries in this word read so, e.g. 待 → "ま.つ". */
function usedReadings(
  word: Word,
  reading: string | undefined,
  kanji: ReadonlyMap<string, Kanji>,
): Map<string, string> {
  const form = word.forms[0];
  if (!form || !reading) return new Map();
  const segments = alignReading(form, reading, kanji);
  return new Map(
    segments.flatMap((s) => (s.kanji && s.kanjiReading ? [[s.kanji, s.kanjiReading]] : [])),
  );
}

function toCard(kanji: Kanji, parts: Map<string, Part>, used: string | undefined): KanjiCard {
  return {
    char: kanji.char,
    meanings: plainMeanings(kanji.meanings),
    parts: kanji.components.map((c) => parts.get(c) ?? { char: c }),
    ...(used ? { usedReading: readingLabel(used) } : {}),
    otherReadings: [...kanji.on, ...kanji.kun]
      .filter((r) => r !== used)
      .slice(0, 4)
      .map(readingLabel),
  };
}

/** "Why it's here" (L1): the JLPT level against the learner's, the lesson, the sentence. */
export function whyHere(
  t: Translate,
  word: Pick<Word, 'jlpt'> | undefined,
  item: Item | undefined,
  card: Pick<SessionCard, 'reason' | 'targets'>,
  level: LearnerLevel,
): string[] {
  const why: string[] = [];
  const jlpt = word?.jlpt;
  if (jlpt === level) why.push(t('teach.whyAtLevel', { jlpt }));
  else if (jlpt !== undefined && jlpt > level) why.push(t('teach.whyBelow', { jlpt }));
  else if (jlpt !== undefined) why.push(t('teach.whyAbove', { jlpt, level }));
  else why.push(t('teach.whyUntagged', { level }));
  if (item?.source.lesson) why.push(t('teach.whyLesson', { lesson: item.source.lesson }));
  if (card.reason === 'focus') why.push(t('teach.whyFocus'));
  else if (card.targets.length === 1) why.push(t('teach.whyRest'));
  return why;
}

/** The learner's language and its messages, for the text built here. */
export interface TeachingText {
  t: Translate;
  language: string;
}

/**
 * The reading the word has in this sentence (R15): the target token's, when the token is written
 * as the dictionary form and the dictionary lists that reading. An inflected token (待っ) keeps
 * the dictionary's, which differs only in its ending.
 */
export function readingHere(
  card: Partial<Pick<SessionCard, 'sentence'>>,
  target: Pick<Target, 'tokenIndex'>,
  word: Pick<Word, 'forms' | 'readings'> | undefined,
): string | undefined {
  const token = card.sentence?.tokens[target.tokenIndex];
  const reading = token && toHiragana(token.reading);
  const fits = token?.surface === word?.forms[0] && reading && word?.readings.includes(reading);
  return fits ? reading : word?.readings[0];
}

/** Each kanji of the surface with its parts and the reading this word uses (R11). */
async function kanjiCards(
  repos: Repos,
  word: Word | undefined,
  reading: string | undefined,
  surface: string,
) {
  const kanji = (await repos.dictionary.kanjiMany(kanjiChars(surface))).flatMap((k) => k ?? []);
  const parts = await partsOf(repos, kanji);
  const byChar = new Map(kanji.map((k) => [k.char, k]));
  const used = word ? usedReadings(word, reading, byChar) : new Map<string, string>();
  return { cards: kanji.map((k) => toCard(k, parts, used.get(k.char))), byChar };
}

/** The reading taught and its furigana, with the usual reading when it differs (R11, R15). */
function readingFields(
  surface: string,
  reading: string | undefined,
  usual: string | undefined,
  kanji: ReadonlyMap<string, Kanji>,
): Pick<WordTeaching, 'reading' | 'ruby' | 'usual'> {
  if (!reading) return {};
  const ruby = rubyParts(surface, reading, kanji);
  return usual && usual !== reading ? { reading, ruby, usual } : { reading, ruby };
}

/** Loads the teaching content for one target. */
export async function loadWordTeaching(
  repos: Repos,
  card: Pick<SessionCard, 'reason' | 'targets'> & Partial<Pick<SessionCard, 'sentence'>>,
  target: Target,
  { t, language }: TeachingText,
): Promise<WordTeaching> {
  const [word, item, settings] = await Promise.all([
    repos.dictionary.word(target.wordId),
    repos.items.get(target.itemId),
    repos.settings.get(),
  ]);
  const surface = word?.forms[0] ?? target.surface;
  const reading = readingHere(card, target, word);
  const { cards, byChar } = await kanjiCards(repos, word, reading, surface);
  const glosses = word ? glossesIn(word, language) : { value: [], fallback: false };
  const meanings = glosses.value.slice(0, 3);
  const forHooks: KanjiParts[] = cards.map((c) => ({ ...c, meaning: c.meanings[0] }));
  const pos = partOfSpeech(t, word?.pos);
  return {
    wordId: target.wordId,
    surface,
    ...readingFields(surface, reading, word?.readings[0], byChar),
    meanings,
    meaningsInEnglish: glosses.fallback,
    ...(pos ? { pos } : {}),
    kanji: cards,
    why: whyHere(t, word, item, card, learnerLevelOf(settings)),
    hooks: wordHooks(t, surface, meanings[0], forHooks),
  };
}
