/** The verb groups, and plain beside polite: tables worked out by the conjugation engine. */
import {
  type Example,
  LOOKALIKE_GODAN,
  PLAIN_POLITE,
  VERB_GROUPS,
  verbIn,
} from '../../domain/guides/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { FormTable, GuideSection, JaCell } from './guide-parts.tsx';
import styles from './guides.module.css';

function Formed({ verb, form }: { verb: Example; form: Parameters<typeof verbIn>[1] }) {
  const formed = verbIn(verb, form);
  return formed ? <JaCell written={formed.written} reading={formed.reading} /> : null;
}

/** Each verb in its dictionary, ます and ない forms. */
function GroupTable({ verbs, label }: { verbs: readonly Example[]; label: string }) {
  const t = useT();
  return (
    <FormTable
      label={label}
      head={[t('guides.colDict'), t('guides.colMasu'), t('guides.colNai')]}
      rows={verbs.map((verb) => ({
        key: verb.written,
        cells: [
          <JaCell key="dict" written={verb.written} reading={verb.reading} />,
          <Formed key="masu" verb={verb} form="masu" />,
          <Formed key="nai" verb={verb} form="nai" />,
        ],
      }))}
    />
  );
}

export function VerbGroupsGuide() {
  const t = useT();
  const groups = [
    { key: 'godan', title: t('guides.godanTitle'), text: t('guides.godanText') },
    { key: 'ichidan', title: t('guides.ichidanTitle'), text: t('guides.ichidanText') },
    { key: 'irregular', title: t('guides.irregularTitle'), text: t('guides.irregularText') },
  ] as const;
  return (
    <>
      {groups.map((group) => (
        <GuideSection key={group.key} title={group.title} text={group.text}>
          <GroupTable verbs={VERB_GROUPS[group.key]} label={group.title} />
        </GuideSection>
      ))}
      <GuideSection title={t('guides.tellTitle')} text={t('guides.tellText')}>
        <div className={styles.chips}>
          {LOOKALIKE_GODAN.map((verb) => (
            <JaCell key={verb.written} written={verb.written} reading={verb.reading} />
          ))}
        </div>
      </GuideSection>
    </>
  );
}

const PAIR_VERBS: readonly Example[] = [VERB_GROUPS.godan[0], VERB_GROUPS.ichidan[0]];

export function PlainPoliteGuide() {
  const t = useT();
  return (
    <>
      <GuideSection title={t('guides.pairsTitle')} text={t('guides.pairsText')}>
        {PAIR_VERBS.map((verb) => (
          <FormTable
            key={verb.written}
            label={`${t('guides.pairsTitle')} · ${verb.written}`}
            head={[t('guides.colPlain'), t('guides.colPolite')]}
            rows={PLAIN_POLITE.map(([plain, polite]) => ({
              key: plain,
              cells: [
                <Formed key="plain" verb={verb} form={plain} />,
                <Formed key="polite" verb={verb} form={polite} />,
              ],
            }))}
          />
        ))}
      </GuideSection>
      <GuideSection title={t('guides.whenTitle')} text={t('guides.whenText')} />
    </>
  );
}
