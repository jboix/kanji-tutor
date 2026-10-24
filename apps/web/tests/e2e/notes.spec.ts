import { answerField, beginMix, importKnown, onboard } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

async function answerWrong(page: Page) {
  const input = await answerField(page);
  await input.fill('');
  await input.pressSequentially('nu');
  await input.press('Enter');
  await expect(page.getByText('You wrote')).toBeVisible();
  await page.getByRole('button', { name: /^Next (sentence|word)$/ }).click();
}

test('read with mistakes, read the letter in Notes, then accept this week’s plan on Today', async ({
  page,
}) => {
  await onboard(page);
  await importKnown(page);
  await beginMix(page);
  await answerWrong(page);
  await answerWrong(page);

  // Notes lives under Learn (IA4, IA6).
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Learn' }).click();
  await page.getByRole('link', { name: /^Notes/ }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByRole('heading', { name: 'This week' })).toBeVisible();
  const letter = page.getByRole('region', { name: 'Letter on the week' });
  // The plain letter shows first; the tutor writes one only when asked (A13).
  await letter.getByRole('button', { name: "Ask the tutor to write this week's letter" }).click();
  // The mock letter quotes no counts or Japanese, so it passes the grounding check and shows.
  await expect(letter).toContainText('What still trips you is length');
  await expect(letter).not.toContainText("aren't in your records");
  await expect(page.getByRole('button', { name: 'Use this plan' })).toBeHidden();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);

  // The plan is on Today: Change opens it, and it applies this week.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Home' }).click();
  await page.getByRole('link', { name: "Change this week's plan" }).click();
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByRole('list')).toContainText('minutes of reading.');
  await page.getByRole('button', { name: 'Use this plan' }).click();
  const followed = page.getByText("This week's sessions follow this plan.");
  await expect(followed).toBeVisible();
  await page.reload();
  await expect(followed).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('region', { name: "This week's plan" })).toContainText('a day');
});
