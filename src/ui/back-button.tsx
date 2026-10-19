import { type ReactNode, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { IconButton } from './icon-button.tsx';
import { BackIcon } from './icons.tsx';

/**
 * The app's first history entry: opened directly (key "default"), or a first entry since replaced,
 * as Start does when it hands over to the session (IA3). The browser router keeps the entry's
 * index in `history.state.idx`.
 */
function firstEntry(key: string): boolean {
  if (key === 'default') return true;
  const state: unknown = window.history.state;
  return typeof state === 'object' && state !== null && 'idx' in state && state.idx === 0;
}

/**
 * Back that follows the history (S1). With an earlier in-app entry it steps back to it; on a
 * page opened directly (the first entry, key "default") it replaces the page with its parent, so
 * back never pushes a new entry and never leaves the app.
 */
export function useBack(parent: string): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();
  return useCallback(() => {
    if (firstEntry(key)) void navigate(parent, { replace: true });
    else void navigate(-1);
  }, [key, navigate, parent]);
}

export interface BackButtonProps {
  /** Where back goes when the page was opened directly. */
  parent: string;
  label: string;
  className?: string | undefined;
  /** The icon; the back arrow by default (a session's close uses the cross). */
  children?: ReactNode;
}

/** The screen's back (or close) button, wired to `useBack`. */
export function BackButton({ parent, label, className, children }: BackButtonProps) {
  const back = useBack(parent);
  return (
    <IconButton aria-label={label} onClick={back} {...(className ? { className } : {})}>
      {children ?? <BackIcon />}
    </IconButton>
  );
}
