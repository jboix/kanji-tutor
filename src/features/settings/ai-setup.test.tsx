import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../domain/defaults.ts';
import type { Settings } from '../../domain/types.ts';
import { renderWithServices } from '../../test/render.tsx';
import { AiSetup } from './ai-setup.tsx';

const testKey = vi.hoisted(() => vi.fn());
vi.mock('../../ai/index.ts', async (original) => ({
  ...(await original<typeof import('../../ai/index.ts')>()),
  testKey,
}));

const saved: Partial<Settings>[] = [];

function Harness() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const onPatch = async (patch: Partial<Settings>) => {
    saved.push(patch);
    setSettings((current) => ({ ...current, ...patch }));
  };
  return <AiSetup settings={settings} onPatch={onPatch} />;
}

describe('AiSetup, the wizard key step (P6)', () => {
  beforeEach(() => {
    saved.length = 0;
    testKey.mockReset();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('saves a typed key once Test key says it works', async () => {
    testKey.mockResolvedValue({
      ok: true,
      value: { model: 'gemini-3.5-flash-lite' },
      cached: false,
    });
    renderWithServices(<Harness />);
    await userEvent.type(screen.getByLabelText('API key'), 'AIza-typed-key');
    await userEvent.click(screen.getByRole('button', { name: /^Test key, / }));
    expect(await screen.findByText('Key saved.')).toBeTruthy();
    expect(testKey).toHaveBeenCalledWith('AIza-typed-key', 'gemini-3.5-flash-lite');
    expect(saved).toEqual([{ apiKey: 'AIza-typed-key' }]);
    expect(screen.getByText('Key works with gemini-3.5-flash-lite.')).toBeTruthy();
  });

  it('keeps a key that did not work out of storage', async () => {
    testKey.mockResolvedValue({
      ok: false,
      error: { kind: 'provider', message: 'Gemini refused the request (400).' },
    });
    renderWithServices(<Harness />);
    await userEvent.type(screen.getByLabelText('API key'), 'AIza-wrong-key');
    await userEvent.click(screen.getByRole('button', { name: /^Test key, / }));
    expect((await screen.findByRole('status')).textContent).toMatch(/^Invalid key/);
    expect(saved).toEqual([]);
  });

  it('folds the model pickers under Advanced, both on the Flash-Lite default', async () => {
    renderWithServices(<Harness />);
    expect(screen.queryByText('How to get a key')).toBeNull();
    await userEvent.click(screen.getByText('Advanced: models'));
    expect(screen.getByLabelText('Fast model')).toHaveProperty('value', 'gemini-3.5-flash-lite');
    expect(screen.getByLabelText('Teacher model')).toHaveProperty('value', 'gemini-3.5-flash-lite');
  });
});
