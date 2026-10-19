import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PackLoader, PackProgress, Repos } from '../../domain/repos.ts';
import type { Settings } from '../../domain/types.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeServices } from '../../test/render.tsx';
import { paths } from '../../ui/paths.ts';
import { ServicesProvider } from '../../ui/services.tsx';
import { type AiSetupSlotProps, SlotsProvider } from '../../ui/slots.tsx';
import { sound } from '../../ui/sound.ts';
import { OnboardingScreen } from './onboarding-screen.tsx';
import { PackGate } from './pack-gate.tsx';

interface Packs {
  loader: PackLoader;
  /** Ends the running install. */
  finish: () => void;
}

function fakePacks(options: { installed?: boolean; fail?: boolean } = {}): Packs {
  let version = options.installed ? 'v1' : undefined;
  let finish: () => void = () => undefined;
  const loader: PackLoader = {
    installed: vi.fn(async () => version),
    manifest: vi.fn(async () => ({
      version: 'v1',
      files: [{ store: 'words' as const, url: 'w.json.gz', bytes: 3_800_000, count: 48_000 }],
    })),
    install: vi.fn(async (onProgress: (p: PackProgress) => void) => {
      if (options.fail) throw new Error('offline');
      onProgress({ stage: 'words', loaded: 12_000, total: 48_000 });
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      version = 'v1';
      onProgress({ stage: 'done', loaded: 48_000, total: 48_000 });
    }),
  };
  return { loader, finish: () => finish() };
}

/** Stands in for the settings feature's key field: saves a key on one press. */
function FakeAiSetup({ onPatch }: AiSetupSlotProps) {
  return (
    <button type="button" onClick={() => void onPatch({ apiKey: 'AIza-test' })}>
      Fake save key
    </button>
  );
}

interface Setup {
  settings?: Partial<Settings>;
  installed?: boolean;
  fail?: boolean;
  path?: string;
  /** Renders again over these repos, as after a reload. */
  repos?: Repos;
}

async function setup(options: Setup = {}): Promise<{ repos: Repos; packs: Packs }> {
  const repos = options.repos ?? (await readingRepos(options.settings));
  const packs = fakePacks(options);
  render(
    <ServicesProvider value={fakeServices({ repos, packs: packs.loader })}>
      <SlotsProvider value={{ aiSetup: FakeAiSetup }}>
        <MemoryRouter initialEntries={[options.path ?? paths.onboarding]}>
          <Routes>
            <Route path={paths.onboarding} element={<OnboardingScreen />} />
            <Route
              path={paths.today}
              element={
                <PackGate>
                  <p>Today page</p>
                </PackGate>
              }
            />
          </Routes>
        </MemoryRouter>
      </SlotsProvider>
    </ServicesProvider>,
  );
  return { repos, packs };
}

const heading = (name: string | RegExp) => screen.findByRole('heading', { level: 1, name });
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const next = () => userEvent.click(button('Next'));

afterEach(() => vi.restoreAllMocks());

