import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { entryById } from './grammar-data.ts';
import { GrammarPage } from './grammar-page.tsx';

/** A grammar point's page inside a sheet over a session (the `pagePeek` slot, R14). */
export function GrammarPeek({ id }: { id: string }) {
  const { rich } = useI18n();
  const entry = entryById(id);
  if (!entry) return <p>{rich('grammar.missing', { id: <Ja>{id}</Ja> })}</p>;
  return <GrammarPage entry={entry} />;
}
