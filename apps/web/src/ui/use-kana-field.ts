import { type ChangeEvent, useCallback, useRef, useState } from 'react';
import { toKana } from '../lang/kana.ts';

/** Input state that turns romaji into kana as it is typed (R3, I1), but not mid-IME-composition. */
export function useKanaField(kana: boolean) {
  const [value, setValue] = useState('');
  const composing = useRef(false);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setValue(kana && !composing.current ? toKana(next) : next);
    },
    [kana],
  );
  const onCompositionStart = useCallback(() => {
    composing.current = true;
  }, []);
  const onCompositionEnd = useCallback(() => {
    composing.current = false;
  }, []);
  /** The value as submitted: a trailing "n" becomes ん. */
  const final = useCallback(() => (kana ? toKana(value, true) : value).trim(), [kana, value]);

  return { value, setValue, final, onChange, onCompositionStart, onCompositionEnd };
}
