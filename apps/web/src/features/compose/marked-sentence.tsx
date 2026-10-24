/** The learner's sentence with the red pen on it: insertions, replacements, deletions, style. */
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { Insertion } from '../../ui/ruby.tsx';
import styles from './compose.module.css';
import type { Segment } from './mark-segments.ts';

function SegmentView({ segment }: { segment: Segment }) {
  const t = useT();
  switch (segment.kind) {
    case 'plain':
      return segment.text;
    case 'insert':
      return <Insertion text={segment.insert} />;
    case 'style':
      return <span className={styles.wavy}>{segment.text}</span>;
    case 'delete':
      return <del className={styles.struck}>{segment.text}</del>;
    case 'replace':
      return (
        <ruby className={styles.ruby}>
          <del className={styles.struck}>{segment.text}</del>
          <rt className={styles.fix}>
            <span className="visually-hidden">{t('compose.instead')}</span>
            {segment.insert}
          </rt>
        </ruby>
      );
  }
}

/** The learner's sentence with the red pen on it (compose.html). */
export function MarkedSentence(props: {
  segments: readonly Segment[];
  className?: string | undefined;
}) {
  const { segments } = props;
  return (
    <p lang="ja" className={cx(styles.sentence, props.className)}>
      {segments.map((segment) => (
        <SegmentView key={`${segment.kind}${segment.start}`} segment={segment} />
      ))}
    </p>
  );
}
