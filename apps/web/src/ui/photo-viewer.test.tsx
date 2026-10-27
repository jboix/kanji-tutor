import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithServices } from '../test/render.tsx';
import { PhotoViewer } from './photo-viewer.tsx';

function render() {
  const onClose = vi.fn();
  renderWithServices(
    <PhotoViewer url="blob:page" label="Page 1 of your handout" onClose={onClose} />,
  );
  const stage = screen.getByTestId('photo-stage');
  const image = () => screen.getByRole('img', { name: 'Page 1 of your handout' });
  return { onClose, stage, image };
}

const touch = (stage: HTMLElement, id: number, x: number, y = 100) => ({
  down: () => fireEvent.pointerDown(stage, { pointerId: id, clientX: x, clientY: y }),
  move: (to: number) => fireEvent.pointerMove(stage, { pointerId: id, clientX: to, clientY: y }),
  up: () => fireEvent.pointerUp(stage, { pointerId: id, clientX: x, clientY: y }),
});

describe('PhotoViewer', () => {
  it('shows the photo on the whole screen and closes with its button or Escape', () => {
    const { onClose, image } = render();
    expect(screen.getByRole('dialog', { name: 'Page 1 of your handout' })).toBeTruthy();
    expect(image().getAttribute('src')).toBe('blob:page');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('zooms in on a double tap and back out on the next', () => {
    const { stage, image } = render();
    const finger = touch(stage, 1, 50);
    finger.down();
    finger.up();
    finger.down();
    finger.up();
    expect(image().style.transform).toContain('scale(2.5)');
    finger.down();
    finger.up();
    finger.down();
    finger.up();
    expect(image().style.transform).toContain('scale(1)');
  });

  it('zooms with two fingers spreading apart, never below the whole photo', () => {
    const { stage, image } = render();
    const [a, b] = [touch(stage, 1, 100), touch(stage, 2, 200)];
    a.down();
    b.down();
    b.move(300);
    expect(image().style.transform).toContain('scale(2)');
    b.move(110);
    expect(image().style.transform).toContain('scale(1)');
  });

  it('says so when the photo can no longer be read', () => {
    const { image } = render();
    fireEvent.error(image());
    expect(screen.getByText(/can no longer be shown/)).toBeTruthy();
  });
});
