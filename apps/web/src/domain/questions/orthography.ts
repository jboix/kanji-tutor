/**
 * 表記 (J2): the sentence with a word written in kana and underlined, and four spellings. The
 * wrong ones swap a kanji for a lookalike (待 → 持) or are homophones (会う for 合う).
 */
import { seededOrder } from '../drills/seed.ts';
import { itemId } from '../ids.ts';
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Kanji, Sentence, Word } from '../types.ts';
import { arrange, firstGloss, roundRobin, sameMeaning } from './options.ts';
import {
  kanaTail,
  kanjiStem,
  questionId,
  tokenRange,
  underlineReading,
  underlineSpan,
} from './stem.ts';
import {
  type ChoiceQuestion,
  type CodedNote,
  note,
  type QuestionOption,
  SECTION,
} from './types.ts';

export interface OrthographyInput {
  sentence: Sentence;
  tokenIndex: number;
  word: Word;
  /** KANJIDIC entries of the token's kanji. */
  kanji: ReadonlyMap<string, Kanji>;
  /** Kanji that look like each kanji of the token (share a part), most alike first. */
  lookalikes: ReadonlyMap<string, readonly Kanji[]>;
  /** Dictionary words read like the word (homophones). */
  homophones: readonly Word[];
  /** Dictionary words by written form, for the swapped spellings (持つ for 待つ). */
  byForm: ReadonlyMap<string, readonly Word[]>;
  seed: string;
}

const meaning = (entry: Kanji | undefined) => entry?.meanings[0] ?? '';

/** The dictionary form of the word the token is written with (待つ for 待っ). */
export function baseForm(word: Word, surface: string): string | undefined {
  const stem = kanjiStem(surface);
  return word.forms.find((form) => kanjiStem(form) === stem);
}

/** "持って: 持 means "hold"; 待 ("wait") has 彳, not 扌." */
function swapNote(right: Kanji | undefined, wrong: Kanji, text: string): CodedNote {
  const mine = right?.components.find((c) => !wrong.components.includes(c));
  const theirs = wrong.components.find((c) => !right?.components.includes(c));
  const params = {
    text,
    wrong: wrong.char,
    wrongMeaning: meaning(wrong),
    right: right?.char ?? '',
    rightMeaning: meaning(right),
  };
  if (mine && theirs) return note('swap-parts', { ...params, mine, theirs });
  return note('swap-needs', params);
}

/** True when a spelling is a real word with the same reading: it might fit, so never offer it. */
function homophoneSpelling(form: string, reading: string, input: OrthographyInput): boolean {
  return (input.byForm.get(form) ?? []).some((w) => w.readings.map(toKanaFold).includes(reading));
}

const ROWS = [
  'あいうえお',
  'かきくけこ',
  'がぎぐげご',
  'さしすせそ',
  'ざじずぜぞ',
  'たちつてとっ',
  'だぢづでど',
  'なにぬねの',
  'はひふへほ',
  'ばびぶべぼ',
  'まみむめも',
  'やゆよ',
  'らりるれろ',
  'わ',
];
const rowOf = (kana: string) => ROWS.findIndex((row) => row.includes(kana));

/**
 * Whether a lookalike can stand where the kanji is followed by okurigana: it must be a verb or
 * adjective kanji itself, with okurigana of the same row (親しい for 新しい, 繰る for 来る). 八
 * for 分 in 分かりません is no spelling anyone would write.
 */
function takesOkurigana(alike: Kanji, next: string): boolean {
  if (next === '' || hasKanji(next)) return true;
  return alike.kun.some((r) => {
    const okurigana = r.split('.')[1];
    return okurigana !== undefined && rowOf(okurigana.charAt(0)) === rowOf(next);
  });
}

/** The kana right after the kanji in the written form ("" for none or another kanji). */
const after = (base: string, char: string) => base.charAt(base.indexOf(char) + 1);

