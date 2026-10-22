/**
 * 漢字読み (J1): the sentence with a kanji word underlined, and four readings. The wrong ones
 * are near-misses (long vowel, っ, voicing) and other dictionary readings of the same kanji.
 */
import { alignReading, type ReadingSegment } from '../align.ts';
import { seededOrder } from '../drills/seed.ts';
import { itemId } from '../ids.ts';
import { hasKanji, toKanaFold } from '../kana.ts';
import { spanVariants, stemReading } from '../services/reading-check.ts';
import type { Kanji, Sentence, Word } from '../types.ts';
import { longVowelSlips, morae, type NearMiss, plausible, voicingSlips } from './near-miss.ts';
import { arrange, firstGloss, roundRobin } from './options.ts';
import {
  kanaTail,
  kanjiStem,
  questionId,
  stemOf,
  tokenRange,
  underlineReading,
  underlineSpan,
} from './stem.ts';
import { type ChoiceQuestion, note, type QuestionOption, SECTION } from './types.ts';

export interface KanjiReadingInput {
  sentence: Sentence;
  /** The kanji token to underline (with its attached endings, 待って). */
  tokenIndex: number;
  /** The token's dictionary entry. */
  word: Word;
  /** Other entries written the same way (間: あいだ and ま): none of their readings is offered. */
  homographs: readonly Word[];
  /** KANJIDIC entries of the token's kanji. */
  kanji: ReadonlyMap<string, Kanji>;
  seed: string;
}

/** Every reading the span could rightly have, from the word and its homographs. */
function validReadings(input: KanjiReadingInput, token: Sentence['tokens'][number], full: string) {
  const tail = full.slice(stemReading(token.surface, token.reading).length);
  const stem = kanjiStem(token.surface);
  // A valid variant (日本人 にっぽんじん) is never offered as a wrong reading, with the
  // endings the underline carries.
  const ending = full.slice(toKanaFold(token.reading).length);
  const variants = (token.variants ?? []).map((v) => toKanaFold(v) + ending);
  const valid = new Set([full, ...variants, ...spanVariants(input.sentence, input.tokenIndex)]);
  for (const entry of [input.word, ...input.homographs]) {
    for (const reading of entry.readings) {
      valid.add(toKanaFold(reading));
      for (const form of entry.forms.filter((f) => kanjiStem(f) === stem)) {
        valid.add(stemReading(form, reading) + tail);
      }
    }
  }
  return valid;
}

/** Spellings of a kanji's readings as they would sit in a word: on in hiragana, kun stems. */
function kanjiSpellings(entry: Kanji, which: 'on' | 'kun' | 'any') {
  // KANJIDIC lists the usual readings first: たてまつ of 上 is no reading a learner would guess.
  const on = entry.on.slice(0, COMMON_ON).map((r) => ({ kana: toKanaFold(r), label: r }));
  const kun = entry.kun
    .slice(0, COMMON_KUN)
    .filter((r) => !/^-|-$/u.test(r))
    .map((r) => ({ kana: toKanaFold(r.split('.')[0] ?? ''), label: r }));
  const picked = which === 'on' ? on : which === 'kun' ? kun : [...on, ...kun];
  return picked.filter((s) => s.kana !== '');
}

/** Readings of a kanji offered as "another reading": its first on and kun readings. */
const COMMON_ON = 2;
const COMMON_KUN = 3;

/** Okurigana a kun reading takes: い.く → く; none for an on reading. A word without okurigana takes readings without it (道 is never いう, from い.う). */
const okuriganaOf = (label: string) => label.split('.')[1] ?? '';

/**
 * The span read with one kanji given another of its dictionary readings (学生 → まなせい). A
 * kanji written with okurigana (行く, 新しい) only takes kun readings with the same okurigana:
 * an on reading before okurigana (ぎょうく) is no reading a learner would write.
 */
function otherReadings(
  segments: readonly ReadingSegment[],
  tail: string,
  input: KanjiReadingInput,
  okurigana: string,
) {
  const compound = segments.filter((s) => s.kanji).length > 1;
  return segments.flatMap((segment, i): NearMiss[] => {
    const entry = segment.kanji ? input.kanji.get(segment.kanji) : undefined;
    if (!entry || !hasKanji(segment.text)) return [];
    const join = (kana: string) =>
      segments.map((s, j) => (j === i ? kana : s.reading)).join('') + tail;
    return spellingsFor(entry, segment, compound, okurigana).map((s) => {
      const kana = join(s.kana);
      const params = { kana, kanji: segment.text, reading: s.label, here: segment.reading };
      return { kana, slip: 'other' as const, note: note('other-reading', params) };
    });
  });
}

/**
 * Other readings a learner could give the segment's kanji. In a compound an on reading is
 * swapped for an on reading (じんしょう, not じんうまれ). A one-kana stem (あ of あ.たる) never
 * stands for a longer reading.
 */
function spellingsFor(entry: Kanji, segment: ReadingSegment, compound: boolean, okurigana: string) {
  const which = compound ? (isOn(segment) ? 'on' : 'kun') : 'any';
  // Before okurigana a stem keeps its length (きた of 来たる is no reading of 出来ました); a
  // reading much longer than the word's (てんまど for 窓) is no slip either.
  const length = (s: { kana: string }) =>
    okurigana === ''
      ? s.kana.length <= segment.reading.length + 1
      : s.kana.length === segment.reading.length;
  const fits = (s: { kana: string; label: string }) =>
    s.kana !== segment.reading &&
    (s.kana.length > 1 || segment.reading.length === 1) &&
    length(s) &&
    okuriganaOf(s.label) === okurigana;
  return kanjiSpellings(entry, which).filter(fits);
}

