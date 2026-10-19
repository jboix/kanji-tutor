/**
 * The top of the session end (W-end, C-end; D115, D116): the check that pops in and draws
 * itself, お疲れさまでした with its length, the three counts, and what was new today.
 */
import type { CSSProperties } from 'react';
import { localGrammar } from '../../domain/content-language.ts';
import { glossesIn } from '../../domain/localized.ts';
import type { MetFirst } from '../../domain/services/index.ts';
import { splitFurigana } from '../../ui/furigana.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { Ruby } from '../../ui/ruby.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './session-end.module.css';
import type { EndCounts } from './session-review.ts';

/** The CSS delay of a part that rises in, in seconds (W-end's stagger). */
export const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties;

/** The green check: it pops in, its stroke draws itself, and one soft ring goes out. */
function DoneMark() {
  return (
    <span className={styles.mark} aria-hidden="true" data-done-mark="">
      <svg viewBox="0 0 24 24" width="46" height="46" aria-hidden="true">
        <path className={styles.check} d="M5 12.5l4.5 4.5L19 7" />
      </svg>
    </span>
  );
}

/** お疲れさまでした (the same in every language, D115) and "Session done · about 9 minutes". */
export function DoneHeader({ minutes }: { minutes: number }) {
  const t = useT();
  return (
    <header className={styles.header}>
      <DoneMark />
      {/* Named without its furigana, which a screen reader would read out in brackets. */}
      <h1
        className={`${styles.title} ${styles.rise}`}
        style={delay(0.6)}
        lang="ja"
        aria-label="お疲れさまでした"
      >
        お<Ruby base="疲" reading="つか" />
        れさまでした
      </h1>
      <p className={`${styles.subtitle} ${styles.rise}`} style={delay(0.75)}>
        {t('sessionEnd.subtitle', { n: minutes })}
      </p>
    </header>
  );
}

const FIRST: Record<
  EndCounts['label'],
  'sessionEnd.sentences' | 'sessionEnd.exercises' | 'sessionEnd.both'
> = {
  sentences: 'sessionEnd.sentences',
  exercises: 'sessionEnd.exercises',
  both: 'sessionEnd.both',
};

/** The three counts, each read as "23 sentences" by a screen reader. */
export function Counts({ counts }: { counts: EndCounts }) {
  const t = useT();
  const { label, done, right, again } = counts;
  const rightKey = label === 'sentences' ? 'sessionEnd.readRight' : 'sessionEnd.right';
  const rows = [
    { n: done, text: t(FIRST[label], { n: done }), tone: '' },
    { n: right, text: t(rightKey, { n: right }), tone: styles.ok },
    { n: again, text: t('sessionEnd.again', { n: again }), tone: styles.miss },
  ];
  return (
    <ul className={styles.counts} aria-label={t('sessionEnd.counts')} data-counts="">
      {rows.map((row, i) => (
        <li
          key={row.tone}
          className={`${styles.count} ${styles.rise}`}
          style={delay(0.95 + i / 10)}
        >
          <strong className={row.tone}>{row.n}</strong> <span>{row.text}</span>
        </li>
      ))}
    </ul>
  );
}

const KIND: Record<MetFirst['kind'], PlainKey> = {
  kanji: 'sessionEnd.kanji',
  word: 'sessionEnd.word',
  grammar: 'sessionEnd.grammar',
};

/** What a card shows of a thing met: its Japanese, its reading and its meaning. */
function useMetText(met: MetFirst) {
  const { language } = useI18n();
  const content = useContentLanguage();
  if (met.kind === 'kanji') {
    const { char, meanings } = met.kanji;
    return { ja: char, reading: met.reading, meaning: meanings[0] };
  }
  if (met.kind === 'word') {
    const { forms, readings } = met.word;
    const ja = forms[0] ?? readings[0] ?? '';
    return { ja, reading: readings[0], meaning: glossesIn(met.word, language).value[0] };
  }
  return {
    ja: met.entry.pattern,
    reading: undefined,
    meaning: localGrammar(content, met.entry).value.meaning,
  };
}

/** The Japanese with its reading over the kanji only: 待 ま and then つ (R11). */
function MetJa({ ja, reading }: { ja: string; reading: string | undefined }) {
  const parts = reading ? splitFurigana(ja, reading) : null;
  if (!parts) return <Ja>{ja}</Ja>;
  return (
    <Ja>
      {parts.before}
      <Ruby base={parts.base} reading={parts.reading} />
      {parts.after}
    </Ja>
  );
}

function MetCard({ met, at }: { met: MetFirst; at: number }) {
  const t = useT();
  const { ja, reading, meaning } = useMetText(met);
  return (
    <li className={`${styles.met} ${styles.rise}`} style={delay(at)} data-met={met.kind}>
      <span className={styles.metKind}>{t(KIND[met.kind])}</span>
      <span className={`${styles.metJa} ${styles[met.kind]}`}>
        <MetJa ja={ja} reading={reading} />
      </span>
      {meaning && <span className={styles.metMeaning}>{meaning}</span>}
    </li>
  );
}

/** "温泉 おんせん" for the "and N more" line. */
function moreText(met: MetFirst): string {
  if (met.kind === 'grammar') return met.entry.pattern;
  if (met.kind === 'kanji') return [met.kanji.char, met.reading].filter(Boolean).join(' ');
  return [met.word.forms[0], met.word.readings[0]].filter(Boolean).join(' ');
}

function More({ rest, at }: { rest: readonly MetFirst[]; at: number }) {
  const { rich } = useI18n();
  if (rest.length === 0) return null;
  const list = rest.map((met, i) => (
    <span key={moreText(met)}>
      {i > 0 && ', '}
      <Ja>{moreText(met)}</Ja>
    </span>
  ));
  return (
    <p className={`${styles.more} ${styles.rise}`} style={delay(at)}>
      {rich('sessionEnd.andMore', { n: rest.length, list: <>{list}</> })}
    </p>
  );
}

/** "New today": at most three cards (one of each kind first), then "and N more: …" (D115). */
export function NewToday({
  shown,
  rest,
  at,
}: {
  shown: readonly MetFirst[];
  rest: readonly MetFirst[];
  at: number;
}) {
  const t = useT();
  if (shown.length === 0) return null;
  return (
    <section className={styles.section} aria-labelledby="end-new">
      <h2 id="end-new" className={`${styles.label} ${styles.rise}`} style={delay(at)}>
        {t('sessionEnd.newToday')}
      </h2>
      <ul className={styles.metGrid}>
        {shown.map((met, i) => (
          <MetCard key={`${met.kind}:${moreText(met)}`} met={met} at={at + 0.15 * (i + 1)} />
        ))}
      </ul>
      <More rest={rest} at={at + 0.6} />
    </section>
  );
}
