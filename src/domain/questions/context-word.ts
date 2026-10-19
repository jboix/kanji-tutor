/**
 * 文脈規定 (J3): a sentence with a word blanked, and four words of the same part of speech and
 * JLPT level. The blank covers the whole word: a verb or adjective with the ending it is written
 * with (食べました), and every option is conjugated the same way. Only the original fits: a
 * distractor seen anywhere with the same two tokens before or after the blank is dropped, so is
 * one that makes a sentence of the packs, and so is one that shares a meaning with the answer.
 */
import { seededOrder } from '../drills/seed.ts';
import { itemId } from '../ids.ts';
import { hasKanji } from '../kana.ts';
import { answerSpan } from '../services/reading-check.ts';
import type { Sentence, Token, Word } from '../types.ts';
import { type Realised, realiseAt } from './blank.ts';
import { type Conjugation, classOfPos, inflect } from './conjugate.ts';
import { arrange, firstGloss, meaningFields, sameMeaning } from './options.ts';
import { questionId, stemOf } from './stem.ts';
import { type ChoiceQuestion, note, type QuestionOption, SECTION } from './types.ts';

export interface ContextWordInput {
  sentence: Sentence;
  tokenIndex: number;
  word: Word;
  /** Words of the same JLPT level to choose distractors from (the JLPT index). */
  candidates: readonly Word[];
  /** Sentences that use the candidates, for the "does not fit" check. */
  corpus: readonly Sentence[];
  /** Whether a sentence exists in the packs: a distractor that makes one fits too. */
  known?: (text: string) => boolean;
  seed: string;
}

/** Tokens on either side of a blank compared by the fit check. */
const CONTEXT = 2;

/** How a word is written as an option: its first kanji form, else its first reading. */
export const display = (word: Word) => word.forms[0] ?? word.readings[0] ?? '';

/** The surfaces of tokens [from − 2, from) and (to, to + 2], joined. */
function around(tokens: readonly Token[], first: number, last: number): [string, string] {
  const surfaces = tokens.map((t) => t.surface);
  return [
    surfaces.slice(Math.max(0, first - CONTEXT), first).join('|'),
    surfaces.slice(last + 1, last + 1 + CONTEXT).join('|'),
  ];
}

/** The context of token `i` and the endings attached to it. */
const contextOf = (s: Sentence, i: number) => around(s.tokens, i, answerSpan(s, i).at(-1) ?? i);

/** True when the candidate appears somewhere with the same left or right context: it may fit. */
function fitsElsewhere(candidate: Word, context: [string, string], corpus: readonly Sentence[]) {
  return corpus.some((s) =>
    s.tokens.some((t, i) => {
      if (t.wordId !== candidate.id) return false;
      const [left, right] = contextOf(s, i);
      return left === context[0] || right === context[1];
    }),
  );
}

/** Content parts of speech a blank can hold: nouns, verbs, adjectives and adverbs. */
const BLANKABLE = /^(n|v|adj|adv)/u;

export const blankable = (pos: string | undefined) => pos !== undefined && BLANKABLE.test(pos);

const NUMBERS = /^[0-9０-９〇一二三四五六七八九十百千万]+$/u;
const has = (word: Word, tag: string) => word.pos?.includes(tag) === true;
/** Numbers, dates and counters: a blank of 二 in 二日 asks nothing about the sentence. */
const numeric = (word: Word) =>
  has(word, 'num') ||
  has(word, 'ctr') ||
  /^[0-9０-９〇零一二三四五六七八九十百千万]/u.test(display(word));

/** Uses needed before a word counts as usually written in kana (為 for ため, 居る for いる). */
const KANA_EVIDENCE = 3;

/** True when the corpus mostly writes the word in kana: its kanji form would look odd. */
function usuallyKana(c: Word, corpus: readonly Sentence[]): boolean {
  const uses = corpus.flatMap((s) => s.tokens.filter((t) => t.wordId === c.id));
  const kanji = uses.filter((t) => hasKanji(t.surface)).length;
  return uses.length >= KANA_EVIDENCE && kanji * 2 < uses.length;
}

const kindOf = (cls: Conjugation | undefined) =>
  cls === undefined ? 'word' : cls.startsWith('adj') ? 'adjective' : 'verb';

/**
 * Same part of speech as the answer: verbs with verbs of the same transitivity, adjectives
 * with adjectives, else the same first JMdict tag, adverbial nouns (今, 先週) with adverbial
 * nouns, and a noun before する with nouns that take する.
 */
export function sameKind(word: Word, c: Word, beforeSuru = false): boolean {
  const kind = kindOf(classOfPos(word.pos));
  if (kind !== kindOf(classOfPos(c.pos)) || numeric(c)) return false;
  if (beforeSuru && !has(c, 'vs')) return false;
  if (kind === 'verb') return has(word, 'vt') === has(c, 'vt') && has(word, 'vi') === has(c, 'vi');
  return c.pos?.[0] === word.pos?.[0] && has(word, 'adv') === has(c, 'adv');
}

/** The candidate written to fill the blank: conjugated like the answer, or as it is. */
function fillWith(c: Word, blank: Realised): string | undefined {
  const cls = classOfPos(c.pos);
  if (blank.inflection === undefined) return cls === undefined ? display(c) : undefined;
  return cls === undefined ? undefined : inflect(display(c), cls, blank.inflection)[0];
}

