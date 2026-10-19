import type { Token } from '../domain/types.ts';

type Row = [surface: string, reading: string, pos: string];

/** Builds tokens with offsets from surface/reading/pos rows (gallery samples only). */
function tokens(rows: Row[]): Token[] {
  let start = 0;
  return rows.map(([surface, reading, pos]) => {
    const token: Token = { surface, reading, base: surface, pos, start };
    start += surface.length;
    return token;
  });
}

function sentence(rows: Row[]) {
  const list = tokens(rows);
  return { text: list.map((t) => t.surface).join(''), tokens: list };
}

/** read.html / today.html: 駅で友達を待っている間に、本を読みました。 */
export const READ_SENTENCE = sentence([
  ['駅', 'えき', 'noun'],
  ['で', 'で', 'particle'],
  ['友達', 'ともだち', 'noun'],
  ['を', 'を', 'particle'],
  ['待っ', 'まっ', 'verb'],
  ['て', 'て', 'particle'],
  ['いる', 'いる', 'verb'],
  ['間', 'あいだ', 'noun'],
  ['に', 'に', 'particle'],
  ['、', '、', 'symbol'],
  ['本', 'ほん', 'noun'],
  ['を', 'を', 'particle'],
  ['読み', 'よみ', 'verb'],
  ['まし', 'まし', 'auxiliary'],
  ['た', 'た', 'auxiliary'],
  ['。', '。', 'symbol'],
]);

/** voice.html: 先生に新しい友達を紹介しました。 */
export const VOICE_SENTENCE = sentence([
  ['先生', 'せんせい', 'noun'],
  ['に', 'に', 'particle'],
  ['新しい', 'あたらしい', 'adjective'],
  ['友達', 'ともだち', 'noun'],
  ['を', 'を', 'particle'],
  ['紹介', 'しょうかい', 'noun'],
  ['し', 'し', 'verb'],
  ['まし', 'まし', 'auxiliary'],
  ['た', 'た', 'auxiliary'],
  ['。', '。', 'symbol'],
]);

/** compose.html: the learner's sentence, before corrections. */
export const COMPOSE_SENTENCE = sentence([
  ['日本語', 'にほんご', 'noun'],
  ['が', 'が', 'particle'],
  ['嫌い', 'きらい', 'adjective'],
  ['わけ', 'わけ', 'noun'],
  ['で', 'で', 'auxiliary'],
  ['は', 'は', 'particle'],
  ['ない', 'ない', 'auxiliary'],
  ['が', 'が', 'particle'],
  ['、', '、', 'symbol'],
  ['漢字', 'かんじ', 'noun'],
  ['を', 'を', 'particle'],
  ['書く', 'かく', 'verb'],
  ['の', 'の', 'particle'],
  ['は', 'は', 'particle'],
  ['好き', 'すき', 'adjective'],
  ['じゃ', 'じゃ', 'auxiliary'],
  ['ない', 'ない', 'auxiliary'],
  ['。', '。', 'symbol'],
]);
