import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AnswerInput } from './answer-input.tsx';

describe('AnswerInput', () => {
  it('turns romaji into kana as it is typed', async () => {
    render(<AnswerInput label="Reading" onSubmit={vi.fn()} />);
    const field = screen.getByLabelText('Reading');
    await userEvent.type(field, 'matte');
    expect(field).toHaveProperty('value', 'まって');
  });

  it('keeps a trailing n open while typing and submits it as ん on Enter', async () => {
    const onSubmit = vi.fn();
    render(<AnswerInput label="Reading" onSubmit={onSubmit} />);
    const field = screen.getByLabelText('Reading');
    await userEvent.type(field, 'kan');
    expect(field).toHaveProperty('value', 'かn');
    await userEvent.type(field, '{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('かん');
    expect(field).toHaveProperty('value', 'かん');
  });

  it('marks the kana field as Japanese and turns off autocorrection', () => {
    render(<AnswerInput label="Reading" onSubmit={vi.fn()} />);
    const field = screen.getByLabelText('Reading');
    expect(field.getAttribute('lang')).toBe('ja');
    expect(field.getAttribute('autocapitalize')).toBe('none');
    expect(field.getAttribute('autocomplete')).toBe('off');
    expect(field.getAttribute('enterkeyhint')).toBe('done');
  });

  it('does not submit an empty answer', async () => {
    const onSubmit = vi.fn();
    render(<AnswerInput label="Reading" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Reading'), '   {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('leaves ask text alone and clears it after sending', async () => {
    const onSubmit = vi.fn();
    render(<AnswerInput variant="ask" label="Ask" onSubmit={onSubmit} clearOnSubmit />);
    const field = screen.getByLabelText('Ask');
    await userEvent.type(field, 'why ni here?{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('why ni here?');
    expect(field).toHaveProperty('value', '');
    expect(field.getAttribute('lang')).toBeNull();
  });

  it('renders the trailing slot', () => {
    render(
      <AnswerInput
        label="Ask"
        onSubmit={vi.fn()}
        trailing={
          <button type="button" aria-label="Ask by voice">
            mic
          </button>
        }
      />,
    );
    expect(screen.getByRole('button', { name: 'Ask by voice' })).toBeDefined();
  });

  it('sends the answer with its own arrow, no return key, and only once there is one (U9)', async () => {
    const onSubmit = vi.fn();
    render(<AnswerInput label="Reading" onSubmit={onSubmit} />);
    const send = screen.getByRole('button', { name: 'Send answer' });
    expect(send).toHaveProperty('disabled', true);
    await userEvent.type(screen.getByLabelText('Reading'), 'matte');
    expect(send).toHaveProperty('disabled', false);
    await userEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith('まって');
  });

  it('has no submit arrow in the free-text ask box unless asked for', () => {
    render(<AnswerInput label="Ask" variant="ask" onSubmit={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Send answer' })).toBeNull();
  });
});
