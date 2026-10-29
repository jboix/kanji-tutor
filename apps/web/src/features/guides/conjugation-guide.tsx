/** Any verb in every form (the conjugation table), and the keigo guide. */
import { type FormEvent, useState } from 'react';
import { FORM_LEVEL, type VerbForm } from '../../domain/conjugation/index.ts';
import {
  classOfExample,
  type Example,
  KEIGO_PATTERNS,
  KEIGO_SENTENCES,
  KEIGO_VERBS,
  TABLE_FORMS,
  TABLE_VERBS,
  verbIn,
  verbNamed,
} from '../../domain/guides/index.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { SearchIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { useServices } from '../../ui/services.tsx';
import { useKanaField } from '../../ui/use-kana-field.ts';
import { FormTable, GuideSection, JaCell } from './guide-parts.tsx';
import styles from './guides.module.css';

const FORM_LABEL: Partial<Record<VerbForm, PlainKey>> = {
  dict: 'guides.formDict',
  masu: 'guides.formMasu',
  nai: 'guides.formNai',
  ta: 'guides.formTa',
  nakatta: 'guides.formNakatta',
  te: 'guides.formTe',
  tai: 'guides.formTai',
  volitional: 'guides.formVolitional',
  potential: 'guides.formPotential',
  passive: 'guides.formPassive',
  causative: 'guides.formCausative',
  imperative: 'guides.formImperative',
  ba: 'guides.formBa',
  tara: 'guides.formTara',
};

/** 1, 2 or 3, as the verb groups guide numbers them. */
function groupOf(verb: Example): number {
  const cls = classOfExample(verb);
  if (cls === 'v1') return 2;
  return cls === 'vs' || cls === 'vk' ? 3 : 1;
}

function VerbTable({ verb }: { verb: Example }) {
  const t = useT();
  const rows = TABLE_FORMS.flatMap((form) => {
    const formed = verbIn(verb, form);
    const label = FORM_LABEL[form];
    if (!formed || !label) return [];
    const name = (
      <span key="name" className={styles.verb}>
        {t(label)}
        <span className={styles.level}>{t('guides.levelTag', { level: FORM_LEVEL[form] })}</span>
      </span>
    );
    return [{ key: form, cells: [name, <JaCell key="form" {...formed} />] }];
  });
  return (
    <FormTable
      label={`${verb.written} · ${t('guides.groupOf', { n: groupOf(verb) })}`}
      head={[t('guides.groupOf', { n: groupOf(verb) }), <Ja key="verb">{verb.written}</Ja>]}
      rows={rows}
    />
  );
}

/** A verb typed in its dictionary form, looked up in the dictionary. */
function VerbField({ onVerb }: { onVerb: (verb: Example | undefined, text: string) => void }) {
  const t = useT();
  const { repos } = useServices();
  const { final, setValue: _set, ...field } = useKanaField(true);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = final().trim();
    if (text) void verbNamed(repos.dictionary, text).then((verb) => onVerb(verb, text));
  };
  return (
    <form className={styles.field} onSubmit={submit}>
      <SearchIcon />
      <input
        type="search"
        aria-label={t('guides.typeVerb')}
        lang="ja"
        className={styles.input}
        placeholder={t('guides.typeVerbPlaceholder')}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        {...field}
      />
    </form>
  );
}

export function ConjugationGuide() {
  const t = useT();
  const [verb, setVerb] = useState<Example>(TABLE_VERBS[0] as Example);
  const [missing, setMissing] = useState<string>();
  const typed = (found: Example | undefined, text: string) => {
    setMissing(found ? undefined : text);
    if (found) setVerb(found);
  };
  return (
    <>
      <GuideSection title={t('guides.pickVerb')}>
        <ChipRow>
          {TABLE_VERBS.map((each) => (
            <Chip
              key={each.written}
              lang="ja"
              aria-pressed={each.written === verb.written}
              onClick={() => setVerb(each)}
            >
              {each.written}
            </Chip>
          ))}
        </ChipRow>
        <VerbField onVerb={typed} />
        {missing !== undefined && (
          <p className={styles.meta} role="status">
            <JaRuns text={t('guides.notAVerb', { text: missing })} />
          </p>
        )}
      </GuideSection>
      <VerbTable key={verb.written} verb={verb} />
    </>
  );
}

/** 食べる・飲む: a narrow cell breaks the line after the ・, not inside a verb. */
function Pair({ text }: { text: string }) {
  const verbs = text.split('・');
  return (
    <span lang="ja" className={styles.ja}>
      <span className={styles.split}>
        {verbs.map((verb, i) => (
          <span key={verb}>
            {i > 0 && <wbr />}
            <span className={styles.part}>{i < verbs.length - 1 ? `${verb}・` : verb}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

function KeigoVerbs() {
  const t = useT();
  const cell = (example: Example | undefined) =>
    example ? <JaCell written={example.written} reading={example.reading} /> : '—';
  return (
    <FormTable
      label={t('guides.verbsTitle')}
      head={[
        t('guides.colVerb'),
        `${t('guides.colSonkei')} 尊敬語`,
        `${t('guides.colKenjou')} 謙譲語`,
      ]}
      rows={KEIGO_VERBS.map((verb) => ({
        key: verb.plain,
        cells: [<Pair key="plain" text={verb.plain} />, cell(verb.sonkei), cell(verb.kenjou)],
      }))}
    />
  );
}

const PATTERN_TEXT = {
  oNiNaru: 'guides.patternoNiNaru',
  reru: 'guides.patternreru',
  oSuru: 'guides.patternoSuru',
  goSuru: 'guides.patterngoSuru',
} as const satisfies Record<(typeof KEIGO_PATTERNS)[number]['id'], PlainKey>;

const SENTENCE_TEXT = {
  irassharu: 'guides.sentenceirassharu',
  oKaeri: 'guides.sentenceoKaeri',
  okuri: 'guides.sentenceokuri',
  moushimasu: 'guides.sentencemoushimasu',
} as const satisfies Record<(typeof KEIGO_SENTENCES)[number]['id'], PlainKey>;

export function KeigoGuide() {
  const t = useT();
  return (
    <>
      <GuideSection title={t('guides.verbsTitle')} text={t('guides.verbsText')}>
        <KeigoVerbs />
      </GuideSection>
      <GuideSection title={t('guides.patternsTitle')} text={t('guides.patternsText')}>
        {KEIGO_PATTERNS.map((pattern) => (
          <p key={pattern.id} className={styles.example}>
            <span lang="ja" className={styles.exampleJa}>
              {pattern.shape}
            </span>
            <span lang="ja" className={styles.patternExample}>
              {pattern.example}
            </span>
            <span className={styles.meta}>{t(PATTERN_TEXT[pattern.id])}</span>
          </p>
        ))}
      </GuideSection>
      <GuideSection title={t('guides.sentencesTitle')}>
        {KEIGO_SENTENCES.map((sentence) => (
          <p key={sentence.id} className={styles.example}>
            <span lang="ja" className={styles.exampleJa}>
              {sentence.ja}
            </span>
            <span className={styles.meta}>{t(SENTENCE_TEXT[sentence.id])}</span>
          </p>
        ))}
      </GuideSection>
    </>
  );
}
