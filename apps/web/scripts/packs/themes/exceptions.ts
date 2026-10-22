/**
 * The theme check's exceptions, kept small and explicit. Each one says why the JLPT data cannot
 * judge the token.
 */

/**
 * Parts of speech exempt from the level rule (they must still resolve):
 * - suffix and prefix: bound pieces taught with grammar and counters (〜さん, 〜人, 〜時, 〜円, お〜,
 *   ご〜). The JLPT lists tag them erratically, e.g. さん as N1.
 * - pronoun: こそあど words and personal pronouns. The list-to-JMdict mapping puts これ and それ on
 *   archaic kanji entries tagged N1.
 */
export const LEVEL_FREE_POS: ReadonlySet<string> = new Set(['suffix', 'prefix', 'pronoun']);

/** IPADIC pos detail of proper nouns (place and person names): exempt from the level rule. */
export const PROPER_NOUN = '固有名詞';

/**
 * Person and place names used by the passages that JMdict, a dictionary of common words, does not
 * list (it leaves names to JMnedict).
 */
export const PROPER_NAMES: ReadonlySet<string> = new Set([
  'アンナ',
  '山田',
  '山本',
  'リン',
  '上野',
  '中野',
  '目黒',
  '浅草',
  '新宿',
  '神田',
  '奈良公園',
]);

/**
 * A numeral and a counter that IPADIC keeps as one noun (六月, 三日): numerals are never content
 * and counters are suffixes, so the pair is exempt from the level rule too. The JLPT lists only
 * carry the counter on its own (月, 日).
 */
export const NUMERAL_COUNTER = /^[〇一二三四五六七八九十百千万]+[月日年時分人円階回番本枚]$/u;

/**
 * Passive and causative endings (れる, られる, せる, させる) that IPADIC tags as verb suffixes
 * (動詞・接尾). They are grammar, not vocabulary, and JMdict has no entry for them: skipped.
 */
export function isVerbEnding(raw: { pos: string; pos_detail_1: string }): boolean {
  return raw.pos === '動詞' && raw.pos_detail_1 === '接尾';
}

/**
 * The polite prefix お/ご that IPADIC fuses with a noun (お正月, お客, お湯). The pruned pack often
 * lacks the fused entry, so the check falls back to the noun without it (正月, 客, 湯).
 */
export const HONORIFIC_PREFIX = /^[おご御]/u;
