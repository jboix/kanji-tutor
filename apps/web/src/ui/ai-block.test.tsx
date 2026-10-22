import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeServices, renderWithServices } from '../test/render.tsx';
import { AiBlock, AiBlockStatus, AiWriting, modelShortName } from './ai-block.tsx';
import { RateLimitNotice, RateLimitWait, secondsLeft } from './rate-limit-notice.tsx';

describe('AiBlock', () => {
  it('is a note "From the tutor" with the seal and the model line', async () => {
    renderWithServices(<AiBlock>待つ means to wait.</AiBlock>);
    const note = screen.getByRole('note', { name: 'From the tutor' });
    expect(note.hasAttribute('data-ai-block')).toBe(true);
    expect(note.getAttribute('data-ai-block')).toBe('');
    expect(note.querySelector('[aria-hidden="true"][lang="ja"]')?.getAttribute('data-seal')).toBe(
      '解',
    );
    expect(await within(note).findByText('Tutor · Flash-Lite 3.5')).toBeTruthy();
    expect(note.textContent).toContain('待つ means to wait.');
  });

  it('takes a label, and shows the model from Settings', async () => {
    const services = fakeServices();
    await services.repos.settings.patch({ teacherModelId: 'gemini-3.8-flash' });
    renderWithServices(<AiBlock label="The tutor on 間">Text</AiBlock>, { services });
    const note = screen.getByRole('note', { name: 'The tutor on 間' });
    expect(await within(note).findByText('Tutor · Flash 3.8')).toBeTruthy();
  });

  it('shows the marks it carries in its header', () => {
    renderWithServices(
      <AiBlock cached hidden offLanguage>
        Text
      </AiBlock>,
    );
    const note = screen.getByRole('note', { name: 'From the tutor' });
    expect(note.textContent).toContain('saved answer');
    expect(note.textContent).toContain('a reading was hidden');
    expect(note.textContent).toContain('not in your language');
  });

  it('shows no marks by default', () => {
    renderWithServices(<AiBlock>Text</AiBlock>);
    const note = screen.getByRole('note', { name: 'From the tutor' });
    expect(note.textContent).not.toContain('saved answer');
    expect(note.textContent).not.toContain('a reading was hidden');
  });

  it('shortens model ids', () => {
    expect(modelShortName('gemini-3.5-flash-lite')).toBe('Flash-Lite 3.5');
    expect(modelShortName('gemini-3.1-flash-lite-preview')).toBe('Flash-Lite 3.1');
    expect(modelShortName('gemini-3.8-flash')).toBe('Flash 3.8');
    expect(modelShortName('my-model')).toBe('my-model');
  });
});

describe('AiBlockStatus and AiWriting', () => {
  it('puts a request state in the AI box', () => {
    const { container } = renderWithServices(<AiWriting />);
    expect(screen.getByRole('status').textContent).toBe('The tutor is writing…');
    expect(container.querySelector('[data-ai-block="status"]')).toBeTruthy();
  });

  it('takes its own line', () => {
    renderWithServices(<AiWriting>Looking at the sentence…</AiWriting>);
    expect(screen.getByRole('status').textContent).toBe('Looking at the sentence…');
  });

  it('hosts any status content', () => {
    const { container } = renderWithServices(
      <AiBlockStatus tier="fast">
        <p>Offline.</p>
      </AiBlockStatus>,
    );
    expect(container.querySelector('[data-ai-block="status"]')?.textContent).toContain('Offline.');
  });
});

describe('RateLimitNotice (A14)', () => {
  it('counts down, and enables Retry once the wait has passed', async () => {
    const onRetry = vi.fn();
    const { rerender } = renderWithServices(
      <RateLimitNotice retryAfterMs={30_000} onRetry={onRetry} />,
    );
    expect(screen.getByText('The tutor needs a minute. You can ask again in 30 s.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Retry, / })).toHaveProperty('disabled', true);
    rerender(<span />);
    renderWithServices(<RateLimitNotice retryAfterMs={0} onRetry={onRetry} />);
    expect(screen.getByText('The tutor needs a minute. You can ask again now.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /^Retry, / }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows only for a rate limit, a minute when no wait was given', () => {
    const { container } = renderWithServices(
      <RateLimitWait error={{ kind: 'offline', message: '' }} />,
    );
    expect(container.textContent).toBe('');
    renderWithServices(<RateLimitWait error={{ kind: 'rate-limit', message: '' }} />);
    expect(screen.getByText(/ask again in 60 s/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Retry, / })).toBeNull();
  });

  it('works out whole seconds left, never below zero', () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_001, 0)).toBe(11);
    expect(secondsLeft(0, 5_000)).toBe(0);
  });
});

describe('AiBlock marks a less common reading (R10)', () => {
  it('names the usual reading of a valid variant, inside the box', () => {
    const readings = [
      { surface: '日本人', reading: 'にっぽんじん', verified: true, preferred: 'にほんじん' },
      { surface: '日本人', reading: 'にっぽんじん', verified: true, preferred: 'にほんじん' },
      { surface: '駅', reading: 'えき', verified: true },
    ];
    renderWithServices(<AiBlock readings={readings}>日本人 is a Japanese person.</AiBlock>);
    const note = screen.getByRole('note', { name: 'From the tutor' });
    const marks = within(note).getAllByText(/Less common reading/);
    expect(marks).toHaveLength(1);
    expect(marks[0]?.textContent).toBe(
      'Less common reading にっぽんじん for 日本人: the usual one is にほんじん.',
    );
    expect(marks[0]?.querySelectorAll('[lang="ja"]')).toHaveLength(3);
  });

  it('marks nothing for usual or unverified readings', () => {
    const readings = [{ surface: '駅', reading: 'えき', verified: true }];
    renderWithServices(<AiBlock readings={readings}>Text</AiBlock>);
    expect(screen.queryByText(/Less common reading/)).toBeNull();
  });
});
