import { createContext, type ReactNode, use, useState } from 'react';
import { Link } from 'react-router';
import { BottomSheet } from './bottom-sheet.tsx';
import { paths } from './paths.ts';
import { useSlot } from './slots.tsx';

/** True inside a session: page links open in a sheet instead of leaving it (R14). */
const PeekContext = createContext(false);

export function PeekProvider({ children }: { children: ReactNode }) {
  return <PeekContext value>{children}</PeekContext>;
}

/** Inside a session, where a page opens in a sheet and starting another session would nest one. */
export function useInSession(): boolean {
  return use(PeekContext);
}

export interface PeekLinkProps {
  kind: 'grammar' | 'kanji';
  /** The grammar id or the kanji. */
  id: string;
  /** The sheet's name, e.g. the pattern or the kanji. */
  label: string;
  className?: string | undefined;
  lang?: string | undefined;
  children: ReactNode;
}

function href(kind: PeekLinkProps['kind'], id: string): string {
  return kind === 'grammar' ? paths.grammar(id) : paths.kanjiDetail(id);
}

/**
 * A link to a grammar or kanji page. Inside a session it opens the page in a sheet, so closing
 * it returns to the exercise as it was; elsewhere it is a plain link.
 */
export function PeekLink({ kind, id, label, className, lang, children }: PeekLinkProps) {
  const peek = use(PeekContext);
  const Page = useSlot('pagePeek');
  const [open, setOpen] = useState(false);
  const attrs = { ...(className ? { className } : {}), ...(lang ? { lang } : {}) };
  if (!peek || !Page) {
    return (
      <Link to={href(kind, id)} {...attrs}>
        {children}
      </Link>
    );
  }
  return (
    <>
      <a
        href={href(kind, id)}
        {...attrs}
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>
      <BottomSheet open={open} onClose={() => setOpen(false)} label={label}>
        <Page kind={kind} id={id} />
      </BottomSheet>
    </>
  );
}
