/**
 * Slang and casual-wrong forms that a learner should not take as a model, found by plain text
 * rules. The rules stay conservative: each one matches a form that is never standard written
 * Japanese, so a false positive costs one sentence and a miss costs nothing worse than today.
 * Ordinary casual speech (〜てる, 〜ちゃう, じゃない) stays: N4 grammar teaches it.
 */

interface CasualRule {
  id: string;
  pattern: RegExp;
}

/** End of a sentence: optional closing punctuation, then the end of the text. */
const END = '[。！？!?…」]*$';

const CASUAL_RULES: readonly CasualRule[] = [
  // な-adjectives conjugated like い-adjectives: 好きくない, 嫌いくて.
  { id: 'na-adjective-ku', pattern: /(?:好き|嫌い|綺麗|きれい)く(?:ない|なかった|て)/u },
  // ら抜き: 食べれる, 見れない, 来れた (standard: 食べられる, 見られない, 来られた).
  {
    id: 'ra-nuki',
    pattern: /(?:食べ|見|来|寝|着|起き|決め|考え|信じ)れ(?:る|ない|なかった|た|ます|ません)/u,
  },
  // A long-vowel mark after hiragana stretches a word: すげー, ねー, すごーい. Not before っ:
  // mimetic words write it so (ぼーっと, すーっと).
  { id: 'stretched-hiragana', pattern: /[ぁ-ゖ]ー(?!っ)/u },
  // A small vowel after hiragana does the same: ねぇ, すごぉい.
  { id: 'small-vowel', pattern: /[ぁ-ゖ][ぁぃぅぇぉ]/u },
  // Heavy contractions at the end of a sentence: 〜っす (です), 〜っしょ (でしょう), 〜じゃん.
  { id: 'contraction', pattern: new RegExp(`(?:っす|っしょ|じゃん)${END}`, 'u') },
  // Slang words.
  {
    id: 'slang',
    pattern:
      /(?:マジ|まじ)で|めっちゃ|(?:ヤバ|やば)(?:い|かった|く)|(?:ウザ|うざ)い|(?:ムカ|むか)つ/u,
  },
];

/** The id of the first casual rule `text` breaks, or undefined when it breaks none. */
export function casualRule(text: string): string | undefined {
  return CASUAL_RULES.find((rule) => rule.pattern.test(text))?.id;
}
