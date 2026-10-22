import { localGrammar } from '../../domain/content-language.ts';
import type { GrammarEntry } from '../../domain/grammar/index.ts';
import { translationIn } from '../../domain/localized.ts';
import { EnMark } from '../../ui/en-mark.tsx';
import { SentenceSource } from '../../ui/external-link.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { PeekLink } from '../../ui/peek-link.tsx';
import type { SentenceWrapSlotProps } from '../../ui/slots.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { hardestGrammar, sentenceGrammar } from './grammar-line.ts';
import styles from './teach.module.css';

/** "Grammar: 〜てもいい · it is all right to (N4)", in the learner's language. */
function GrammarLine({ entry }: { entry: GrammarEntry }) {
  const { value: grammar, english } = localGrammar(useContentLanguage(), entry);
  const t = useT();
  return (
    <p className={styles.muted}>
      {t('teach.grammarLabel')}{' '}
      <PeekLink kind="grammar" id={grammar.id} label={grammar.pattern}>
        <Ja>{grammar.pattern}</Ja>
      </PeekLink>{' '}
      · {grammar.meaning} (N{grammar.level})
      <EnMark english={english} />
    </p>
  );
}

/**
 * After a sentence (L5): its translation, one line on its hardest grammar point from the
 * catalogue, and where the sentence came from (Tatoeba, R9). App data, not AI: plain ink, no seal.
 */
export function SentenceWrapUp({ sentence }: SentenceWrapSlotProps) {
  const { t, language } = useI18n();
  const { value: translation, fallback } = translationIn(sentence, language);
  const grammar = hardestGrammar(sentenceGrammar(sentence));
  const tatoeba = sentence.source === 'tatoeba' && sentence.sourceRef !== undefined;
  if (!translation && !grammar && !tatoeba) return null;
  return (
    <section className={styles.wrap} aria-label={t('teach.thisSentence')}>
      {translation && (
        <p className={styles.translation}>
          “{translation}”
          <EnMark english={fallback} />
        </p>
      )}
      {grammar && <GrammarLine entry={grammar} />}
      <SentenceSource source={sentence.source} sourceRef={sentence.sourceRef} />
    </section>
  );
}
