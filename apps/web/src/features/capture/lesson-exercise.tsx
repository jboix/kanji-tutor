/**
 * An exercise on a scanned lesson's page, where it is printed. One the tutor made into questions
 * shows them as printed (never the answers), a check before each one answered right, and a
 * button that practises just this exercise. One the app has no kind of question for keeps its
 * printed lines, says so and why, and leads to the photo: it is never dropped.
 */
import type { HandoutQuestion, ScannedLesson } from '../../domain/scan-types.ts';
import { type BlockView, exerciseParam, isKept, questionKey } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { BlockLines, type LineAsk } from './lesson-lines.tsx';
import styles from './lesson-pages.module.css';
import { TYPE_LABELS } from './scan-copy.ts';
import type { ReviewModel } from './use-draft-review.ts';

interface QuestionLineProps {
  question: HandoutQuestion;
  /** Its place in the exercise, for a question printed without a number. */
  n: number;
  lesson: ScannedLesson;
}

function QuestionLine({ question, n, lesson }: QuestionLineProps) {
  const t = useT();
  const key = questionKey(question);
  const left = !isKept(lesson, key);
  const done = !left && lesson.practised[key] !== undefined;
  return (
    <li className={cx(styles.question, done && styles.done, left && styles.leftOut)}>
      <span className={styles.questionMain}>
        {done && <span className={styles.hidden}>{t('capture.practisedMark')}</span>}
        <span lang="ja" className={styles.stem}>
          {question.number ?? n}. {question.stem}
        </span>
        {question.choices.length > 0 && (
          <span lang="ja" className={styles.choices}>
            {question.choices.join(' ・ ')}
          </span>
        )}
      </span>
      {left && <span className={styles.state}>{t('capture.partLeftOut')}</span>}
    </li>
  );
}

/** "Choose the right form", or that the exercise mixes kinds of question. */
function kindLabel(t: Translate, questions: readonly HandoutQuestion[]): string {
  const types = new Set(questions.map((question) => question.type));
  const [only] = types;
  return only && types.size === 1 ? t(TYPE_LABELS[only]) : t('capture.exerciseMixed');
}

interface ExerciseProps {
  block: BlockView;
  page: number;
  model: ReviewModel;
}

/** What is left to do with the exercise: practise what is kept of it, or add it back. */
function ExerciseAction({ block, page, model }: ExerciseProps) {
  const t = useT();
  const { lesson } = model;
  const keys = block.questions.map(questionKey);
  const kept = keys.filter((key) => isKept(lesson, key)).length;
  if (kept === 0) {
    return (
      <PillButton variant="secondary" onClick={() => model.setKept(keys, true)}>
        {t('capture.addBack')}
      </PillButton>
    );
  }
  const exercise = exerciseParam({ page, block: block.index });
  const to = `${paths.read}?scan=${encodeURIComponent(lesson.id)}&exercise=${exercise}`;
  return (
    <PillLink variant="secondary" to={to}>
      {t('capture.practiseThese', { n: kept })}
    </PillLink>
  );
}

/** "1 of 2 practised", of what is kept; or that the whole exercise is left out. */
function progressLine(t: Translate, block: BlockView, lesson: ScannedLesson): string {
  const kept = block.questions.map(questionKey).filter((key) => isKept(lesson, key));
  if (kept.length === 0) return t('capture.exerciseLeftOut');
  const done = kept.filter((key) => lesson.practised[key] !== undefined).length;
  if (done === 0) return t('capture.exerciseNotYet');
  return t('capture.exercisePractised', { done, total: kept.length });
}

export function Exercise({ block, page, model }: ExerciseProps) {
  const t = useT();
  return (
    <div className={styles.exercise}>
      <ul className={styles.questions}>
        {block.questions.map((question, i) => (
          <QuestionLine key={question.id} question={question} n={i + 1} lesson={model.lesson} />
        ))}
      </ul>
      <div className={styles.exerciseFoot}>
        <span className={styles.exerciseMeta}>
          <span>{kindLabel(t, block.questions)}</span>
          <span>{progressLine(t, block, model.lesson)}</span>
        </span>
        <ExerciseAction block={block} page={page} model={model} />
      </div>
    </div>
  );
}

interface UnsupportedProps {
  block: BlockView;
  page: number;
  ask: LineAsk;
  /** Opens the page's photo; absent when the page has none. */
  onPhoto: (() => void) | undefined;
}

export function Unsupported({ block, page, ask, onPhoto }: UnsupportedProps) {
  const t = useT();
  const why = block.reason
    ? t('capture.cannotReason', { reason: block.reason })
    : t('capture.cannotWhy');
  return (
    <div className={styles.cannot}>
      <span className={styles.cannotChip}>{t('capture.cannotImport')}</span>
      <BlockLines page={page} lines={block.lines} ask={ask} />
      <p className={styles.why}>{why}</p>
      {onPhoto && (
        <button type="button" className={styles.seePhoto} onClick={onPhoto}>
          {t('capture.seeOnPhoto')}
        </button>
      )}
    </div>
  );
}
