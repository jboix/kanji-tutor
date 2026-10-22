import { isKana } from 'wanakana';
import { useT } from './i18n/i18n.tsx';
import styles from './ruby.module.css';

/** Furigana over a base: ruby-position over, the reading in Klee One (D105). Kana needs none. */
export function Ruby({ base, reading }: { base: string; reading: string }) {
  if (isKana(base)) {
    return (
      <span className={styles.ruby} lang="ja" data-reading={reading}>
        {base}
      </span>
    );
  }
  return (
    <ruby className={styles.ruby} lang="ja" data-reading={reading}>
      {base}
      <rp>(</rp>
      <rt className={styles.rt}>{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
}

/** A correction that inserts text (compose.html): a vermilion caret with the missing kana above. */
export function Insertion({ text, label }: { text: string; label?: string }) {
  const t = useT();
  return (
    <ruby className={styles.ruby} lang="ja" data-reading={text} data-insert="">
      <span className={styles.caret} aria-hidden="true">
        ‸
      </span>
      <rt className={styles.correction}>
        <span className="visually-hidden">{label ?? t('ui.insert')}: </span>
        {text}
      </rt>
    </ruby>
  );
}
