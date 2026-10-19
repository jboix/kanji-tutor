/**
 * Near-miss readings for 漢字読み (J1): the slips a learner makes, each with a note saying what
 * changed. Long vowels shortened or added, っ dropped or added, and voicing changed.
 */
import { devoice, vowelOf } from '../kana.ts';
import type { ErrorType } from '../types.ts';
import { type CodedNote, note } from './types.ts';

/** A wrong reading, the slip it stands for and why it is wrong. */
export interface NearMiss {
  kana: string;
  slip: ErrorType;
  note: CodedNote;
}

const SMALL = new Set([...'ゃゅょぁぃぅぇぉゎ']);
/** Kana that lengthen a mora with the given vowel. */
const LENGTHENER: Record<string, readonly string[]> = {
  a: ['あ'],
  i: ['い'],
  u: ['う'],
  e: ['い', 'え'],
  o: ['う', 'お'],
};
/** The kana added to lengthen a mora with the given vowel. */
const STRETCH: Record<string, string> = { u: 'う', e: 'い', o: 'う' };
/** Morae that can follow a small っ: the k, s, t and p rows. */
const GEMINABLE = new Set([...'かきくけこさしすせそたちつてとぱぴぷぺぽ']);
const VOICE: Record<string, string> = Object.fromEntries(
  [...'かきくけこさしすせそたちつてとはひふへほ'].map((c) => [
    c,
    String.fromCharCode(c.charCodeAt(0) + 1),
  ]),
);

/** Splits kana into morae, small ゃ ゅ ょ kept with the kana before them: しょ・う・か・い. */
export function morae(kana: string): string[] {
  const out: string[] = [];
  for (const char of kana) {
    const last = out.length - 1;
    if (SMALL.has(char) && last >= 0) out[last] += char;
    else out.push(char);
  }
  return out;
}

const vowel = (mora: string | undefined) => vowelOf(mora?.at(-1) ?? '');

function isLengthener(prev: string | undefined, mora: string): boolean {
  const v = vowel(prev);
  return v !== undefined && (LENGTHENER[v] ?? []).includes(mora);
}

const join = (list: readonly string[]) => list.join('');
const without = (m: readonly string[], i: number) => join([...m.slice(0, i), ...m.slice(i + 1)]);
const insert = (m: readonly string[], i: number, kana: string) =>
  join([...m.slice(0, i), kana, ...m.slice(i)]);

/** Long vowels dropped (しょうかい → しょかい) or added (ほん → ほうん is skipped: ん). */
export function longVowelSlips(kana: string): NearMiss[] {
  const m = morae(kana);
  const out: NearMiss[] = [];
  m.forEach((mora, i) => {
    const prev = m[i - 1];
    if (i > 0 && isLengthener(prev, mora)) {
      const variant = without(m, i);
      out.push({
        kana: variant,
        slip: 'long-vowel',
        note: note('long-vowel-dropped', { kana: variant, mora: `${prev}${mora}` }),
      });
      return;
    }
    const add = STRETCH[vowel(mora) ?? ''];
    if (add && !isLengthener(mora, m[i + 1] ?? '')) {
      const variant = insert(m, i + 1, add);
      const stretched = note('long-vowel-added', { kana: variant, mora, long: `${mora}${add}` });
      out.push({ kana: variant, slip: 'long-vowel', note: stretched });
    }
  });
  return out;
}

const GEMINATING = new Set([...'くつちき']);

/** っ added before the mora at `i`, or the mora before it turned into っ (がくせい → がっせい). */
function addedSokuon(m: readonly string[], i: number): NearMiss[] {
  const mora = m[i] ?? '';
  const prev = m[i - 1];
  if (i === 0 || prev === undefined || !GEMINABLE.has(mora.charAt(0))) return [];
  if (prev === 'っ' || prev === 'ん' || isLengthener(m[i - 2], prev)) return [];
  const added = insert(m, i, 'っ');
  const out: NearMiss[] = [
    { kana: added, slip: 'sokuon', note: note('sokuon-added', { kana: added, mora }) },
  ];
  if (GEMINATING.has(prev) && i > 1) {
    const kana = join([...m.slice(0, i - 1), 'っ', ...m.slice(i)]);
    out.push({ kana, slip: 'sokuon', note: note('sokuon-turned', { kana, mora: prev }) });
  }
  return out;
}

/** A small っ dropped (まって → まて), added before a k/s/t/p mora, or turning く/つ/ち/き into っ. */
export function sokuonSlips(kana: string): NearMiss[] {
  const m = morae(kana);
  return m.flatMap((mora, i) => {
    if (mora !== 'っ') return addedSokuon(m, i);
    const kana = without(m, i);
    return [{ kana, slip: 'sokuon' as const, note: note('sokuon-dropped', { kana }) }];
  });
}

/** One mora voiced (てんき → でんき) or unvoiced (がくせい → かくせい). */
export function voicingSlips(kana: string): NearMiss[] {
  const m = morae(kana);
  return m.flatMap((mora, i): NearMiss[] => {
    const head = mora.charAt(0);
    const voiced = VOICE[head];
    const plain = devoice(head);
    const slip: ErrorType = i > 0 ? 'rendaku' : 'other';
    const swap = (to: string) => join([...m.slice(0, i), to + mora.slice(1), ...m.slice(i + 1)]);
    if (voiced) {
      const kana = swap(voiced);
      return [{ kana, slip, note: note('voiced', { kana, mora, voiced: voiced + mora.slice(1) }) }];
    }
    if (plain === head) return [];
    const kana = swap(plain);
    return [{ kana, slip, note: note('unvoiced', { kana, mora }) }];
  });
}

/** A reading a learner could write: no leading っ, ん or small kana, no っっ, no final っ. */
export function plausible(kana: string): boolean {
  const first = kana.charAt(0);
  if (kana === '' || first === 'っ' || first === 'ん' || SMALL.has(first)) return false;
  return !kana.includes('っっ') && !kana.endsWith('っ');
}
