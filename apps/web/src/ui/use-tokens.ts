import { useEffect, useState } from 'react';
import type { Token } from '../domain/types.ts';
import type { Lang } from '../lang/types.ts';
import { useServices } from './services.tsx';

const caches = new WeakMap<Lang, Map<string, Promise<Token[]>>>();

/** One token when the packs have a word written exactly as `text`, else the tokenizer's. */
async function resolve(lang: Lang, text: string, tokenize: boolean): Promise<Token[]> {
  const words = await lang.lookupWord(text).catch(() => []);
  const word = words.find((w) => w.forms.includes(text));
  if (word) {
    const reading = word.readings[0] ?? '';
    return [{ surface: text, reading, base: text, pos: 'noun', wordId: word.id, start: 0 }];
  }
  if (!tokenize) throw new Error(`not one word: ${text}`);
  return lang.tokenize(text);
}

function tokensOf(lang: Lang, text: string, tokenize: boolean): Promise<Token[]> {
  let cache = caches.get(lang);
  if (!cache) {
    cache = new Map();
    caches.set(lang, cache);
  }
  const key = `${tokenize ? 't' : 'w'}:${text}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const result = resolve(lang, text, tokenize);
  cache.set(key, result);
  result.catch(() => cache?.delete(key));
  return result;
}

/**
 * Tokens for Japanese text that has none (U5): undefined until known, and for good when `enabled`
 * is false or nothing can tokenize it. Nothing loads before a component asks; with `tokenize`
 * false only a whole pack word counts and the worker never starts.
 */
export function useTokens(
  text: string,
  enabled: boolean,
  tokenize = true,
): readonly Token[] | undefined {
  const { lang } = useServices();
  const [found, setFound] = useState<{ text: string; tokens: Token[] }>();
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    tokensOf(lang, text, tokenize).then(
      (tokens) => live && setFound({ text, tokens }),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [lang, text, enabled, tokenize]);
  return found?.text === text ? found.tokens : undefined;
}
