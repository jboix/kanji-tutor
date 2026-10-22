import { describe, expect, it } from 'vitest';
import { EMPTY_INK, type Ink, type InkAction, inkReducer, paintedStrokes } from './ink.ts';

const run = (actions: InkAction[], from: Ink = EMPTY_INK) => actions.reduce(inkReducer, from);

const line = (y: number): InkAction[] => [
  { type: 'down', point: [10, y] },
  { type: 'move', points: [[20, y]] },
  {
    type: 'move',
    points: [
      [30, y],
      [40, y],
    ],
  },
  { type: 'up' },
];

describe('ink reducer', () => {
  it('captures each stroke as its point list', () => {
    const ink = run([...line(5), ...line(9)]);
    expect(ink.current).toBeUndefined();
    expect(ink.strokes).toEqual([
      [
        [10, 5],
        [20, 5],
        [30, 5],
        [40, 5],
      ],
      [
        [10, 9],
        [20, 9],
        [30, 9],
        [40, 9],
      ],
    ]);
  });

  it('paints the stroke being drawn without finishing it', () => {
    const ink = run([
      ...line(5),
      { type: 'down', point: [1, 1] },
      { type: 'move', points: [[2, 2]] },
    ]);
    expect(ink.strokes).toHaveLength(1);
    expect(paintedStrokes(ink)).toHaveLength(2);
    expect(paintedStrokes(ink)[1]).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it('ignores moves and ups with no finger down', () => {
    const ink = run([{ type: 'move', points: [[1, 1]] }, { type: 'up' }]);
    expect(ink).toBe(EMPTY_INK);
  });

  it('keeps the finished strokes array while a new stroke is drawn', () => {
    const before = run(line(5));
    const during = run(
      [
        { type: 'down', point: [0, 0] },
        { type: 'move', points: [[1, 1]] },
      ],
      before,
    );
    expect(during.strokes).toBe(before.strokes);
  });

  it('undoes the last stroke, then the one before', () => {
    const ink = run([...line(1), ...line(2), ...line(3), { type: 'undo' }]);
    expect(ink.strokes.map((s) => s[0]?.[1])).toEqual([1, 2]);
    expect(run([{ type: 'undo' }, { type: 'undo' }, { type: 'undo' }], ink).strokes).toEqual([]);
  });

  it('undo while drawing drops only the unfinished stroke', () => {
    const ink = run([...line(1), { type: 'down', point: [0, 0] }, { type: 'undo' }]);
    expect(ink.strokes).toHaveLength(1);
    expect(ink.current).toBeUndefined();
  });

  it('cancel drops the unfinished stroke and clear empties everything', () => {
    const drawn = run([...line(1), { type: 'down', point: [0, 0] }, { type: 'cancel' }]);
    expect(drawn.strokes).toHaveLength(1);
    expect(run([{ type: 'clear' }], drawn)).toEqual(EMPTY_INK);
  });
});
