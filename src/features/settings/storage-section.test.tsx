import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFormats } from '../../ui/i18n/format.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { es } from '../../ui/i18n/messages/es/index.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { formatBytes as bytesIn, usageText as usageIn } from './storage-format.ts';
import { StorageSection } from './storage-section.tsx';

const t = createTranslator('en', ENGLISH, ENGLISH);
const format = createFormats('en');
const formatBytes = (bytes: number) => bytesIn(bytes, t, format);
const usageText = (estimate: { usage?: number; quota?: number }) => usageIn(estimate, t, format);

describe('storage (N5)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('formats sizes plainly', () => {
    expect(formatBytes(420)).toBe('1 KB');
    expect(formatBytes(840_000)).toBe('840 KB');
    expect(formatBytes(12_400_000)).toBe('12.4 MB');
    expect(formatBytes(2_100_000_000)).toBe('2.1 GB');
    expect(usageText({})).toBeUndefined();
    expect(usageText({ usage: 5_000_000 })).toBe('Using 5.0 MB on this device.');
  });

  it('formats sizes in the learner language', () => {
    const spanish = createTranslator('es', es, ENGLISH);
    expect(bytesIn(12_400_000, spanish, createFormats('es'))).toBe('12,4 MB');
  });

  it('shows persistence and usage, and offers to ask when not persistent', async () => {
    const storage = {
      persisted: async () => false,
      persist: async () => true,
      estimate: async () => ({ usage: 12_400_000, quota: 2_100_000_000 }),
    };
    vi.stubGlobal('navigator', { ...navigator, storage });
    render(<StorageSection />);
    expect(
      await screen.findByText('Using 12.4 MB of about 2.1 GB this device allows the app.'),
    ).toBeTruthy();
    screen.getByRole('button', { name: 'Ask to keep data' }).click();
    expect(await screen.findByText('Persistent: the browser will keep your data.')).toBeTruthy();
  });
});