/** An on reading (katakana in KANJIDIC), where long vowels and っ are real slips. */
const isOn = (segment: ReadingSegment) => /^[ァ-ヶ]/u.test(segment.kanjiReading ?? '');

/** The slip's note and kana with the rest of the span around it. */
function placed(miss: NearMiss, kana: string): NearMiss {
  return { ...miss, kana, note: { ...miss.note, params: { ...miss.note.params, kana } } };
}

const oneMora = (segment: ReadingSegment) => morae(segment.reading).length === 1;

/**
 * Slips inside one kanji's reading, never in okurigana or endings (はなざない): long vowels
 * dropped anywhere but added only to an on reading of one mora (しょ → しょう; ふく → ふくう and
 * すこし → すうこし are no slips), voicing changed in a reading of two morae or more, or in a
 * later kanji (rendaku).
 */
function segmentSlips(segments: readonly ReadingSegment[], tail: string): NearMiss[][] {
  const around = (i: number, kana: string) =>
    segments.map((s, j) => (j === i ? kana : s.reading)).join('') + tail;
  const per = (make: (segment: ReadingSegment, i: number) => NearMiss[]) =>
    segments.flatMap((segment, i) =>
      segment.kanji ? make(segment, i).map((m) => placed(m, around(i, m.kana))) : [],
    );
  const long = per((segment) =>
    longVowelSlips(segment.reading).filter(
      (m) => m.note.code === 'long-vowel-dropped' || (isOn(segment) && oneMora(segment)),
    ),
  );
  const voicing = per((segment, i) =>
    i > 0 || isOn(segment) || morae(segment.reading).length > 1
      ? voicingSlips(segment.reading)
      : [],
  );
  return [long, compoundSokuon(segments, tail), voicing];
}

const GEMINATING = new Set([...'くつちき']);
const GEMINABLE = /^[かきくけこさしすせそたちつてとぱぴぷぺぽ]/u;

/** At one boundary of an on compound: く/つ/ち/き turned into っ (がくせい → がっせい), or っ dropped (がっこう → がこう). */
function boundarySlip(prev: string, next: string): string | undefined {
  if (prev.endsWith('っ')) return prev.slice(0, -1) + next;
  if (GEMINATING.has(prev.slice(-1)) && GEMINABLE.test(next) && prev.length > 1)
    return `${prev.slice(0, -1)}っ${next}`;
  return undefined;
}

/** っ slips at the boundaries of a compound of on readings, never inside one (しっつもん). */
function compoundSokuon(segments: readonly ReadingSegment[], tail: string): NearMiss[] {
  const kanji = segments.filter((s) => s.kanji);
  if (kanji.length < 2 || kanji.length !== segments.length || !kanji.every(isOn)) return [];
  return kanji.slice(1).flatMap((segment, i): NearMiss[] => {
    const prev = kanji[i]?.reading ?? '';
    const joined = boundarySlip(prev, segment.reading);
    if (joined === undefined) return [];
    const kana =
      kanji.map((s, j) => (j === i ? joined : j === i + 1 ? '' : s.reading)).join('') + tail;
    const code = prev.endsWith('っ') ? 'sokuon-dropped' : 'sokuon-turned';
    const params = code === 'sokuon-dropped' ? { kana } : { kana, mora: prev.slice(-1) };
    return [{ kana, slip: 'sokuon', note: note(code, params) }];
  });
}

function candidates(input: KanjiReadingInput, full: string): NearMiss[][] {
  const token = input.sentence.tokens[input.tokenIndex];
  if (!token) return [];
  const own = toKanaFold(token.reading);
  const segments = alignReading(token.surface, own, input.kanji);
  const tail = full.slice(own.length);
  const okurigana = kanaTail(token.base);
  const others = otherReadings(segments, tail, input, okurigana);
  const lists = [others, ...segmentSlips(segments, tail)];
  return lists.map((list) => seededOrder(list, (n) => n.kana, input.seed));
}

function rightOption(surface: string, full: string, word: Word): QuestionOption {
  const gloss = firstGloss(word.glosses);
  return { text: full, note: note('read-as', { surface, reading: full, gloss }) };
}

/**
 * A 漢字読み question on the token, or undefined when the token has no kanji, or fewer than
 * three wrong readings survive: a wrong option is never a valid reading of the word or of any
 * word written the same way, and never repeats another option.
 */
export function kanjiReadingQuestion(input: KanjiReadingInput): ChoiceQuestion | undefined {
  const { sentence, tokenIndex } = input;
  const token = sentence.tokens[tokenIndex];
  const span = underlineSpan(sentence, tokenIndex);
  const full = underlineReading(sentence, tokenIndex);
  const range = tokenRange(sentence.tokens, tokenIndex, span.at(-1) ?? tokenIndex);
  if (!(token && full && range && hasKanji(token.surface))) return undefined;
  const valid = validReadings(input, token, full);
  const surface = sentence.text.slice(range.from, range.to);
  const wrong = roundRobin(candidates(input, full))
    .filter((n) => plausible(n.kana) && !valid.has(n.kana))
    .map((n): QuestionOption => ({ text: n.kana, note: n.note, slip: n.slip }));
  const arranged = arrange(rightOption(surface, full, input.word), wrong, input.seed);
  if (!arranged) return undefined;
  return {
    id: questionId('kanji-reading', sentence.id, tokenIndex),
    kind: 'kanji-reading',
    section: SECTION['kanji-reading'],
    stem: stemOf(sentence, range.from, range.to, 'underline'),
    ...arranged,
    itemId: itemId('word', input.word.id),
    sentenceId: sentence.id,
    ...(sentence.translation ? { translation: sentence.translation } : {}),
  };
}
