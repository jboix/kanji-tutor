import { useId, useState } from 'react';
import { glossesIn } from '../../domain/localized.ts';
import type { CandidateWord } from '../../domain/services/index.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Reading } from '../../ui/reading.tsx';
import styles from './capture.module.css';
import {
  type GrammarCandidate,
  grammarKey,
  isGrammarPicked,
  isWordPicked,
  type Picks,
  wordKey,
} from './review-model.ts';

const PREVIEW = 5;

export interface CandidatesProps {
  words: readonly CandidateWord[];
  grammar: readonly GrammarCandidate[];
  picks: Picks;
  onToggle: (key: string, value: boolean) => void;
  lesson: string;
  onLesson: (lesson: string) => void;
  onAddGrammar: (pattern: string) => void;
}

/** Collapsed: the first five candidates and "+3" (capture.html). */
function Preview({ words, grammar }: Pick<CandidatesProps, 'words' | 'grammar'>) {
  const all = [...words.map((w) => w.text), ...grammar.map((g) => `〜${g.id}`)];
  if (all.length === 0) return null;
  const rest = all.length - PREVIEW;
  return (
    <div className={styles.preview}>
      {all.slice(0, PREVIEW).map((text) => (
        <span key={text} lang="ja">
          {text}
        </span>
      ))}
      {rest > 0 && <span className={styles.previewMore}>+{rest}</span>}
    </div>
  );
}

const languageGlosses = (byLang: Readonly<Record<string, string>> = {}) =>
  Object.fromEntries(Object.entries(byLang).map(([lang, gloss]) => [lang, [gloss]]));

function WordRow({ word, picked, onToggle }: { word: CandidateWord } & RowToggle) {
  const { language } = useI18n();
  const gloss = glossesIn(
    { glosses: [word.gloss], glossesByLang: languageGlosses(word.glossByLang) },
    language,
  );
  return (
    <label className={styles.pickRow}>
      <input type="checkbox" checked={picked} onChange={(e) => onToggle(e.currentTarget.checked)} />
      <span className={styles.pickMain}>
        <span lang="ja" className={styles.pickWord}>
          {word.text}
        </span>
        <Reading kana={word.reading} />
        <span className={styles.pickGloss}>
          {gloss.value[0]}
          <EnMark english={gloss.fallback} />
        </span>
      </span>
    </label>
  );
}

interface RowToggle {
  picked: boolean;
  onToggle: (value: boolean) => void;
}

function GrammarRow({ grammar, picked, onToggle }: { grammar: GrammarCandidate } & RowToggle) {
  const t = useT();
  return (
    <label className={styles.pickRow}>
      <input type="checkbox" checked={picked} onChange={(e) => onToggle(e.currentTarget.checked)} />
      <span className={styles.pickMain}>
        <span lang="ja" className={styles.pickWord}>
          〜{grammar.id}
        </span>
        <span className={styles.pickGloss}>
          {grammar.fromAi ? t('capture.grammarSuggested') : t('capture.grammarPoint')}
        </span>
      </span>
    </label>
  );
}

function LessonField({ lesson, onLesson }: Pick<CandidatesProps, 'lesson' | 'onLesson'>) {
  const id = useId();
  const t = useT();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {t('capture.lessonTag')}
      </label>
      <input
        id={id}
        lang="ja"
        className={styles.input}
        value={lesson}
        placeholder="Tobira 第4課"
        onChange={(e) => onLesson(e.currentTarget.value)}
      />
    </div>
  );
}

function GrammarField({ onAddGrammar }: Pick<CandidatesProps, 'onAddGrammar'>) {
  const id = useId();
  const [pattern, setPattern] = useState('');
  const t = useT();
  const submit = () => {
    onAddGrammar(pattern);
    setPattern('');
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {t('capture.addGrammarLabel')}
      </label>
      <div className={styles.fieldRow}>
        <input
          id={id}
          lang="ja"
          className={styles.input}
          value={pattern}
          placeholder="〜わけではない"
          onChange={(e) => setPattern(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button type="button" className={styles.smallButton} onClick={submit}>
          {t('capture.add')}
        </button>
      </div>
    </div>
  );
}

function FullList(props: CandidatesProps) {
  const { words, grammar, picks, onToggle } = props;
  const t = useT();
  return (
    <div className={styles.pickList}>
      <LessonField lesson={props.lesson} onLesson={props.onLesson} />
      {words.map((word) => (
        <WordRow
          key={word.wordId}
          word={word}
          picked={isWordPicked(picks, word)}
          onToggle={(value) => onToggle(wordKey(word), value)}
        />
      ))}
      {grammar.map((g) => (
        <GrammarRow
          key={g.id}
          grammar={g}
          picked={isGrammarPicked(picks, g)}
          onToggle={(value) => onToggle(grammarKey(g), value)}
        />
      ))}
      <GrammarField onAddGrammar={props.onAddGrammar} />
      <p className={styles.note}>{t('capture.fromDictionary')}</p>
    </div>
  );
}

/** New words and grammar points, ticked to add (C3). */
export function Candidates(props: CandidatesProps) {
  const [open, setOpen] = useState(false);
  const count = props.words.length + props.grammar.length;
  const t = useT();
  return (
    <section className={styles.candidates} aria-label={t('capture.candidatesLabel')}>
      <div className={styles.candidatesHead}>
        <span>
          <b>{t('capture.newCount', { n: count })}</b>
          {t('capture.candidatesTail')}
        </span>
        <button
          type="button"
          className={styles.textLink}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? t('capture.hideList') : t('capture.reviewList')}
        </button>
      </div>
      {open ? <FullList {...props} /> : <Preview words={props.words} grammar={props.grammar} />}
    </section>
  );
}
