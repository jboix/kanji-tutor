/**
 * The tutor's Japanese in immersion (M2): words above the learner carry furigana and open their
 * meaning on tap; the summary in the learner's language follows a mixed or fallen-back reply and
 * is one tap away otherwise. Shapes mirror the AI module's `GlossedWord` and `ImmersionNote`.
 */
import { useState } from 'react';
import { splitFurigana } from './furigana.ts';
import { useT } from './i18n/i18n.tsx';
import styles from './immersion-text.module.css';

/** A word to gloss: its furigana (absent when hidden, L3), whether it is verified, its meaning. */
export interface GlossWord {
  surface: string;
  reading?: string;
  verified: boolean;
  gloss?: string;
}

/** Where the tokenizer put a glossed word (`texts[text]`, UTF-16 offsets): mirrors `GlossPlace`. */
export interface GlossPlaceView {
  text: number;
  start: number;
  end: number;
  word: number;
}

export interface ImmersionView {
  mode: 'mixed' | 'japanese';
  words: readonly GlossWord[];
  texts?: readonly string[];
  places?: readonly GlossPlaceView[];
  fellBack: boolean;
  summaryNative?: string;
}

/** A glossed word at its offsets in one prose text. */
export interface PlacedWord {
  start: number;
  end: number;
  word: GlossWord;
}

/**
 * The glossed words of `prose`, at the offsets the tokenizer gave (D57); none when `prose` is not
 * a text the check tokenized (it changed since). Never found by substring search: ひ for 日 never
 * lands inside 毎日.
 */
export function placedWords(view: ImmersionView, prose: string): PlacedWord[] {
  const text = view.texts?.indexOf(prose) ?? -1;
  if (text < 0) return [];
  return (view.places ?? []).flatMap((place) => {
    const word = view.words[place.word];
    return place.text === text && word ? [{ start: place.start, end: place.end, word }] : [];
  });
}

/** Splits a Japanese run that starts at `offset` in its prose around the words placed in it. */
export function glossPieces(text: string, placed: readonly PlacedWord[], offset = 0) {
  const inside = placed
    .map((p) => ({ ...p, start: p.start - offset, end: p.end - offset }))
    .filter((p) => p.start >= 0 && p.end <= text.length)
    .sort((a, b) => a.start - b.start);
  const pieces: { text: string; at: number; word?: GlossWord }[] = [];
  let at = 0;
  for (const place of inside) {
    if (place.start < at) continue;
    if (place.start > at) pieces.push({ text: text.slice(at, place.start), at });
    pieces.push({ text: text.slice(place.start, place.end), at: place.start, word: place.word });
    at = place.end;
  }
  if (at < text.length || pieces.length === 0) pieces.push({ text: text.slice(at), at });
  return pieces;
}

function Furigana({ word }: { word: GlossWord }) {
  const parts = word.reading ? splitFurigana(word.surface, word.reading) : null;
  if (!parts) return <>{word.surface}</>;
  const rt = word.verified ? styles.rt : `${styles.rt} ${styles.unverified}`;
  return (
    <>
      {parts.before}
      <ruby className={styles.ruby}>
        {parts.base}
        <rp>(</rp>
        <rt className={rt}>{parts.reading}</rt>
        <rp>)</rp>
      </ruby>
      {parts.after}
    </>
  );
}

function GlossNote({ word }: { word: GlossWord }) {
  const t = useT();
  return (
    <span className={styles.gloss} role="status">
      {word.gloss ?? t('ui.glossMissing')}
      {word.reading && !word.verified && t('ui.glossUnconfirmed')}
    </span>
  );
}

/** One word above the learner: furigana, and its meaning on tap. */
function Glossed({ word }: { word: GlossWord }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  return (
    <>
      <button
        type="button"
        className={styles.word}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {/* Named by what it shows, furigana included, then ": meaning" (WCAG 2.5.3). */}
        <Furigana word={word} />
        <span className="visually-hidden">{t('ui.glossSuffix')}</span>
      </button>
      {open && <GlossNote word={word} />}
    </>
  );
}

/**
 * A Japanese run, starting at `offset` in its prose, with the words placed in it marked; put it
 * inside `<Ja>`.
 */
export function GlossedRun(props: { text: string; offset: number; placed: readonly PlacedWord[] }) {
  return glossPieces(props.text, props.placed, props.offset).map((piece) =>
    piece.word ? <Glossed key={piece.at} word={piece.word} /> : piece.text,
  );
}

/** Under a mixed or Japanese reply: the summary in the learner's language, or a tap to it. */
export function ImmersionSummary({ view }: { view: ImmersionView }) {
  const [shown, setShown] = useState(false);
  const t = useT();
  const { summaryNative, fellBack } = view;
  const always = view.mode === 'mixed' || fellBack;
  const note = fellBack && <p className={styles.muted}>{t('ui.manyNew')}</p>;
  if (!summaryNative) return note || null;
  if (always || shown) {
    return (
      <div className={styles.summary}>
        {note}
        <p className={styles.native}>{summaryNative}</p>
      </div>
    );
  }
  return (
    <button type="button" className={styles.toggle} onClick={() => setShown(true)}>
      {t('ui.inMyLanguage')}
    </button>
  );
}