/** The span with one kanji swapped for a lookalike. */
function lookalikeOptions(input: OrthographyInput, text: string, base: string, reading: string) {
  const chars = [...new Set([...kanjiStem(text)].filter(hasKanji))];
  return chars.flatMap((char) =>
    (input.lookalikes.get(char) ?? [])
      .filter((alike) => takesOkurigana(alike, after(base, char)))
      .filter((alike) => !homophoneSpelling(base.replace(char, alike.char), reading, input))
      .map((alike): QuestionOption => {
        const swapped = text.replace(char, alike.char);
        const note = swapNote(input.kanji.get(char), alike, swapped);
        return { text: swapped, note, swap: [char, alike.char] };
      }),
  );
}

/** Homophones with a different meaning and the same okurigana, spelled like the span. */
function homophoneOptions(input: OrthographyInput, text: string, base: string) {
  const tail = text.slice(kanjiStem(text).length);
  return input.homophones.flatMap((other): QuestionOption[] => {
    const form = other.forms.find((f) => hasKanji(f) && kanaTail(f) === kanaTail(base));
    if (other.id === input.word.id || !form || input.word.forms.includes(form)) return [];
    if (sameMeaning(other.glosses, input.word.glosses)) return [];
    const spelled = kanjiStem(form) + tail;
    const gloss = firstGloss(other.glosses);
    return [{ text: spelled, note: note('another-word', { text: spelled, gloss }) }];
  });
}

interface Span {
  text: string;
  reading: string;
  from: number;
  to: number;
}

function spanOf(input: OrthographyInput): Span | undefined {
  const { sentence, tokenIndex } = input;
  const last = underlineSpan(sentence, tokenIndex).at(-1) ?? tokenIndex;
  const range = tokenRange(sentence.tokens, tokenIndex, last);
  const reading = underlineReading(sentence, tokenIndex);
  if (!(range && reading)) return undefined;
  return { text: sentence.text.slice(range.from, range.to), reading, ...range };
}

function wrongOptions(input: OrthographyInput, span: Span, base: string) {
  const valid = new Set(
    input.word.forms.map((f) => kanjiStem(f) + span.text.slice(kanjiStem(span.text).length)),
  );
  const lists = [
    lookalikeOptions(input, span.text, base, toKanaFold(input.word.readings[0] ?? '')),
    homophoneOptions(input, span.text, base),
  ].map((list) => seededOrder(list, (o) => o.text, input.seed));
  return roundRobin(lists).filter((o) => !valid.has(o.text));
}

/** 本 in この本とあの本: the rest of the sentence already shows the spelling. */
function shownElsewhere(sentence: Sentence, span: Span): boolean {
  const rest = sentence.text.slice(0, span.from) + sentence.text.slice(span.to);
  return rest.includes(kanjiStem(span.text));
}

/**
 * A 表記 question on the token, or undefined when it has no kanji or fewer than three wrong
 * spellings remain. A wrong spelling is never one of the word's own forms, nor a real word
 * with the same reading made by a lookalike swap; homophones must differ in meaning.
 */
export function orthographyQuestion(input: OrthographyInput): ChoiceQuestion | undefined {
  const token = input.sentence.tokens[input.tokenIndex];
  const span = spanOf(input);
  const base = token && baseForm(input.word, token.surface);
  if (!(token && span && base && hasKanji(token.surface))) return undefined;
  if (shownElsewhere(input.sentence, span)) return undefined;
  const { text } = input.sentence;
  const gloss = firstGloss(input.word.glosses);
  const right: QuestionOption = {
    text: span.text,
    note: note('spelling', { text: span.text, gloss }),
  };
  const arranged = arrange(right, wrongOptions(input, span, base), input.seed);
  if (!arranged) return undefined;
  return {
    id: questionId('orthography', input.sentence.id, input.tokenIndex),
    kind: 'orthography',
    section: SECTION.orthography,
    stem: {
      before: text.slice(0, span.from),
      target: span.reading,
      after: text.slice(span.to),
      mark: 'underline',
    },
    ...arranged,
    itemId: itemId('word', input.word.id),
    sentenceId: input.sentence.id,
    ...(input.sentence.translation ? { translation: input.sentence.translation } : {}),
  };
}
