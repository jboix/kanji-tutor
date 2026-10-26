/**
 * A handout question's sentence: its blank (printed ＿＿) drawn as a gap until answered, then
 * filled with the tutor's answer in the line, green when the learner had it right. A stem with
 * no blank, or several, stays as printed.
 */
import type { HandoutQuestion } from '../../domain/scan-types.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import styles from './handout.module.css';

const BLANK = /[＿_]+/;

/** The text around the stem's one blank; none when it has no blank or several. */
export function splitBlank(stem: string): { before: string; after: string } | undefined {
  const parts = stem.split(BLANK);
  if (parts.length !== 2) return undefined;
  return { before: parts[0] ?? '', after: parts[1] ?? '' };
}

interface StemProps {
  question: HandoutQuestion;
  /** The answer shows: graded, or a free answer revealed. */
  answered: boolean;
  right: boolean;
}

export function HandoutStem({ question, answered, right }: StemProps) {
  const t = useT();
  const around = question.type === 'free' ? undefined : splitBlank(question.stem);
  if (!around) {
    return (
      <p lang="ja" className={styles.stem}>
        {question.stem}
      </p>
    );
  }
  return (
    <p lang="ja" className={styles.stem}>
      {around.before}
      {answered ? (
        <span className={cx(styles.filled, right && styles.right)} data-fill="">
          {question.answer}
        </span>
      ) : (
        <span className={styles.blank} data-blank="">
          <span className="visually-hidden">{t('questions.blank')}</span>
        </span>
      )}
      {around.after}
    </p>
  );
}
