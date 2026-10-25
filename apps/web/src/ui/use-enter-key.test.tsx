import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEnterKey } from './use-enter-key.ts';

function Card({ action }: { action: (() => void) | undefined }) {
  useEnterKey(action);
  return (
    <>
      <input aria-label="Field" />
      <button type="button">Other</button>
    </>
  );
}

describe('useEnterKey', () => {
  it('moves on when Enter reaches the page, not a field or a button', () => {
    const action = vi.fn();
    render(<Card action={action} />);
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(action).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByLabelText('Field'), { key: 'Enter' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Other' }), { key: 'Enter' });
    fireEvent.keyDown(document.body, { key: 'Enter', repeat: true });
    fireEvent.keyDown(document.body, { key: 'a' });
    expect(action).toHaveBeenCalledOnce();
  });

  it('leaves Enter to an open sheet, and listens to nothing while busy', () => {
    const action = vi.fn();
    const { rerender } = render(<Card action={action} />);
    const sheet = document.createElement('div');
    sheet.setAttribute('aria-modal', 'true');
    document.body.append(sheet);
    fireEvent.keyDown(document.body, { key: 'Enter' });
    sheet.remove();
    rerender(<Card action={undefined} />);
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(action).not.toHaveBeenCalled();
  });
});
