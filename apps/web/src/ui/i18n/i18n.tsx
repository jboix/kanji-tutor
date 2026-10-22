/**
 * The interface language (N7b): a provider with the active catalogue, `useT()` for messages
 * and `useI18n()` for formats and switching. Outside a provider everything is English, so tests
 * and the dev gallery need no setup.
 */
import {
  createContext,
  Fragment,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Repos } from '../../domain/repos.ts';
import { languageOf, type UiLanguage } from '../languages.ts';
import { createFormats, type Formats } from './format.ts';
import { ENGLISH, loadMessages } from './load.ts';
import { createTranslator } from './translate.ts';
import type { MessageKey, Messages, RichParamsOf, Translate } from './types.ts';

/** A message with React nodes in its holes. */
export type RichTranslate = <K extends MessageKey>(
  key: K,
  ...params: RichParamsOf<K, ReactNode>
) => ReactNode;

export interface I18n {
  language: UiLanguage;
  t: Translate;
  rich: RichTranslate;
  format: Formats;
  /** Loads the language's messages, then switches the whole interface to it. */
  setLanguage: (language: UiLanguage) => Promise<void>;
}

/** A language with its messages, ready to show. */
export interface LoadedLanguage {
  language: UiLanguage;
  messages: Messages;
}

function richOf(t: Translate): RichTranslate {
  return ((key: MessageKey, params: Record<string, ReactNode> = {}) => {
    // Numbers and strings go in as they are (so `n` still picks the plural); nodes get a mark.
    const marks = Object.fromEntries(
      Object.entries(params).map(([name, value]) => [
        name,
        typeof value === 'number' || typeof value === 'string' ? value : `\u0000${name}\u0000`,
      ]),
    );
    const text = (t as (k: string, p: object) => string)(key, marks);
    let offset = 0;
    let hole = true;
    return text.split('\u0000').map((part) => {
      const key = `${offset}:${part}`;
      offset += part.length + 1;
      hole = !hole;
      return <Fragment key={key}>{hole ? params[part] : part}</Fragment>;
    });
  }) as RichTranslate;
}

function i18nOf(loaded: LoadedLanguage, setLanguage: I18n['setLanguage']): I18n {
  const t = createTranslator(loaded.language, loaded.messages, ENGLISH);
  const format = createFormats(loaded.language);
  return { language: loaded.language, t, rich: richOf(t), format, setLanguage };
}

const ENGLISH_I18N = i18nOf({ language: 'en', messages: ENGLISH }, async () => undefined);
const I18nContext = createContext<I18n>(ENGLISH_I18N);

/** Loads a language's catalogue. */
export async function loadLanguage(language: UiLanguage): Promise<LoadedLanguage> {
  return { language, messages: await loadMessages(language) };
}

/** The saved language, else the browser's, else English; English when anything fails. */
export async function loadInitialLanguage(repos: Repos): Promise<LoadedLanguage> {
  try {
    return await loadLanguage(languageOf((await repos.settings.get()).uiLanguage));
  } catch {
    return { language: 'en', messages: ENGLISH };
  }
}

/** Provides the interface language and keeps `<html lang>` on it. */
export function I18nProvider(props: { initial: LoadedLanguage; children: ReactNode }) {
  const [loaded, setLoaded] = useState(props.initial);
  const setLanguage = useCallback(async (language: UiLanguage) => {
    setLoaded(await loadLanguage(language));
  }, []);
  const value = useMemo(() => i18nOf(loaded, setLanguage), [loaded, setLanguage]);
  useEffect(() => {
    document.documentElement.lang = loaded.language;
  }, [loaded.language]);
  return <I18nContext value={value}>{props.children}</I18nContext>;
}

/** The translator for the current language. */
export function useT(): Translate {
  return use(I18nContext).t;
}

/** The current language, its translator, formats and the switch. */
export function useI18n(): I18n {
  return use(I18nContext);
}
