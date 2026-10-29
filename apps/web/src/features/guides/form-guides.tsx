/** The て-form's sound changes, and the adjectives' forms. */
import {
  ADJECTIVE_ROWS,
  type AdjectiveRow,
  type Example,
  I_ADJECTIVES,
  iAdjectiveIn,
  NA_ADJECTIVE,
  naAdjectiveIn,
  TE_OTHERS,
  TE_RULES,
  verbIn,
} from '../../domain/guides/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { FormTable, GuideSection, JaCell } from './guide-parts.tsx';
import styles from './guides.module.css';

/** "買う → 買って", the reading under. */
function Change({ verb, form }: { verb: Example; form: 'te' | 'ta' }) {
  const formed = verbIn(verb, form);
  if (!formed) return null;
  return <JaCell written={`${verb.written} → ${formed.written}`} reading={formed.reading} />;
}

function Ending({ text }: { text: string }) {
  return (
    <span lang="ja" className={`${styles.ja} ${styles.ending}`}>
      {text}
    </span>
  );
}

/** Group 1's rows: the endings, what て and た become, examples. */
function RulesTable() {
  const t = useT();
  return (
    <FormTable
      label={t('guides.rulesTitle')}
      head={['〜', 'て', 'た', '']}
      rows={TE_RULES.map((rule) => ({
        key: rule.te,
        cells: [
          <JaCell key="end" written={rule.endings.join('・')} />,
          <Ending key="te" text={rule.te} />,
          <Ending key="ta" text={rule.ta} />,
          <span key="ex" className={styles.verb}>
            {rule.examples.map((verb) => (
              <Change key={verb.written} verb={verb} form="te" />
            ))}
          </span>,
        ],
      }))}
    />
  );
}

export function TeFormGuide() {
  const t = useT();
  return (
    <>
      <GuideSection title={t('guides.rulesTitle')} text={t('guides.rulesText')}>
        <RulesTable />
      </GuideSection>
      <GuideSection title={t('guides.othersTitle')} text={t('guides.othersText')}>
        <FormTable
          label={t('guides.othersTitle')}
          head={[t('guides.colDict'), 'て', 'た']}
          rows={TE_OTHERS.map((verb) => ({
            key: verb.written,
            cells: [
              <JaCell key="dict" written={verb.written} reading={verb.reading} />,
              <JaCell key="te" {...(verbIn(verb, 'te') ?? { written: '' })} />,
              <JaCell key="ta" {...(verbIn(verb, 'ta') ?? { written: '' })} />,
            ],
          }))}
        />
      </GuideSection>
    </>
  );
}

const ROW_LABEL: Record<AdjectiveRow, PlainKey> = {
  present: 'guides.rowPresent',
  negative: 'guides.rowNegative',
  past: 'guides.rowPast',
  negativePast: 'guides.rowNegativePast',
  te: 'guides.rowTe',
};

/** What a form shares with the dictionary form: 高 of 高い and 高くない, 静か of 静かだ. */
function stemOf(form: string, dict: string): string {
  let i = 0;
  while (i < form.length && form[i] === dict[i]) i++;
  return form.slice(0, i);
}

function AdjectiveTable({
  label,
  dict,
  forms,
}: {
  label: string;
  dict: Example;
  forms: (row: AdjectiveRow) => readonly [string, string];
}) {
  const t = useT();
  return (
    <FormTable
      label={label}
      head={[t('guides.colPlain'), t('guides.colPolite')]}
      rows={ADJECTIVE_ROWS.map((row) => {
        const [plain, polite] = forms(row);
        const stemBase = dict.written.replace(/い$/u, '');
        return {
          key: row,
          cells: [
            // The row's name over its plain form: two columns fit a phone's width.
            <span key="plain" className={styles.verb}>
              <span className={styles.level}>{t(ROW_LABEL[row])}</span>
              <JaCell written={plain} stem={stemOf(plain, stemBase)} />
            </span>,
            <JaCell key="polite" written={polite} stem={stemOf(polite, stemBase)} />,
          ],
        };
      })}
    />
  );
}

export function AdjectivesGuide() {
  const t = useT();
  return (
    <>
      <GuideSection title={t('guides.iTitle')} text={t('guides.iText')}>
        {I_ADJECTIVES.map((adjective) => (
          <AdjectiveTable
            key={adjective.written}
            label={`${t('guides.iTitle')} · ${adjective.written}`}
            dict={adjective}
            forms={(row) => iAdjectiveIn(adjective, row)}
          />
        ))}
      </GuideSection>
      <GuideSection title={t('guides.naTitle')} text={t('guides.naText')}>
        <AdjectiveTable
          label={`${t('guides.naTitle')} · ${NA_ADJECTIVE.written}`}
          dict={NA_ADJECTIVE}
          forms={(row) => naAdjectiveIn(NA_ADJECTIVE, row)}
        />
      </GuideSection>
    </>
  );
}
