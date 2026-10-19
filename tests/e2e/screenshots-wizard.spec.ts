import { expect, type Page, test } from '@playwright/test';
import { blockGemini, stepHeading } from './helpers.ts';
import { onlyWithScreenshots, shot } from './shots.ts';

/** Each welcome wizard step (P5, P6), as `wizard-<step>.png`. */
onlyWithScreenshots();

const next = (page: Page) => page.getByRole('button', { name: 'Next', exact: true }).click();
const skip = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();

const STEPS: {
  heading: string;
  name: string;
  full?: boolean;
  leave: (page: Page) => Promise<void>;
}[] = [
  { heading: 'Welcome to Kanji Tutor', name: 'wizard-welcome', leave: next },
  { heading: 'Your language', name: 'wizard-language', leave: next },
  {
    heading: 'Load the dictionary',
    name: 'wizard-dictionary',
    leave: async (page) => {
      await page.getByRole('button', { name: 'Load dictionary' }).click();
      await next(page);
    },
  },
  {
    heading: 'Where you start',
    name: 'wizard-start',
    leave: async (page) => {
      await page.getByRole('radio', { name: /I'm studying N4/ }).check();
      await next(page);
    },
  },
  { heading: 'What you already know', name: 'wizard-known', leave: (page) => skip(page, 'Skip') },
  {
    heading: 'Your class',
    name: 'wizard-class',
    leave: async (page) => {
      await page.getByLabel('Textbook or course').fill('My course');
      await page.getByLabel('Current lesson').fill('4');
      await next(page);
    },
  },
  {
    heading: 'Your AI tutor',
    name: 'wizard-ai',
    full: true,
    leave: (page) => skip(page, 'Skip for now'),
  },
  { heading: 'How sessions feel', name: 'wizard-feel', leave: next },
];

test('wizard: every step', async ({ page }) => {
  test.setTimeout(120_000);
  await blockGemini(page);
  await page.goto('/');
  for (const step of STEPS) {
    await expect(stepHeading(page, step.heading)).toBeVisible({ timeout: 30_000 });
    await shot(page, step.name, { full: step.full ?? false });
    await step.leave(page);
  }
  await expect(stepHeading(page, 'Your choices')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start reading' })).toBeEnabled({
    timeout: 30_000,
  });
  await shot(page, 'wizard-summary');
});
