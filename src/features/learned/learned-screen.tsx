import { useCallback, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { LearnedGroup, LearnedKind } from '../../domain/services/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { ApplyLists } from './apply-lists.tsx';
import styles from './learned.module.css';
import { GroupSection } from './learned-groups.tsx';
import { useLearnedGroups } from './use-learned.ts';

const kinds = (t: Translate) =>
  [
    { value: 'kanji', label: t('learned.kindKanji') },
    { value: 'words', label: t('learned.kindWords') },
    { value: 'grammar', label: t('learned.kindGrammar') },
  ] as const satisfies readonly { value: LearnedKind; label: string }[];

const EMPTY = {
  kanji: 'learned.emptyKanji',
  words: 'learned.emptyWords',
  grammar: 'learned.emptyGrammar',
} as const satisfies Record<LearnedKind, string>;

interface GroupsProps {
  kind: LearnedKind;
  groups: LearnedGroup[];
  showAll: boolean;
}

/** The levels of one kind; one is open at a time, so at most a page of rows renders. */
function Groups({ kind, groups, showAll }: GroupsProps) {
  const t = useT();
  const visible = groups.filter((group) => group.total > 0);
  const [open, setOpen] = useState<LearnedGroup['level']>();
  if (visible.length === 0) return <p className={styles.muted}>{t(EMPTY[kind])}</p>;
  return (
    <div className={styles.groups}>
      {visible.map((group) => (
        <GroupSection
          key={group.level}
          {...{ kind, group, showAll }}
          open={open === group.level}
          onToggle={() => setOpen((at) => (at === group.level ? undefined : group.level))}
        />
      ))}
    </div>
  );
}

function ShowAll({ value, onChange }: { value: boolean; onChange: (on: boolean) => void }) {
  const t = useT();
  const id = useId();
  return (
    <label htmlFor={id} className={styles.toggle}>
      <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{t('learned.showNotStarted')}</span>
    </label>
  );
}

/** "What you've learned" (P3): kanji, words and grammar by JLPT level and state. */
export function LearnedScreen() {
  const t = useT();
  const _navigate = useNavigate();
  const [kind, setKind] = useState<LearnedKind>('kanji');
  const [showAll, setShowAll] = useState(false);
  const [version, setVersion] = useState(0);
  const groups = useLearnedGroups(kind, version);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const back = <BackButton parent={paths.learn} label={t('common.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('learned.heading')} />}>
      <p className={styles.intro}>{t('learned.intro')}</p>
      <div className={styles.controls}>
        <SegmentedControl
          label={t('learned.show')}
          options={kinds(t)}
          value={kind}
          onChange={setKind}
        />
        <ShowAll value={showAll} onChange={setShowAll} />
      </div>
      {groups ? (
        <Groups key={kind} kind={kind} groups={groups} showAll={showAll} />
      ) : (
        <p className={styles.muted}>{t('learned.counting')}</p>
      )}
      {kind === 'grammar' && (
        <p className={styles.hint}>
          <Link to={paths.grammarIndex}>{t('learned.allGrammar')}</Link>
        </p>
      )}
      <ApplyLists onApplied={reload} />
      <ListRow to={paths.units} detail={t('learned.unitsDetail')}>
        {t('learned.units')}
      </ListRow>
    </Screen>
  );
}
