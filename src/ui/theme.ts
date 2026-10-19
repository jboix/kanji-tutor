import type { ThemeMode } from '../domain/types.ts';

/** The localStorage key index.html reads the theme from; keep both in step. */
export const THEME_KEY = 'kanji-tutor-theme';

/** Applies the theme to the document: `system` follows the OS, otherwise forces light or dark. */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  // Mirrored for index.html, which reads it before the first paint (N1c).
  try {
    if (mode === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch {
    // Storage blocked: the launch screen follows the system theme.
  }
  if (mode === 'system') delete root.dataset.theme;
  else root.dataset.theme = mode;
}
