import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiError, Result } from '../../ai/types.ts';
import { fixtureRepos } from '../../test/fixture-pack.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { PlacementScreen } from './placement-screen.tsx';
import { TutorAssessment } from './tutor-assessment.tsx';

const wait = (retryAfterMs: number): AiError => ({
  kind: 'rate-limit',
  message: 'The tutor needs a minute.',
  retryAfterMs,
});

function waitBox(): Promise<HTMLElement> {
  return waitFor(() => {
    const box = document.querySelector<HTMLElement>('[data-ai-block="status"]');
    if (!box?.textContent?.includes('The tutor needs a minute.')) throw new Error('no wait yet');
    return box;
  });
}

/** Skips every question and the writing step, then asks the tutor. */
async function askAfterPlacement() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Start' }));
  for (let n = 1; n <= 15; n += 1) {
    const card = await screen.findByRole('region', { name: `Question ${n} of about 15` });
    const buttons = card.querySelectorAll('button');
    const skip = buttons[buttons.length - 1];
    if (skip) await user.click(skip);
  }
  await user.click(await screen.findByRole('button', { name: 'Skip' }));
  await user.click(await screen.findByRole('button', { name: /^Ask the tutor to assess, / }));
  return user;
}

describe('rate limit on the tutor assessment (A14, D57)', () => {
  it('shows the countdown with Retry disabled during the wait', async () => {
    const onAsk = vi.fn();
    renderWithServices(
      <TutorAssessment state={{ status: 'error', error: wait(30_000) }} onAsk={onAsk} />,
    );
    const box = await waitBox();
    expect(box.textContent).toContain('The tutor needs a minute. You can ask again in 30 s.');
    expect(within(box).getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
  });

  it('asks again on Retry once the wait has passed', async () => {
    const assessLevel = vi.fn(async (): Promise<Result<never>> => ({ ok: false, error: wait(0) }));
    const services = fakeServices({ repos: await fixtureRepos(), ai: fakeAi({ assessLevel }) });
    renderWithServices(<PlacementScreen />, { services });
    const user = await askAfterPlacement();
    const box = await waitBox();
    await user.click(within(box).getByRole('button', { name: /^Retry, / }));
    await waitFor(() => expect(assessLevel).toHaveBeenCalledTimes(2));
  }, 30_000);
});
