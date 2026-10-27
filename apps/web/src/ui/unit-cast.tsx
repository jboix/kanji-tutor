/**
 * The cast a unit meets, as portraits and their names ("Yuki and Ken"), for Next up and the unit
 * page. Nothing while it loads, or for a unit whose dialogues have no one from the cast.
 */
import { useEffect, useState } from 'react';
import type { CastMember } from '../domain/cast.ts';
import { unitCast } from '../domain/services/index.ts';
import type { Unit } from '../domain/themes/types.ts';
import styles from './cast-portrait.module.css';
import { CastStack } from './cast-portrait.tsx';
import { useI18n } from './i18n/i18n.tsx';

function useUnitCast(unit: Pick<Unit, 'id' | 'grammar'>): CastMember[] {
  const [cast, setCast] = useState<CastMember[]>([]);
  useEffect(() => {
    let live = true;
    unitCast(unit).then(
      (found) => live && setCast(found),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [unit]);
  return cast;
}

/** "Yuki and Ken", "Yuki, Ken and Mori-san", in the interface language. */
export function castNames(cast: readonly CastMember[], language: string): string {
  const list = new Intl.ListFormat(language, { type: 'conjunction' });
  return list.format(cast.map((member) => member.name));
}

/** Portraits then names; `lead` sets the names in a line, e.g. "Unit 4 · with Yuki and Ken". */
export function UnitCast(props: {
  unit: Pick<Unit, 'id' | 'grammar'>;
  size?: number;
  lead?: (names: string) => string;
}) {
  const { language } = useI18n();
  const cast = useUnitCast(props.unit);
  if (cast.length === 0) return null;
  const names = castNames(cast, language);
  return (
    <span className={styles.named}>
      <CastStack who={cast.map((member) => member.id)} size={props.size ?? 28} />
      <span>{props.lead ? props.lead(names) : names}</span>
    </span>
  );
}
