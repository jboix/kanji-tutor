/**
 * The kana side of turning typed kana into kanji (C6), as a small input method sees it: the words
 * that stay in kana (particles, the copula, auxiliaries, a few words written in kana), and the
 * dictionary forms an inflected verb or い-adjective may come from, so 食べます is found as
 * 食べる with ます kept in kana. Pure.
 */

/** Particles: always kana. */
const PARTICLES = [
  'は',
  'が',
  'を',
  'に',
  'で',
  'と',
  'も',
  'の',
  'へ',
  'や',
  'か',
  'ね',
  'よ',
  'な',
  'から',
  'まで',
  'より',
  'ので',
  'のに',
  'けど',
  'けれど',
  'でも',
  'しか',
  'だけ',
  'ほど',
  'など',
  'って',
  'とか',
  'には',
  'では',
  'とは',
  'へは',
];

/** The copula, auxiliaries and する, ある, いる, written in kana after a word. */
const AUXILIARIES = [
  'です',
  'でした',
  'でしょう',
  'だ',
  'だった',
  'だろう',
  'じゃない',
  'ではない',
  'ます',
  'ました',
  'ません',
  'ない',
  'なかった',
  'する',
  'した',
  'して',
  'します',
  'しました',
  'しない',
  'ある',
  'あります',
  'いる',
  'います',
  'いた',
  'ください',
];

/** Words usually written in kana, which the dictionary also lists with rare kanji. */
const KANA_WORDS = [
  'これ',
  'それ',
  'あれ',
  'どれ',
  'この',
  'その',
  'あの',
  'どの',
  'ここ',
  'そこ',
  'あそこ',
  'どこ',
  'こう',
  'そう',
  'ああ',
  'どう',
];

/** Kana that stays kana in a phrase. */
export const KANA_FUNCTION_WORDS: ReadonlySet<string> = new Set([
  ...PARTICLES,
  ...AUXILIARIES,
  ...KANA_WORDS,
]);

/** What an inflected word's stem comes from. */
export type StemKind = 'v1' | 'v5' | 'adj';

/** One reading of `text` as an inflected word: `stem` + `ending`, from the word read `dict`. */
export interface Inflection {
  dict: string;
  stem: string;
  ending: string;
  kind: StemKind;
}

const MASU = ['ます', 'ました', 'ません', 'ませんでした', 'ましょう', 'まして', 'たい', 'ながら'];
const NAI = ['ない', 'なかった', 'なくて', 'なければ', 'れる', 'せる'];
const TE = ['て', 'た', 'ても', 'たら', 'たり', 'ている', 'ています', 'ていた', 'てください'];
const DE = ['で', 'だ', 'でも', 'だら', 'だり', 'でいる', 'でいます', 'でいた', 'でください'];
const V1 = [...MASU, ...NAI.slice(0, 4), ...TE, 'られる', 'させる', 'よう', 'ろ', ''];
const ADJ = ['く', 'くて', 'くない', 'かった', 'くなかった', 'ければ', 'さ', 'そう'];

/** Godan rows: each kana's dictionary ending is the row's う-column kana. */
const GODAN_ROWS = [
  'かきくけこ',
  'がぎぐげご',
  'さしすせそ',
  'たちつてと',
  'なにぬねの',
  'ばびぶべぼ',
  'まみむめも',
  'らりるれろ',
  'わいうえお',
];

type Column = 'a' | 'i' | 'e';

/** The endings a godan stem in each column takes ('' is the stem on its own). */
const COLUMN_ENDINGS: Record<Column, readonly string[]> = {
  a: NAI,
  i: [...MASU, ''],
  e: ['ば', 'る', 'ます'],
};

/** Godan stems: a stem's last kana → its dictionary ending, with the endings it takes. */
const GODAN = new Map<string, { end: string; endings: readonly string[] }[]>();

function addGodan(tail: string, end: string, endings: readonly string[]) {
  GODAN.set(tail, [...(GODAN.get(tail) ?? []), { end, endings }]);
}

for (const row of GODAN_ROWS) {
  const [a, i, u, e] = [row[0], row[1], row[2], row[3]] as [string, string, string, string];
  addGodan(a, u, COLUMN_ENDINGS.a);
  addGodan(i, u, COLUMN_ENDINGS.i);
  addGodan(e, u, COLUMN_ENDINGS.e);
}
// The て and た forms' sound changes: 書いて, 泳いだ, 買って, 読んで, 話して.
addGodan('い', 'く', TE);
addGodan('い', 'ぐ', DE);
for (const end of ['う', 'つ', 'る']) addGodan('っ', end, TE);
for (const end of ['ぬ', 'ぶ', 'む']) addGodan('ん', end, DE);
addGodan('し', 'す', TE);

const takes = (endings: readonly string[], ending: string) => endings.includes(ending);

/** The godan readings of `stem` + `ending`. */
function godan(stem: string, ending: string): Inflection[] {
  const rules = GODAN.get(stem.at(-1) ?? '') ?? [];
  return rules
    .filter((rule) => takes(rule.endings, ending))
    .map((rule) => ({ dict: stem.slice(0, -1) + rule.end, stem, ending, kind: 'v5' }));
}

/** The readings of `stem` + `ending` as an inflected verb or い-adjective. */
function split(stem: string, ending: string): Inflection[] {
  const out = godan(stem, ending);
  if (takes(V1, ending)) out.push({ dict: `${stem}る`, stem, ending, kind: 'v1' });
  if (takes(ADJ, ending)) out.push({ dict: `${stem}い`, stem, ending, kind: 'adj' });
  return out;
}

/**
 * Every way `text` may be an inflected verb or い-adjective: a stem with okurigana, then an
 * ending kept in kana (or the stem alone, as 食べ while it is being typed).
 */
export function inflections(text: string): Inflection[] {
  const out: Inflection[] = [];
  for (let cut = 1; cut <= text.length; cut++) {
    out.push(...split(text.slice(0, cut), text.slice(cut)));
  }
  return out;
}
