import { EnMark } from '../../ui/en-mark.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import styles from './grammar.module.css';
import type { Example, Examples } from './use-grammar.ts';

function Translation({ example }: { example: Example }) {
  const t = useT();
  if (!example.translation) return null;
  return (
    <p className={styles.translation}>
      {t('grammar.quoted', { text: example.translation })}
      <EnMark english={example.english} />
    </p>
  );
}

/**
 * Example sentences on ruled rows, the grammar span underlined in ink, their words tappable, and
 * their translations. Static content: no card, tint or seal, so nothing here looks like the tutor
 * (A18). A sentence the tutor wrote keeps its own mark, from `RuledSentence`.
 */
export function ExampleList({ examples }: { examples: readonly Example[] }) {
  return (
    <ul className={styles.examples}>
      {examples.map((example) => (
        <li key={example.sentence.id} className={styles.example}>
          <TapSentence
            sentence={example.sentence}
            size="callout"
            ruled={false}
            target={example.span}
          />
          <Translation example={example} />
        </li>
      ))}
    </ul>
  );
}

function Note({ loaded, level }: { loaded: Examples; level: number }) {
  const t = useT();
  if (loaded.examples.length === 0) {
    return <p className={styles.meta}>{t('grammar.noExamples')}</p>;
  }
  if (!loaded.aboveLevel) return null;
  return <p className={styles.meta}>{t('grammar.aboveLevel', { level })}</p>;
}

/** "Where you'll see it" (G4): pack sentences, tap a word for the word sheet. */
export function WhereYoullSeeIt({
  loaded,
  level,
}: {
  loaded: Examples | undefined;
  level: number;
}) {
  const t = useT();
  if (!loaded) return <p className={styles.meta}>{t('grammar.findingExamples')}</p>;
  return (
    <>
      <Note loaded={loaded} level={level} />
      <ExampleList examples={loaded.examples} />
    </>
  );
}
