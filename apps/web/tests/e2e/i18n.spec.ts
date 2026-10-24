import { blockGemini, importKnown, onboard, startWizard, stepHeading } from './helpers.ts';
import { expect, type Page, test } from './test.ts';

/**
 * The interface in the learner's language (N7b): French chosen in Settings switches Today, a
 * session card, the word sheet and Settings at once; Spanish chosen in the wizard switches the
 * wizard itself. Japanese stays Japanese.
 */

/** The French session card's answer field, past a new-word intro ("Compris") when one shows. */
async function frenchAnswerField(page: Page) {
  const input = page.locator('form input[lang="ja"]');
  const gotIt = page.getByRole('button', { name: 'Compris' });
  await expect(input.or(gotIt)).toBeVisible({ timeout: 15_000 });
  if (await gotIt.isVisible()) await gotIt.click();
  await expect(input).toBeVisible();
  return input;
}

/** Opens the word sheet of the first word in the sentence that has dictionary senses. */
async function openWordSheet(page: Page) {
  const buttons = page.locator('p[lang="ja"] button');
  for (let i = 0; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    const senses = sheet.getByRole('region', { name: 'Dans le dictionnaire' });
    if (await senses.isVisible()) return sheet;
    await sheet.getByRole('button', { name: 'Fermer' }).first().click();
    await expect(sheet).toBeHidden();
  }
  throw new Error('no word to tap');
}

test('French chosen in Settings: Today, a session card, the word sheet and Settings', async ({
  page,
}) => {
  await onboard(page);
  await importKnown(page);
  await page.goto('/settings/language');
  // The segmented control's radio sits under its label, so the label takes the tap.
  await page.getByRole('region', { name: 'Language' }).getByText('Français').click();
  await expect(page.getByRole('radio', { name: 'Français' })).toBeChecked();
  // The whole interface switches on the tap, with no reload.
  await expect(page.getByRole('heading', { level: 1, name: 'Langue' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Langue' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Accueil' })).toBeVisible();
  // The daily mix tile, once its size is known.
  const mix = page.getByRole('link', { name: /^Mélange du jour\s?\d+ phrases?/ });
  await expect(mix).toBeVisible({ timeout: 20_000 });
  await mix.click();

  await frenchAnswerField(page);
  await page.getByRole('button', { name: 'Je ne sais pas' }).click();
  await expect(page.getByText('La voici :')).toBeVisible();
  const sheet = await openWordSheet(page);
  await expect(
    sheet.getByRole('button', { name: 'Demander au tuteur à propos de ce mot' }),
  ).toBeVisible();
  await expect(sheet.locator('[lang="ja"]').first()).toBeVisible();
  await sheet.getByRole('button', { name: 'Fermer' }).first().click();

  // A reload keeps French from the first paint.
  await page.goto('/settings');
  await expect(page.getByRole('heading', { level: 1, name: 'Réglages' })).toBeVisible();
});

test('Spanish chosen in the wizard switches the wizard at once', async ({ page }) => {
  await blockGemini(page);
  await page.goto('/');
  await startWizard(page);
  await page.getByRole('radio', { name: 'Español' }).check();
  await expect(stepHeading(page, 'Tu idioma')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(stepHeading(page, '¿Cuál sabes leer?')).toBeVisible();
});
