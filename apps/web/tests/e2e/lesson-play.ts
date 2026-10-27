/**
 * Playing through session cards in e2e (S3, S4): a reading card is answered wrongly ("nu"), an
 * intro gets "Got it", and an exercise or question gets "I don't know" and on.
 */
import { expect, type Locator, type Page } from '@playwright/test';

export const card = (page: Page): Locator => page.locator('[data-card]').first();
export const sessionDone = (page: Page): Locator => page.getByText('Session done');
const gotIt = (page: Page) => page.getByRole('button', { name: 'Got it' });
const dontKnow = (page: Page) => page.getByRole('button', { name: "I don't know" });
const onward = (page: Page) =>
  page.getByRole('button', {
    name: /^(Next sentence|Next word|Next question|Done|Next drill|Finish)$/,
  });

async function readCard(page: Page) {
  const input = page.locator('form input[lang="ja"]');
  await expect(input.or(gotIt(page)).first()).toBeVisible();
  if (await gotIt(page).isVisible()) await gotIt(page).click();
  await input.pressSequentially('nu');
  await input.press('Enter');
  await page.getByRole('button', { name: /^Next (sentence|word)$/ }).click();
}

/** "I don't know" on every step of an exercise or question, then on to the next card. */
export async function skipExercise(page: Page): Promise<void> {
  for (let step = 0; step < 6; step++) {
    await expect(dontKnow(page).or(onward(page)).first()).toBeVisible();
    if (await dontKnow(page).isVisible()) await dontKnow(page).click();
    const next = onward(page).first();
    const label = await next.textContent();
    await next.click();
    if (label !== 'Next word' && label !== 'Next question') return;
  }
}

/** "Got it" on a grammar introduction, then waits for the card after it: the point is saved first. */
export async function passIntro(page: Page): Promise<void> {
  const shown = await card(page).elementHandle();
  await gotIt(page).click();
  await page.waitForFunction((el) => !el?.isConnected, shown);
}

/** Plays the current card of a session, whatever it is; returns its type. */
export async function playCard(page: Page): Promise<string> {
  const type = (await card(page).getAttribute('data-card')) ?? '';
  if (type === 'reading') await readCard(page);
  else if (type === 'grammar-intro') await passIntro(page);
  else await skipExercise(page);
  return type;
}

/** Waits for a card or the session's end, starting the lesson when it opens with its episode. */
async function cardOrEnd(page: Page): Promise<void> {
  const start = page.getByRole('button', { name: /^Start: / });
  await expect(card(page).or(sessionDone(page)).or(start).first()).toBeVisible({ timeout: 20_000 });
  if (await start.isVisible()) await start.click();
  await expect(card(page).or(sessionDone(page)).first()).toBeVisible({ timeout: 20_000 });
}

/** Plays cards until the session ends, at most `max`; returns the types met in order. */
export async function playSession(page: Page, max = 40): Promise<string[]> {
  const types: string[] = [];
  for (let i = 0; i < max; i++) {
    await cardOrEnd(page);
    if (await sessionDone(page).isVisible()) return types;
    types.push(await playCard(page));
  }
  return types;
}

/** Plays until a card of `type` shows; false when the session ends first. */
export async function playUntil(page: Page, type: string, max = 30): Promise<boolean> {
  for (let i = 0; i < max; i++) {
    await cardOrEnd(page);
    if (await sessionDone(page).isVisible()) return false;
    if ((await card(page).getAttribute('data-card')) === type) return true;
    await playCard(page);
  }
  return false;
}

/** A fake speech synthesis with a Japanese voice; what it speaks goes to `window.spoken`. */
export async function fakeJapaneseVoice(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.assign(window, { spoken });
    const voice = { lang: 'ja-JP', name: 'Test', default: true, localService: true, voiceURI: 't' };
    const synth = {
      getVoices: () => [voice],
      speak: (u: { text: string; onend?: () => void }) => {
        spoken.push(u.text);
        setTimeout(() => u.onend?.(), 10);
      },
      cancel: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    Object.assign(window, {
      SpeechSynthesisUtterance: class {
        lang = '';
        rate = 1;
        constructor(readonly text: string) {}
      },
    });
  });
}
