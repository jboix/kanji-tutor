import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { type CopyMode, sessionLabel, sessionText } from './read-copy.ts';
import { CopyModeContext, SessionCopy, useCopyMode } from './session-copy.tsx';
import { SkipButton } from './skip-button.tsx';

const t = createTranslator('en', ENGLISH, ENGLISH);

function Skip({ mode }: { mode: CopyMode }) {
  return (
    <CopyModeContext value={mode}>
      <SkipButton onSkip={() => undefined} />
    </CopyModeContext>
  );
}

function ModeProbe() {
  const mode = useCopyMode();
  return (
    <CopyModeContext value={mode}>
      <p data-mode={mode}>
        <SessionCopy k="nextWord" />
      </p>
    </CopyModeContext>
  );
}

describe('session copy (M3)', () => {
  it('keeps today’s copy when native, shows both when mixed, Japanese with a subtitle otherwise', () => {
    expect(sessionLabel(t, 'skip', 'native')).toEqual({ main: "I don't know", ja: false });
    expect(sessionLabel(t, 'skip', 'mixed')).toEqual({
      main: '分からない',
      ja: true,
      after: "I don't know",
    });
    expect(sessionText(t, 'skip', 'mixed')).toBe("分からない · I don't know");
    expect(sessionLabel(t, 'skip', 'japanese')).toEqual({
      main: '分からない',
      ja: true,
      sub: "I don't know",
    });
    expect(sessionText(t, 'prompt', 'japanese')).toBe('読み方は？ (Type the reading)');
    expect(sessionText(t, 'prompt', 'native')).toBe('Type the reading');
  });

  it('renders the skip button in each mode, Japanese in Klee One', () => {
    const { rerender } = render(<Skip mode="native" />);
    expect(screen.getByRole('button').textContent).toBe("I don't know");
    rerender(<Skip mode="japanese" />);
    const button = screen.getByRole('button');
    expect(button.querySelector('[lang="ja"]')?.textContent).toBe('分からない');
    expect(button.textContent).toContain("I don't know");
    rerender(<Skip mode="mixed" />);
    const mixed = screen.getByRole('button');
    expect(mixed.textContent).toBe("分からない · I don't know");
    // Only the Japanese half is Japanese: the English is in the interface font (issue 57).
    expect(mixed.querySelector('[lang="ja"]')?.textContent).toBe('分からない');
  });

  it('follows the dial, and Auto at N5 stays native', async () => {
    const repos = createMemoryRepos();
    await repos.settings.patch({ immersion: 'japanese' });
    const { unmount } = renderWithServices(<ModeProbe />, { services: fakeServices({ repos }) });
    expect((await screen.findByText('次へ')).closest('p')?.dataset.mode).toBe('japanese');
    unmount();
    renderWithServices(<ModeProbe />, { services: fakeServices() });
    expect(await screen.findByText('Next word')).toBeTruthy();
  });
});
