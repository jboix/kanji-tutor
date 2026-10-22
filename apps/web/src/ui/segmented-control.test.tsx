import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './segmented-control.tsx';

const OPTIONS = [
  { value: 'draw', label: 'Draw' },
  { value: 'describe', label: 'Describe' },
] as const;

function Harness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState<'draw' | 'describe'>('draw');
  return (
    <SegmentedControl
      label="Input mode"
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

describe('SegmentedControl', () => {
  it('is a named group of radios with the current one checked', () => {
    render(<Harness onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Input mode' })).toBeDefined();
    expect(screen.getByRole('radio', { name: 'Draw' })).toHaveProperty('checked', true);
    expect(screen.getByRole('radio', { name: 'Describe' })).toHaveProperty('checked', false);
  });

  it('moves the selection with the arrow keys', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Draw' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('describe');
    expect(screen.getByRole('radio', { name: 'Describe' })).toHaveProperty('checked', true);
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('draw');
  });

  it('selects on click', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByText('Describe'));
    expect(onChange).toHaveBeenCalledWith('describe');
  });
});