interface Blank extends Realised {
  first: number;
  last: number;
}

function wrongOptions(input: ContextWordInput, blank: Blank): QuestionOption[] {
  const { word, sentence } = input;
  const written = hasKanji(display(word));
  const context = around(sentence.tokens, blank.first, blank.last);
  const suru = sentence.tokens[blank.last + 1]?.base === 'する';
  const [before, after] = [sentence.text.slice(0, blank.from), sentence.text.slice(blank.to)];
  const ok = (c: Word, text: string | undefined): text is string =>
    text !== undefined &&
    c.id !== word.id &&
    sameKind(word, c, suru) &&
    hasKanji(display(c)) === written &&
    !word.forms.includes(display(c)) &&
    !sameMeaning(c.glosses, word.glosses) &&
    !input.known?.(before + text + after) &&
    !(written && usuallyKana(c, input.corpus)) &&
    !fitsElsewhere(c, context, input.corpus);
  return seededOrder(input.candidates, (c) => c.id, input.seed).flatMap((c) => {
    const text = fillWith(c, blank);
    if (!ok(c, text)) return [];
    const params = { word: display(c), gloss: firstGloss(c.glosses) };
    return [{ text, note: note('word-misfits', params) }];
  });
}

const NOUNISH = new Set(['noun', 'prefix', 'suffix']);

/** A token that is part of a compound (代わり of 代わりばんこ, お of お茶) or a counter (何本). */
function bound(tokens: readonly Token[], i: number): boolean {
  const prev = tokens[i - 1];
  const next = tokens[i + 1];
  const counter = prev !== undefined && (prev.base === '何' || NUMBERS.test(prev.surface));
  return counter || NOUNISH.has(prev?.pos ?? '') || NOUNISH.has(next?.pos ?? '');
}

/** The blank for the token: the word as written, with its ending for a verb or adjective. */
function blankOf(sentence: Sentence, i: number, word: Word): Blank | undefined {
  const token = sentence.tokens[i];
  if (!token) return undefined;
  const cls = classOfPos(word.pos);
  if (cls === undefined) {
    if (bound(sentence.tokens, i) || token.surface !== token.base) return undefined;
    const to = token.start + token.surface.length;
    return { from: token.start, to, text: token.surface, inflection: undefined, first: i, last: i };
  }
  if (!(word.forms.includes(token.base) || word.readings.includes(token.base))) return undefined;
  const realised = realiseAt(sentence, i, token.base, cls);
  if (!realised?.text.startsWith(token.surface)) return undefined;
  const last = sentence.tokens.findIndex((t) => t.start + t.surface.length === realised.to);
  return { ...realised, first: i, last };
}

/** Content words outside the blank needed for it to be a question: （白いです）か。 asks nothing. */
const MIN_CONTEXT = 2;
const CONTENT = new Set(['noun', 'pronoun', 'verb', 'adjective', 'adverb']);

/**
 * True when the blank is no question: the rest of the sentence writes the word too (歌 in
 * 歌を歌う), or leaves too little to choose by.
 */
function givenAway(sentence: Sentence, blank: Blank, word: Word): boolean {
  const rest = sentence.text.slice(0, blank.from) + sentence.text.slice(blank.to);
  const stem = display(word).replace(/[ぁ-ん]+$/u, '');
  const outside = sentence.tokens.filter(
    (t, i) => (i < blank.first || i > blank.last) && CONTENT.has(t.pos),
  );
  if (outside.length < MIN_CONTEXT) return true;
  return rest.includes(display(word)) || (stem !== '' && rest.includes(stem));
}

/** Whether the token can be asked at all: a content word, written as its entry, not a number. */
function askable(input: ContextWordInput): boolean {
  const { sentence, tokenIndex, word } = input;
  const token = sentence.tokens[tokenIndex];
  if (!(token && sentence.translation) || !blankable(word.pos?.[0]) || numeric(word)) return false;
  return word.forms.includes(token.base) || token.base === display(word);
}

/**
 * A 文脈規定 question blanking the token, or undefined when the sentence has no translation
 * (shown with the question, since a short sentence alone may let two words fit), the token is
 * not a noun, verb, adjective or adverb, is a number or part of a compound, is written in a form
 * the conjugator does not know, or fewer than three distractors pass the checks.
 */
export function contextWordQuestion(input: ContextWordInput): ChoiceQuestion | undefined {
  const { sentence, tokenIndex, word } = input;
  const blank = askable(input) ? blankOf(sentence, tokenIndex, word) : undefined;
  if (!blank || givenAway(sentence, blank, word)) return undefined;
  const gloss = firstGloss(word.glosses);
  const right = { text: blank.text, note: note('word-fits', { word: display(word), gloss }) };
  const arranged = arrange(right, wrongOptions(input, blank), input.seed);
  if (!arranged) return undefined;
  return {
    id: questionId('context-word', sentence.id, tokenIndex),
    kind: 'context-word',
    section: SECTION['context-word'],
    stem: stemOf(sentence, blank.from, blank.to, 'blank'),
    ...arranged,
    itemId: itemId('word', word.id),
    sentenceId: sentence.id,
    ...meaningFields(sentence.translation, word.glosses),
  };
}
