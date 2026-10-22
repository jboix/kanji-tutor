import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '../../domain/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

const testKey = vi.hoisted(() => vi.fn());
vi.mock('../../ai/index.ts', async (original) => ({
  ...(await original<typeof import('../../ai/index.ts')>()),
  testKey,
}));

function setup(settings: Partial<Settings> = {}) {
  const repos = createMemoryRepos({ settings });
  renderSettingsSection('tutor', { services: fakeServices({ repos }) });
  return repos;
}

const online = (value: boolean) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);

describe('Gemini key (N3)', () => {
  beforeEach(() => {
    testKey.mockReset();
    online(true);
  });
  afterEach(() => vi.restoreAllMocks());

  it('saves the key without echoing it in the page text', async () => {
    const repos = setup();
    const field = await screen.findByLabelText('API key');
    expect(field.getAttribute('type')).toBe('password');
    await userEvent.type(field, 'AIza-secret');
    const section = screen.getByRole('region', { name: 'Gemini API key' });
    await userEvent.click(within(section).getByRole('button', { name: 'Save' }));
    expect((await repos.settings.get()).apiKey).toBe('AIza-secret');
    expect(await screen.findByText('Key saved.')).toBeTruthy();
    // The field keeps the saved key, masked, and Save has nothing new to save.
    expect(field).toHaveProperty('value', 'AIza-secret');
    expect(field.getAttribute('type')).toBe('password');
    expect(within(section).getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
    expect(document.body.textContent).not.toContain('AIza-secret');
  });

  it('tests the saved key with the chosen model', async () => {
    testKey.mockResolvedValue({ ok: true, value: { model: 'gemini-2.5-flash' }, cached: false });
    setup({ apiKey: 'AIza-secret', modelId: 'gemini-2.5-flash' });
    await userEvent.click(await screen.findByRole('button', { name: /^Test key, / }));
    expect(testKey).toHaveBeenCalledWith('AIza-secret', 'gemini-2.5-flash');
    expect((await screen.findByRole('status')).textContent).toBe(
      'Key works with gemini-2.5-flash.',
    );
  });

  it('disables the button while the test runs', async () => {
    let finish: (value: unknown) => void = () => undefined;
    testKey.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    setup({ apiKey: 'k' });
    const button = await screen.findByRole('button', { name: /^Test key, / });
    await userEvent.click(button);
    expect(button).toHaveProperty('disabled', true);
    expect(screen.getByRole('status').textContent).toBe('Testing the key…');
    finish({ ok: true, value: { model: 'm' }, cached: false });
    await waitFor(() => expect(button).toHaveProperty('disabled', false));
  });

  it('maps a provider error and never shows the key in it', async () => {
    const error = { kind: 'provider', message: 'API key AIza-secret not valid.' };
    testKey.mockResolvedValue({ ok: false, error });
    setup({ apiKey: 'AIza-secret' });
    await userEvent.click(await screen.findByRole('button', { name: /^Test key, / }));
    const status = await screen.findByRole('status');
    expect(status.textContent).toBe(
      'Invalid key: Google did not accept it. Check that you copied all of it. (API key … not valid.)',
    );
  });

  it('says so when a test call throws', async () => {
    testKey.mockRejectedValue(new Error('network down'));
    setup({ apiKey: 'k' });
    await userEvent.click(await screen.findByRole('button', { name: /^Test key, / }));
    expect((await screen.findByRole('status')).textContent).toBe(
      "Couldn't test the key: network down",
    );
  });

  it("says you're offline without calling", async () => {
    online(false);
    setup({ apiKey: 'k' });
    await userEvent.click(await screen.findByRole('button', { name: /^Test key, / }));
    expect((await screen.findByRole('status')).textContent).toBe(
      "You're offline. Connect and test again.",
    );
    expect(testKey).not.toHaveBeenCalled();
  });

  it('has nothing to test without a key', async () => {
    setup();
    expect(await screen.findByRole('button', { name: /^Test key, / })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('removes the key only after confirming', async () => {
    const repos = setup({ apiKey: 'k' });
    await userEvent.click(await screen.findByRole('button', { name: 'Remove key' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect((await repos.settings.get()).apiKey).toBe('k');
    await userEvent.click(screen.getByRole('button', { name: 'Remove key' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await screen.findByText('Key removed.');
    expect((await repos.settings.get()).apiKey).toBeFalsy();
    expect(screen.queryByRole('button', { name: 'Remove key' })).toBeNull();
  });

  it('shows and hides the typed key', async () => {
    setup();
    const field = await screen.findByLabelText('API key');
    await userEvent.type(field, 'AIza-typed');
    const toggle = screen.getByRole('button', { name: 'Show key' });
    await userEvent.click(toggle);
    expect(field.getAttribute('type')).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Hide key');
    expect(toggle.textContent).toBe('Hide');
    await userEvent.click(toggle);
    expect(field.getAttribute('type')).toBe('password');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.getAttribute('aria-label')).toBe('Show key');
  });

  // The bug the learner hit: with a key saved, the field was empty, so Show showed nothing.
  it('shows the saved key on Show, and hides it again', async () => {
    setup({ apiKey: 'AIza-fake-saved' });
    const field = await screen.findByLabelText('API key');
    await waitFor(() => expect(field).toHaveProperty('value', 'AIza-fake-saved'));
    expect(field.getAttribute('type')).toBe('password');
    await userEvent.click(screen.getByRole('button', { name: 'Show key' }));
    expect(field.getAttribute('type')).toBe('text');
    await userEvent.click(screen.getByRole('button', { name: 'Hide key' }));
    expect(field.getAttribute('type')).toBe('password');
  });

  it('saves an edited key, and empties the field once the key is removed', async () => {
    const repos = setup({ apiKey: 'AIza-old' });
    const field = await screen.findByLabelText('API key');
    await waitFor(() => expect(field).toHaveProperty('value', 'AIza-old'));
    await userEvent.clear(field);
    await userEvent.type(field, 'AIza-new');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(async () => expect((await repos.settings.get()).apiKey).toBe('AIza-new'));
    await userEvent.click(screen.getByRole('button', { name: 'Remove key' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await screen.findByText('Key removed.');
    expect(field).toHaveProperty('value', '');
  });

  it('names a used-up quota', async () => {
    testKey.mockResolvedValue({ ok: false, error: { kind: 'rate-limit', message: 'x' } });
    setup({ apiKey: 'AIza-secret' });
    await userEvent.click(await screen.findByRole('button', { name: /^Test key, / }));
    expect((await screen.findByRole('status')).textContent).toMatch(/^Quota reached/);
  });

  it('explains how to get a key next to the field (P6)', async () => {
    setup();
    await userEvent.click(await screen.findByText('How to get a key'));
    const link = screen.getByRole('link', { name: 'aistudio.google.com/apikey' });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(screen.getByText(/Restrict to Gemini API only/)).toBeTruthy();
  });

  it('tests a typed key without saving it in Settings', async () => {
    testKey.mockResolvedValue({ ok: true, value: { model: 'm' }, cached: false });
    const repos = setup();
    await userEvent.type(await screen.findByLabelText('API key'), 'AIza-typed');
    await userEvent.click(screen.getByRole('button', { name: /^Test key, / }));
    expect(await screen.findByText('Key works with m.')).toBeTruthy();
    expect((await repos.settings.get()).apiKey).toBeUndefined();
  });
});
