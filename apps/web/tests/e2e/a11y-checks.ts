import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/**
 * Accessibility checks shared by the a11y specs (N6): axe WCAG 2.2 AA in both themes, and a
 * layout report (sideways scroll, targets under 44 px).
 *
 * Inline targets inside running text (words of a sentence, links in prose) are exempt from the
 * target-size rule (WCAG 2.5.8), so elements inside a <p> or a list item are skipped.
 */

/**
 * Waits for the finite animations and transitions to end (the entrance, a sheet rising,
 * a theme switch), so axe measures the final colours and not a section half faded in. Looping
 * ones (a mic pulse) are left.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          animation.effect?.getComputedTiming().iterations === Number.POSITIVE_INFINITY,
      ),
  );
}

/** Axe violations on the page as it is now, in light then dark, as readable lines. */
export async function scanHere(page: Page, label: string): Promise<string[]> {
  const issues: string[] = [];
  for (const theme of ['light', 'dark'] as const) {
    await page.evaluate((mode) => {
      document.documentElement.dataset.theme = mode;
    }, theme);
    // A theme switch starts colour transitions (the bar's labels): measure after them.
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await settle(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    for (const violation of results.violations) {
      const nodes = violation.nodes.map((node) => node.target.join(' ')).join(', ');
      issues.push(`${label} [${theme}] ${violation.id}: ${nodes}`);
    }
  }
  await page.evaluate(() => {
    delete document.documentElement.dataset.theme;
  });
  return issues;
}

/** Runs in the page: the element's size, or its absolute ::before/::after hit area if larger. */
function smallTargets(): string[] {
  const hit = (el: Element) => {
    const box = el.getBoundingClientRect();
    const sizes = ['::before', '::after']
      .map((pseudo) => getComputedStyle(el, pseudo))
      .filter((style) => style.content !== 'none' && style.position === 'absolute')
      .map((style) => [Number.parseFloat(style.width) || 0, Number.parseFloat(style.height) || 0]);
    const width = Math.max(box.width, ...sizes.map(([w]) => w ?? 0));
    const height = Math.max(box.height, ...sizes.map(([, h]) => h ?? 0));
    return { width, height };
  };
  return [...document.querySelectorAll<HTMLElement>('button, a[href], [role="button"]')]
    .filter((el) => el.offsetParent !== null && !el.closest('p, li'))
    .map((el) => ({ el, size: hit(el) }))
    .filter(({ size }) => size.height < 43.5 || size.width < 43.5)
    .map(({ el, size }) => {
      const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30);
      return `${el.tagName.toLowerCase()} "${name}" ${Math.round(size.width)}×${Math.round(size.height)}`;
    });
}

/**
 * Sideways scroll and targets under 44 px on the current page (N6). A kit component may reach
 * 44 px through an invisible absolute ::before/::after: the pseudo-element's measured size
 * counts, not the mere presence of one (Issue 17).
 */
export async function layoutReport(page: Page) {
  const wide = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  return { wide, small: await page.evaluate(smallTargets) };
}
