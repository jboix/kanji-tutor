import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

afterEach(() => vi.unstubAllGlobals());

async function turnOn() {
  const repos = createMemoryRepos({ settings: { apiKey: 'secret-key' } });
  renderSettingsSection('about', { services: fakeServices({ repos }) });
  await userEvent.click(await screen.findByRole('button', { name: 'Turn on developer mode' }));
  await waitFor(async () => expect((await repos.settings.get()).developerMode).toBe(true));
  return repos;
}

describe('About → Developer mode', () => {
  it('is off until turned on, then copies diagnostics without the key', async () => {
    const writeText = vi.fn(async (_: string) => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    expect(await turnOn()).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Copy diagnostics' }));
    expect(await screen.findByText('Copied. Paste it into your message.')).toBeTruthy();
    const text = writeText.mock.calls[0]?.[0] ?? '';
    expect(text).toContain('Kanji Tutor diagnostics');
    expect(text).toContain('key set');
    expect(text).not.toContain('secret-key');
  });

  it('says so when the browser will not copy, and saves the file instead', async () => {
    const writeText = vi.fn(async () => Promise.reject(new Error('denied')));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const createObjectURL = vi.fn((_: Blob) => 'blob:x');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = () => undefined;
    await turnOn();
    await userEvent.click(screen.getByRole('button', { name: 'Copy diagnostics' }));
    expect(await screen.findByText(/would not copy/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Save diagnostics file' }));
    expect(await screen.findByText('Saved to your downloads.')).toBeTruthy();
    const saved = createObjectURL.mock.calls[0]?.[0] ?? new Blob();
    const file = await saved.text();
    expect(JSON.parse(file)).toMatchObject({ app: 'kanji-tutor-diagnostics', replies: [] });
    expect(file).not.toContain('secret-key');
  });

  it('turns off again, hiding the diagnostics', async () => {
    const repos = await turnOn();
    const off = screen.getByRole('button', { name: 'Turn off developer mode' });
    expect(off.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(off);
    await waitFor(async () => expect((await repos.settings.get()).developerMode).toBe(false));
    const about = screen.getByRole('main');
    expect(within(about).queryByRole('button', { name: 'Copy diagnostics' })).toBeNull();
  });
});
