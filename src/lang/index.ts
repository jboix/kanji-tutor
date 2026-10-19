/** Public API of the language module: tokenizer, kana, lookup, verification, speech. */
export { foldKana, hasRomaji, isKana, toHiragana, toKana, toKatakana } from './kana.ts';
export { createLang, type LangDeps } from './lang.ts';
export { canSpeak, hasJapaneseVoice, muteSpeech, speak } from './speech.ts';
export type { Lang, ReadingCheck, Tokenizer } from './types.ts';
export {
  createWorkerTokenizer,
  type TokenizerWorker,
  type WorkerTokenizerOptions,
} from './worker-tokenizer.ts';
