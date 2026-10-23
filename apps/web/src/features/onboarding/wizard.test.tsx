import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PackLoader, PackProgress, Repos } from '../../domain/repos.ts';
import type { Settings } from '../../domain/types.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeLang, fakeServices } from '../../test/render.tsx';
import { paths } from '../../ui/paths.ts';
import { ServicesProvider } from '../../ui/services.tsx';
import { type AiSetupSlotProps, SlotsProvider } from '../../ui/slots.tsx';
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
      onProgress({ stage: 'words', loaded: 12_000, total: 48_000, overall: 0.25 });
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

/** Looks up the one pasted word the tests use. */
const LANG = fakeLang({ lookupWord: async (line) => (line.trim() === '駅' ? [W.eki] : []) });

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
    <ServicesProvider value={fakeServices({ repos, packs: packs.loader, lang: LANG })}>
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

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('welcome wizard (P5)', () => {
  it('offers Log in only when the build has a cloud-save server', async () => {
    vi.stubEnv('VITE_SYNC_URL', '');
    await setup();
    expect(await heading('Kanji Tutor')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Log in' })).toBeNull();
  });

  it('walks every step, saving each choice, and opens Today at the end', async () => {
    vi.stubEnv('VITE_SYNC_URL', 'https://sync.test');
    const { repos, packs } = await setup();
    expect(await heading('Kanji Tutor')).toBeTruthy();
    expect(screen.getByText(/Read Japanese with an/).textContent).toBe(
      'Read Japanese with an AI tutor at your side.',
    );
    expect(screen.getByText('AI tutor').tagName).toBe('EM');
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(packs.loader.install).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe(paths.logIn);
    await userEvent.click(button('Start'));

    // Start begins the dictionary download, which goes on in the background.
    await heading('Your language');
    expect(screen.getByText('1 of 6')).toBeTruthy();
    expect(packs.loader.install).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('progressbar', { name: /works offline/ })).toBeTruthy();
    expect(screen.getByText('Now: words, 12,000 of 48,000')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
    await userEvent.click(screen.getByRole('radio', { name: 'Français' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Your language');
    await next();
    expect(await repos.settings.get()).toMatchObject({ uiLanguage: 'fr', onboardingStep: 'start' });

    await heading('Which one can you read?');
    // French meanings follow the dictionary unannounced.
    expect(screen.queryByText(/meanings in French/)).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: /I'm studying N4/ }));
    expect(screen.getByText(/N5 words\. They are marked as known/)).toBeTruthy();
    expect(await repos.settings.get()).not.toHaveProperty('learnerLevel');
    await next();
    expect((await repos.settings.get()).learnerLevel).toBe(4);

    await heading('Do you follow a class?');
    expect(screen.getByRole('radio', { name: 'None' })).toHaveProperty('checked', true);
    expect(screen.queryByText('Lesson you are on')).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: 'Tobira' }));
    for (let i = 0; i < 3; i++) await userEvent.click(button('Next lesson'));
    expect(screen.getByText('Tobira 第4課').closest('p')?.textContent).toContain('are tagged');
    await next();
    expect((await repos.settings.get()).currentLesson).toBe('Tobira 第4課');

    await heading('Meet your tutor');
    expect(button('Skip')).toBeTruthy();
    await userEvent.click(button('Fake save key'));
    // With a key saved, the same button reads Next.
    await next();

    await heading('How sessions feel');
    fireEvent.change(screen.getByRole('slider', { name: 'Answer sounds' }), {
      target: { value: '0' },
    });
    await waitFor(async () => expect((await repos.settings.get()).sound).toBe(false));
    await userEvent.click(screen.getByRole('radio', { name: 'All words' }));
    await next();

    await heading('Your choices');
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText('Français')).toBeTruthy();
    expect(summary.getByText('Studying N4, level N4')).toBeTruthy();
    expect(summary.getByText('JLPT N5: marked as known when you start reading')).toBeTruthy();
    const lesson = summary.getByText('第4課');
    expect(lesson.getAttribute('lang')).toBe('ja');
    expect(lesson.parentElement?.textContent).toBe('Tobira 第4課');
    expect(summary.getByText('Key saved in this browser')).toBeTruthy();
    expect(summary.getByText('Sounds off, furigana on all words')).toBeTruthy();
    expect(button('Start reading')).toHaveProperty('disabled', true);
    packs.finish();
    await waitFor(() => expect(button('Start reading')).toHaveProperty('disabled', false));
    expect(screen.getByText('Dictionary loaded: everything works offline.')).toBeTruthy();
    await userEvent.click(button('Start reading'));
    expect(await screen.findByText('Today page')).toBeTruthy();
    expect(await repos.settings.get()).toMatchObject({ onboarded: true, onboardingStep: '' });
    expect((await repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
  });

  it('moves the focus to each new step heading, and Back returns to the welcome', async () => {
    await setup({ installed: true });
    await heading('Kanji Tutor');
    await userEvent.click(button('Start'));
    const title = await heading('Your language');
    expect(document.activeElement).toBe(title);
    await userEvent.click(button('Back'));
    expect(await heading('Kanji Tutor')).toBeTruthy();
  });

  it('starts from zero: None marks nothing, and the key can be skipped', async () => {
    const { repos } = await setup({ settings: { onboardingStep: 'start' }, installed: true });
    await heading('Which one can you read?');
    await userEvent.click(screen.getByRole('radio', { name: /I'm starting from zero/ }));
    await next();
    await heading('Do you follow a class?');
    await next();
    await heading('Meet your tutor');
    expect(screen.getByText(/everything except the tutor works without a key/i)).toBeTruthy();
    await userEvent.click(button('Skip'));
    await heading('How sessions feel');
    expect(await repos.items.count()).toBe(0);
    const settings = await repos.settings.get();
    expect(settings).toMatchObject({ learnerLevel: 5, onboardingStep: 'feel' });
    expect(settings).not.toHaveProperty('apiKey');
    expect(settings.currentLesson ?? '').toBe('');
  });

  it("offers Minna's earlier lessons as known only for Minna past lesson 1", async () => {
    await setup({ settings: { onboardingStep: 'class' }, installed: true });
    await heading('Do you follow a class?');
    await userEvent.click(screen.getByRole('radio', { name: 'Genki' }));
    await userEvent.click(button('Next lesson'));
    expect(screen.queryByRole('switch')).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: 'Minna no Nihongo' }));
    expect(screen.getByRole('switch', { name: /Lesson 1 is known/ })).toHaveProperty(
      'checked',
      true,
    );
    await userEvent.click(button('Next lesson'));
    expect(screen.getByRole('switch', { name: /Lessons 1 to 2 are known/ })).toBeTruthy();
    expect(screen.getByText(/No AI here/)).toBeTruthy();
  });

  it('marks a pasted list on Next, and the summary keeps it after a reload', async () => {
    const first = await setup({ settings: { onboardingStep: 'class' }, installed: true });
    await heading('Do you follow a class?');
    await userEvent.click(screen.getByText('Paste a list of words you know'));
    await userEvent.type(screen.getByLabelText('Words you know, one per line'), '駅');
    await next();
    await heading('Meet your tutor');
    expect((await first.repos.items.get(`word:${W.eki.id}`))?.level).toBe(3);
    cleanup();
    await setup({ repos: first.repos, installed: true });
    await heading('Meet your tutor');
    await userEvent.click(button('Skip'));
    await heading('How sessions feel');
    await next();
    await heading('Your choices');
    const summary = within(screen.getByRole('main'));
    expect(summary.getByText('1 word marked as known')).toBeTruthy();
  });

  it('waits for the dictionary before marking the class step’s words', async () => {
    const { packs } = await setup({ settings: { onboardingStep: 'class' } });
    await heading('Do you follow a class?');
    await userEvent.click(screen.getByText('Paste a list of words you know'));
    await userEvent.type(screen.getByLabelText('Words you know, one per line'), '駅');
    expect(screen.getByText('Next opens once the dictionary has loaded.')).toBeTruthy();
    expect(button('Next')).toHaveProperty('disabled', true);
    packs.finish();
    await waitFor(() => expect(button('Next')).toHaveProperty('disabled', false));
  });

  it('shows the kana note under "starting from zero" (P8)', async () => {
    await setup({ settings: { onboardingStep: 'start', learnerLevel: 4 }, installed: true });
    await heading('Which one can you read?');
    expect(screen.queryByText(/expects you to read hiragana/)).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: /I'm starting from zero/ }));
    expect(screen.getByText(/expects you to read hiragana and katakana/)).toBeTruthy();
    const guide = screen.getByRole('link', { name: /Open the free kana guide on Tofugu/ });
    expect(guide.getAttribute('href')).toBe('https://www.tofugu.com/japanese/learn-hiragana/');
    expect(guide.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('shows what the tutor does, then how to get a Gemini key (P6)', async () => {
    await setup({ settings: { onboardingStep: 'ai' }, installed: true });
    await heading('Meet your tutor');
    expect(screen.getByText(/more insight, explanations and memory hooks/)).toBeTruthy();
    expect(screen.getByText(/You wrote/).textContent).toBe('You wrote もつ. It reads まつ.');
    expect(screen.getByText(/runs on Google Gemini with your own free key/)).toBeTruthy();
    const studio = screen.getByRole('link', { name: 'aistudio.google.com/apikey' });
    expect(studio.getAttribute('href')).toBe('https://aistudio.google.com/apikey');
    expect(studio.getAttribute('target')).toBe('_blank');
    expect(studio.getAttribute('rel')).toContain('noopener');
    expect(screen.getByText(/Press "Create API key"/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Gemini API terms' }).getAttribute('href')).toBe(
      'https://ai.google.dev/gemini-api/terms',
    );
  });

  it('resumes at the saved step after a reload, loading the dictionary if it is missing', async () => {
    const { packs } = await setup({ settings: { onboardingStep: 'class' } });
    expect(await heading('Do you follow a class?')).toBeTruthy();
    expect(screen.getByText('3 of 6')).toBeTruthy();
    await waitFor(() => expect(packs.loader.install).toHaveBeenCalledTimes(1));
  });

  it('changes a choice from the summary and comes back to it', async () => {
    const { repos } = await setup({
      settings: { onboardingStep: 'summary', learnerLevel: 4 },
      installed: true,
    });
    await heading('Your choices');
    expect(screen.getByText('Studying N4, level N4')).toBeTruthy();
    await userEvent.click(button('Change where you start'));
    await heading('Which one can you read?');
    await userEvent.click(screen.getByRole('radio', { name: /I'm studying N3/ }));
    await userEvent.click(button('Back to summary'));
    await heading('Your choices');
    expect(screen.getByText('Studying N3, level N3')).toBeTruthy();
    expect(screen.getByText('JLPT N5, N4: marked as known when you start reading')).toBeTruthy();
    expect((await repos.settings.get()).learnerLevel).toBe(3);
    await userEvent.click(button('Change your class'));
    await heading('Do you follow a class?');
    await userEvent.click(button('Back to summary'));
    expect(await heading('Your choices')).toBeTruthy();
  });

  it('says so when marking fails, and stays on the step', async () => {
    const { repos } = await setup({ settings: { onboardingStep: 'class' }, installed: true });
    repos.items.putMany = async () => {
      throw new Error('quota');
    };
    await heading('Do you follow a class?');
    await userEvent.click(screen.getByText('Paste a list of words you know'));
    await userEvent.type(screen.getByLabelText('Words you know, one per line'), '駅');
    await next();
    expect((await screen.findByRole('alert')).textContent).toContain('were not marked');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Do you follow a class?');
  });

  it('offers a retry when the dictionary fails to load', async () => {
    await setup({ settings: { onboardingStep: 'start' }, fail: true });
    expect((await screen.findByRole('alert')).textContent).toContain('did not load');
    expect(button('Try again')).toBeTruthy();
  });

  it('sets the answer sounds with one knob: all the way left is off', async () => {
    const { repos } = await setup({ settings: { onboardingStep: 'feel' }, installed: true });
    await heading('How sessions feel');
    const knob = screen.getByRole('slider', { name: 'Answer sounds' });
    expect(knob.getAttribute('aria-valuetext')).toBe('100%');
    fireEvent.change(knob, { target: { value: '50' } });
    await waitFor(async () =>
      expect(await repos.settings.get()).toMatchObject({ sound: true, soundVolume: 0.5 }),
    );
    fireEvent.change(knob, { target: { value: '0' } });
    await waitFor(async () => expect((await repos.settings.get()).sound).toBe(false));
    expect(knob.getAttribute('aria-valuetext')).toBe('Off');
  });

  it('turns sound off, back on and louder with one tap each, no drag needed (WCAG 2.5.7)', async () => {
    const { repos } = await setup({
      settings: { onboardingStep: 'feel', soundVolume: 0.6 },
      installed: true,
    });
    await heading('How sessions feel');
    const off = button('Sound off');
    expect(off.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(off);
    await waitFor(async () => expect((await repos.settings.get()).sound).toBe(false));
    expect(button('Sound off').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(button('Sound off'));
    await waitFor(async () =>
      expect(await repos.settings.get()).toMatchObject({ sound: true, soundVolume: 0.6 }),
    );
    await userEvent.click(button('Louder'));
    await waitFor(async () => expect((await repos.settings.get()).soundVolume).toBe(0.7));
  });

  it('shows furigana on the sample sentence as chosen', async () => {
    await setup({ settings: { onboardingStep: 'feel' }, installed: true });
    await heading('How sessions feel');
    expect(document.querySelectorAll('rt')).toHaveLength(1);
    await userEvent.click(screen.getByRole('radio', { name: 'All words' }));
    await waitFor(() => expect(document.querySelectorAll('rt')).toHaveLength(3));
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
    expect(await heading('Meet your tutor')).toBeTruthy();
    expect(screen.queryByText('Today page')).toBeNull();
  });

  it('sends the learner to the summary, which waits for the packs, when they are missing', async () => {
    await setup({ settings: { onboarded: true }, path: paths.today });
    expect(await heading('Your choices')).toBeTruthy();
    expect(button('Start reading')).toHaveProperty('disabled', true);
    expect(screen.queryByText('Today page')).toBeNull();
  });
});