describe('welcome wizard (P5)', () => {
  it('walks every step, saving each choice, and opens Today at the end', async () => {
    const { repos, packs } = await setup();
    expect(await heading('Welcome to Kanji Tutor')).toBeTruthy();
    expect(screen.getByText('1 of 9')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    await next();

    await heading('Your language');
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Your language');
    await next();
    expect(await repos.settings.get()).toMatchObject({
      uiLanguage: 'fr',
      onboardingStep: 'dictionary',
    });

    await heading('Load the dictionary');
    expect(screen.getByText(/About 3\.8 MB/)).toBeTruthy();
    expect(button('Next')).toHaveProperty('disabled', true);
    await userEvent.click(button('Load dictionary'));
    expect(await screen.findByText('Words 12,000 of 48,000')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('25');
    await next();

    // The download goes on in the background while the next steps are filled in.
    await heading('Where you start');
    expect(screen.getByRole('progressbar', { name: /in the background/ })).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: /I'm studying N4/ }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Where you start');
    expect(await repos.settings.get()).not.toHaveProperty('learnerLevel');
    await next();
    expect((await repos.settings.get()).learnerLevel).toBe(4);

    await heading('What you already know');
    expect(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' })).toHaveProperty(
      'checked',
      true,
    );
    expect(screen.getByRole('checkbox', { name: 'JLPT N4 (approximate list)' })).toHaveProperty(
      'checked',
      false,
    );
    expect(screen.queryByRole('radiogroup', { name: 'These words are' })).toBeNull();
    expect(screen.getByText('Next opens once the dictionary has loaded.')).toBeTruthy();
    expect(button('Next')).toHaveProperty('disabled', true);
    packs.finish();
    await waitFor(() => expect(button('Next')).toHaveProperty('disabled', false));
    await next();
    expect((await repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);

    await heading('Your class');
    await userEvent.type(screen.getByLabelText('Textbook or course'), 'Tobira');
    await userEvent.type(screen.getByLabelText('Current lesson'), '第4課');
    expect(screen.getByText(/Words you add from class are tagged/).textContent).toContain(
      'Tobira 第4課',
    );
    await next();
    expect((await repos.settings.get()).currentLesson).toBe('Tobira 第4課');

    await heading('Your AI tutor');
    await userEvent.click(button('Fake save key'));
    await next();

    await heading('How sessions feel');
    await userEvent.click(screen.getByRole('radio', { name: 'Off' }));
    expect((await repos.settings.get()).sound).toBe(false);
    expect(button('Play sample')).toHaveProperty('disabled', true);
    await userEvent.click(screen.getByRole('radio', { name: 'All words' }));
    await next();

    await heading('Your choices');
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText('Français')).toBeTruthy();
    expect(summary.getByText('On this device')).toBeTruthy();
    expect(summary.getByText('Studying N4, level N4')).toBeTruthy();
    expect(summary.getByText(/11 words marked as known/)).toBeTruthy();
    const lesson = summary.getByText('第4課');
    expect(lesson.getAttribute('lang')).toBe('ja');
    expect(lesson.parentElement?.textContent).toBe('Tobira 第4課');
    expect(summary.getByText(/Tobira/).closest('[lang="ja"]')).toBeNull();
    expect(summary.getByText('Key saved in this browser')).toBeTruthy();
    expect(summary.getByText('Sounds off, furigana on all words')).toBeTruthy();
    await userEvent.click(button('Start reading'));
    expect(await screen.findByText('Today page')).toBeTruthy();
    expect(await repos.settings.get()).toMatchObject({ onboarded: true, onboardingStep: '' });
  });

  it('moves the focus to each new step heading', async () => {
    await setup();
    await heading('Welcome to Kanji Tutor');
    await next();
    const title = await heading('Your language');
    expect(document.activeElement).toBe(title);
    await userEvent.click(button('Back'));
    expect(document.activeElement).toBe(await heading('Welcome to Kanji Tutor'));
  });

  it('starts from zero: nothing ticked, Skip marks nothing and skips the key', async () => {
    const { repos } = await setup({ settings: { onboardingStep: 'start' }, installed: true });
    await heading('Where you start');
    await userEvent.click(screen.getByRole('radio', { name: /I'm starting from zero/ }));
    await next();
    await heading('What you already know');
    expect(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' })).toHaveProperty(
      'checked',
      false,
    );
    await userEvent.click(button('Skip'));
    await heading('Your class');
    await userEvent.click(button('Skip'));
    await heading('Your AI tutor');
    expect(screen.getByText(/everything except the tutor works without a key/i)).toBeTruthy();
    await userEvent.click(button('Skip for now'));
    await heading('How sessions feel');
    expect(await repos.items.count()).toBe(0);
    const settings = await repos.settings.get();
    expect(settings).toMatchObject({ learnerLevel: 5, onboardingStep: 'feel' });
    expect(settings).not.toHaveProperty('apiKey');
    expect(settings).not.toHaveProperty('currentLesson');
  });

  it('N4, then Skip on what you know, still marks the N5 list at Start reading (D38)', async () => {
    const { repos } = await setup({ settings: { onboardingStep: 'start' }, installed: true });
    await heading('Where you start');
    await userEvent.click(screen.getByRole('radio', { name: /I'm studying N4/ }));
    await next();
    await heading('What you already know');
    await userEvent.click(button('Skip'));
    await heading('Your class');
    await userEvent.click(button('Skip'));
    await heading('Your AI tutor');
    await userEvent.click(button('Skip for now'));
    await heading('How sessions feel');
    await next();
    await heading('Your choices');
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText('JLPT N5: marked as known when you start reading')).toBeTruthy();
    expect(await repos.items.get(`word:${W.eki.id}`)).toBeUndefined();
    await userEvent.click(button('Start reading'));
    expect(await screen.findByText('Today page')).toBeTruthy();
    expect((await repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
  });

  it('rebuilds the summary from saved settings after a reload mid-wizard (Issue 41)', async () => {
    const first = await setup({ settings: { onboardingStep: 'known' }, installed: true });
    await heading('What you already know');
    await userEvent.click(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' }));
    await next();
    await heading('Your class');
    cleanup();
    await setup({ repos: first.repos, installed: true });
    await heading('Your class');
    await userEvent.click(button('Skip'));
    await heading('Your AI tutor');
    await userEvent.click(button('Skip for now'));
    await heading('How sessions feel');
    await next();
    await heading('Your choices');
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText(/^\d+ words? marked as known$/)).toBeTruthy();
  });

  it('keeps the lists a Skip left across a reload, and marks them at Start reading', async () => {
    const first = await setup({ settings: { onboardingStep: 'start' }, installed: true });
    await heading('Where you start');
    await userEvent.click(screen.getByRole('radio', { name: /I'm studying N4/ }));
    await next();
    await heading('What you already know');
    await userEvent.click(button('Skip'));
    await heading('Your class');
    cleanup();
    await setup({ repos: first.repos, installed: true });
    await userEvent.click(await screen.findByRole('button', { name: 'Skip' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Skip for now' }));
    await heading('How sessions feel');
    await next();
    await heading('Your choices');
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText('JLPT N5: marked as known when you start reading')).toBeTruthy();
    await userEvent.click(button('Start reading'));
    expect(await screen.findByText('Today page')).toBeTruthy();
    expect((await first.repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
  });

  it('says plainly that kana come first, with a free guide and no tracking (P8)', async () => {
    await setup({ installed: true });
    await heading('Welcome to Kanji Tutor');
    expect(screen.getByText(/expects you to read hiragana and katakana/)).toBeTruthy();
    const guide = screen.getByRole('link', { name: /Open the free kana guide on Tofugu/ });
    expect(guide.getAttribute('href')).toBe('https://www.tofugu.com/japanese/learn-hiragana/');
    expect(guide.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows the kana note again under "starting from zero", before the level questions', async () => {
    await setup({ settings: { onboardingStep: 'start', learnerLevel: 4 }, installed: true });
    await heading('Where you start');
    expect(screen.queryByText(/expects you to read hiragana/)).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: /I'm starting from zero/ }));
    expect(screen.getByText(/expects you to read hiragana and katakana/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /kana guide on Tofugu/ })).toBeTruthy();
  });

  it('explains how to get a Gemini key, with real external links (P6)', async () => {
    await setup({ settings: { onboardingStep: 'ai' }, installed: true });
    await heading('Your AI tutor');
    expect(screen.getByText(/runs on Google Gemini with your own free key/)).toBeTruthy();
    const studio = screen.getByRole('link', { name: 'aistudio.google.com/apikey' });
    expect(studio.getAttribute('href')).toBe('https://aistudio.google.com/apikey');
    expect(studio.getAttribute('target')).toBe('_blank');
    expect(studio.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText(/Press "Create API key"/)).toBeTruthy();
    expect(screen.getByText(/Restrict to Gemini API only/)).toBeTruthy();
    expect(screen.getByText(/create a new one there and delete the old one/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Gemini API terms' }).getAttribute('href')).toBe(
      'https://ai.google.dev/gemini-api/terms',
    );
  });

  it('resumes at the saved step after a reload', async () => {
    await setup({ settings: { onboardingStep: 'class' }, installed: true });
    expect(await heading('Your class')).toBeTruthy();
    expect(screen.getByText('6 of 9')).toBeTruthy();
  });

  it('resumes at the dictionary when the packs are not loaded yet', async () => {
    await setup({ settings: { onboardingStep: 'class' } });
    expect(await heading('Load the dictionary')).toBeTruthy();
  });

  it('changes a choice from the summary and comes back to it', async () => {
    const { repos } = await setup({
      settings: { onboardingStep: 'summary', learnerLevel: 4 },
      installed: true,
    });
    await heading('Your choices');
    expect(screen.getByText('Studying N4, level N4')).toBeTruthy();
    await userEvent.click(button('Change where you start'));
    await heading('Where you start');
    await userEvent.click(screen.getByRole('radio', { name: /I'm studying N3/ }));
    await next();
    // A new start shows its lists before going back.
    await heading('What you already know');
    expect(screen.getByRole('checkbox', { name: 'JLPT N4 (approximate list)' })).toHaveProperty(
      'checked',
      true,
    );
    await userEvent.click(button('Back to summary'));
    await heading('Your choices');
    expect(screen.getByText('Studying N3, level N3')).toBeTruthy();
    expect((await repos.settings.get()).learnerLevel).toBe(3);
    await userEvent.click(button('Change your class'));
    await heading('Your class');
    await userEvent.click(button('Back to summary'));
    expect(await heading('Your choices')).toBeTruthy();
  });

  it('says so when marking fails, and stays on the step', async () => {
    const { repos } = await setup({ settings: { onboardingStep: 'known' }, installed: true });
    repos.items.putMany = async () => {
      throw new Error('quota');
    };
    await heading('What you already know');
    await userEvent.click(screen.getByRole('checkbox', { name: 'JLPT N5 (approximate list)' }));
    await next();
    expect((await screen.findByRole('alert')).textContent).toContain('were not marked');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('What you already know');
  });

  it('offers a retry when the dictionary fails to load', async () => {
    await setup({ settings: { onboardingStep: 'dictionary' }, fail: true });
    await userEvent.click(await screen.findByRole('button', { name: 'Load dictionary' }));
    expect((await screen.findByRole('alert')).textContent).toContain('did not load');
    expect(button('Try again')).toBeTruthy();
    expect(button('Next')).toHaveProperty('disabled', true);
  });

  it('cannot start reading until the dictionary is in', async () => {
    await setup({ settings: { onboardingStep: 'summary' } });
    await heading('Load the dictionary');
  });

  it('plays a sample of the answer sounds', async () => {
    const play = vi.spyOn(sound, 'play').mockImplementation(() => undefined);
    vi.spyOn(sound, 'unlock').mockImplementation(() => undefined);
    await setup({ settings: { onboardingStep: 'feel' }, installed: true });
    await heading('How sessions feel');
    await userEvent.click(button('Play sample'));
    expect(play).toHaveBeenCalledWith('correct');
    await waitFor(() => expect(play).toHaveBeenCalledWith('wrong'));
  });

  it('sends someone already onboarded to Today', async () => {
    await setup({ settings: { onboarded: true }, installed: true });
    expect(await screen.findByText('Today page')).toBeTruthy();
  });
});

describe('PackGate', () => {
  it('renders its children once the packs are in and the wizard is done', async () => {
    await setup({ settings: { onboarded: true }, installed: true, path: paths.today });
    expect(await screen.findByText('Today page')).toBeTruthy();
  });

  it('sends a learner who has not finished the wizard back to it', async () => {
    await setup({ settings: { onboardingStep: 'ai' }, installed: true, path: paths.today });
    expect(await heading('Your AI tutor')).toBeTruthy();
    expect(screen.queryByText('Today page')).toBeNull();
  });

  it('sends the learner to the wizard when the packs are missing', async () => {
    await setup({ settings: { onboarded: true }, path: paths.today });
    expect(await heading('Load the dictionary')).toBeTruthy();
    expect(screen.queryByText('Today page')).toBeNull();
  });
});
