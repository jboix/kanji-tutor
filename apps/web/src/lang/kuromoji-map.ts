import type { IpadicFeatures } from 'kuromoji';
import type { Token } from '../domain/types.ts';
import { foldKana } from './kana.ts';

const POS: Readonly<Record<string, string>> = {
  名詞: 'noun',
  動詞: 'verb',
  形容詞: 'adjective',
  副詞: 'adverb',
  助詞: 'particle',
  助動詞: 'auxiliary',
  記号: 'symbol',
  接頭詞: 'prefix',
  連体詞: 'adnominal',
  接続詞: 'conjunction',
  感動詞: 'interjection',
};

/** Kuromoji's fields we read; a subset of `IpadicFeatures` so tests can pass plain objects. */
export type KuromojiToken = Pick<
  IpadicFeatures,
  'surface_form' | 'pos' | 'pos_detail_1' | 'basic_form' | 'reading' | 'word_position'
>;

/** Coarse English part of speech from kuromoji's IPADIC tags (名詞/代名詞 → pronoun, etc.). */
export function coarsePos(token: Pick<KuromojiToken, 'pos' | 'pos_detail_1'>): string {
  if (token.pos === '名詞' && token.pos_detail_1 === '代名詞') return 'pronoun';
  if (token.pos === '名詞' && token.pos_detail_1 === '接尾') return 'suffix';
  return POS[token.pos] ?? 'other';
}

function known(value: string | undefined): value is string {
  return value !== undefined && value !== '' && value !== '*';
}

/** Maps one kuromoji token; `start` is used when kuromoji gives no position. */
export function mapKuromojiToken(token: KuromojiToken, start: number): Token {
  const surface = token.surface_form;
  return {
    surface,
    reading: known(token.reading) ? foldKana(token.reading) : surface,
    base: known(token.basic_form) ? token.basic_form : surface,
    pos: coarsePos(token),
    start: token.word_position > 0 ? token.word_position - 1 : start,
  };
}

/** Maps kuromoji output to our tokens: hiragana readings, coarse pos, 0-based start offsets. */
export function mapKuromojiTokens(tokens: readonly KuromojiToken[]): Token[] {
  let offset = 0;
  return tokens.map((raw) => {
    const token = mapKuromojiToken(raw, offset);
    offset = token.start + token.surface.length;
    return token;
  });
}
