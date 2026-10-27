import { useCallback, useMemo, useState } from 'react';
import type { AiClient, SentenceExplanation } from '../../ai/types.ts';
import { localGrammar } from '../../domain/content-language.ts';
import type { GrammarEntry } from '../../domain/grammar/index.ts';
import { translationIn } from '../../domain/localized.ts';
import { answerSpan, hiddenTargets } from '../../domain/services/index.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { AiBlock, AiWriting } from '../../ui/ai-block.tsx';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { Chip } from '../../ui/chip.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { knownFurigana, useAllFurigana } from '../../ui/furigana-mode.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { PeekLink } from '../../ui/peek-link.tsx';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import type { SentenceHelpSlotProps } from '../../ui/slots.tsx';
import { useAiResult } from '../../ui/use-ai-result.ts';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { sentenceGrammar } from './grammar-line.ts';
import { ImmersionFooter, JaProse, OffLanguage, TutorProblem, Unconfirmed } from './ja-prose.tsx';
import { explainInput } from './sentence-input.ts';
import styles from './teach.module.css';

/** The catalogue's notes on the grammar found in the sentence: app data, no seal. */
function CatalogueGrammar({ entries: source }: { entries: readonly GrammarEntry[] }) {
  const t = useT();
  const lookup = useContentLanguage();
  const entries = source.map((entry) => localGrammar(lookup, entry));
  if (entries.length === 0) {
    return <p className={styles.muted}>{t('teach.noGrammar')}</p>;
  }
  return (
    <ul className={styles.grammarList}>
      {entries.map(({ value: entry, english }) => (
        <li key={entry.id}>
          <p className={styles.meaning}>
            <PeekLink
              kind="grammar"
              id={entry.id}
              label={entry.pattern}
              className={styles.pattern}
              lang="ja"
            >
              {entry.pattern}
            </PeekLink>{' '}
            · {entry.meaning} (N{entry.level})
            <EnMark english={english} />
          </p>
          <p className={styles.muted}>{entry.explanation}</p>
        </li>
      ))}
    </ul>
  );
}

function TutorNote({ value, offLanguage }: { value: SentenceExplanation; offLanguage: boolean }) {
  const t = useT();
  return (
    <AiBlock
      label={t('teach.tutorOnSentence')}
      size="sm"
      readings={value.readings}
      hidden={value.redacted}
      offLanguage={offLanguage}
    >
      <p className={styles.para}>
        <JaProse text={value.meaning} immersion={value.immersion} />
      </p>
      {value.grammar.map((note) => (
        <p key={note.pattern} className={styles.para}>
          <Ja>{note.pattern}</Ja>: <JaProse text={note.note} immersion={value.immersion} />
        </p>
      ))}
      <ImmersionFooter immersion={value.immersion} />
      {value.redacted && <p className={styles.muted}>{t('teach.readingHidden')}</p>}
      <Unconfirmed readings={value.readings} />
      <OffLanguage off={offLanguage} />
    </AiBlock>
  );
}

interface TutorProps extends SentenceHelpSlotProps {
  translation: string | undefined;
  grammar: readonly GrammarEntry[];
}

/** The tutor's explanation, every reading still to answer removed (L3); runs once asked. */
function TutorExplanation(props: TutorProps & { client: AiClient }) {
  const { card, step, translation, grammar, client, blank } = props;
  const { repos } = useServices();
  const t = useT();
  const run = useCallback(async () => {
    const hidden = await hiddenTargets(repos, card, step);
    return client.explainSentence(explainInput(card, translation, grammar, hidden, blank));
  }, [client, repos, card, step, translation, grammar, blank]);
  const state = useAiResult(run);
  if (state.status === 'loading') {
    return <AiWriting>{t('teach.lookingAtSentence')}</AiWriting>;
  }
  if (state.status === 'error') return <TutorProblem error={state.error} onRetry={state.retry} />;
  return <TutorNote value={state.value} offLanguage={state.offLanguage} />;
}

function AskTutor(props: TutorProps) {
  const t = useT();
  const { repos } = useServices();
  const [client, setClient] = useState<AiClient>();
  const { card, step, translation, grammar, blank } = props;
  const peek = useCallback(
    async (c: AiClient) => {
      const hidden = await hiddenTargets(repos, card, step);
      return c.peek('explainSentence', explainInput(card, translation, grammar, hidden, blank));
    },
    [repos, card, step, translation, grammar, blank],
  );
  if (client) return <TutorExplanation {...props} client={client} />;
  return (
    <div className={styles.ask}>
      <AiAction label={t('teach.askTutor')} run={setClient} peek={peek} />
    </div>
  );
}

/** The sentence above the sheet; with ふ on, furigana but on the targets still to come (R12). */
function HelpContext({ card, step }: SentenceHelpSlotProps) {
  const all = useAllFurigana();
  const { sentence } = card;
  const shut = new Set(card.targets.slice(step).flatMap((t) => answerSpan(sentence, t.tokenIndex)));
  const furigana = all ? knownFurigana(sentence.tokens, (i) => shut.has(i)) : [];
  return <RuledSentence sentence={sentence} size="context" furigana={furigana} />;
}

function HelpSheet(props: SentenceHelpSlotProps & { onClose: () => void }) {
  const { t, language } = useI18n();
  const { value: translation, fallback } = translationIn(props.card.sentence, language);
  const grammar = useMemo(() => sentenceGrammar(props.card.sentence), [props.card.sentence]);
  return (
    <BottomSheet
      open
      onClose={props.onClose}
      label={t('teach.aboutSentence')}
      context={<HelpContext card={props.card} step={props.step} />}
    >
      <div className={styles.card}>
        {translation && (
          <section className={styles.section} aria-label={t('teach.whatItSays')}>
            <SectionLabel>{t('teach.whatItSays')}</SectionLabel>
            <p className={styles.translation}>
              “{translation}”
              <EnMark english={fallback} />
            </p>
          </section>
        )}
        <section className={styles.section} aria-label={t('teach.grammarInIt')}>
          <SectionLabel>{t('teach.grammarInIt')}</SectionLabel>
          <CatalogueGrammar entries={grammar} />
        </section>
        <AskTutor
          card={props.card}
          step={props.step}
          blank={props.blank}
          translation={translation}
          grammar={grammar}
        />
      </div>
    </BottomSheet>
  );
}

/**
 * "Explain this sentence" before answering (L3): the translation and the catalogue's grammar
 * notes first (offline too); the tutor's explanation, every reading still to answer removed, only
 * after "Ask the tutor" (AI only when asked).
 */
export function SentenceHelp(props: SentenceHelpSlotProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.help}>
      <Chip onClick={() => setOpen(true)}>{t('teach.explainSentence')}</Chip>
      {open && <HelpSheet {...props} onClose={() => setOpen(false)} />}
    </div>
  );
}
