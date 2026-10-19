import { useEffect, useState } from 'react';
import {
  type ContentLookup,
  ENGLISH_CONTENT,
  loadContentLanguage,
} from '../domain/content-language.ts';
import { useI18n } from './i18n/i18n.tsx';

/**
 * The app's content texts in the learner's language (N9): the lookup maps for the interface
 * language (D52), so they switch with it; English until that language's chunk has loaded.
 */
export function useContentLanguage(): ContentLookup {
  const { language } = useI18n();
  const [lookup, setLookup] = useState(ENGLISH_CONTENT);
  useEffect(() => {
    let live = true;
    void loadContentLanguage(language).then((loaded) => live && setLookup(loaded));
    return () => {
      live = false;
    };
  }, [language]);
  return lookup;
}
