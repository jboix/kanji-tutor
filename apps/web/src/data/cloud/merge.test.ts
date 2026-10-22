import { describe, expect, it } from 'vitest';
import { item, review, save } from '../../test/cloud-saves.ts';
import { mergeSaves } from './merge.ts';

describe('merging two saves', () => {
  it('keeps each item at its newer update, whichever side has it', () => {
    const mine = save({ items: [item('1', 5), item('2', 1)] }).data;
    const theirs = save({ items: [item('1', 3), item('2', 9), item('3', 1)] }).data;
    const merged = mergeSaves(mine, theirs, 'mine');
    const at = Object.fromEntries(merged.items.map((i) => [i.ref, i.updatedAt]));
    expect(at).toEqual({ '1': 5, '2': 9, '3': 1 });
  });

  it('keeps both histories of reviews, once each, without their local numbers', () => {
    const mine = save({ reviews: [review('1', 10, 1), review('1', 20, 2)] }).data;
    const theirs = save({ reviews: [review('1', 10, 7), review('2', 30, 8)] }).data;
    const merged = mergeSaves(mine, theirs, 'mine');
    expect(merged.reviews.map((r) => `${r.itemId}@${r.at}`).sort()).toEqual([
      'word:1@10',
      'word:1@20',
      'word:2@30',
    ]);
    expect(merged.reviews.every((r) => !('id' in r))).toBe(true);
  });

  it('lets the preferred side win what says nothing of its age: notes, settings', () => {
    const note = (body: string) => ({ id: 'n1', createdAt: 1, title: 'て形', body });
    const mine = save({ notes: [note('mine')] }).data;
    const theirs = save({ notes: [note('theirs')] }).data;
    theirs.settings = { ...theirs.settings, onboarded: true };
    expect(mergeSaves(mine, theirs, 'mine').notes[0]?.body).toBe('mine');
    const first = mergeSaves(mine, theirs, 'theirs');
    expect([first.notes[0]?.body, first.settings.onboarded]).toEqual(['theirs', true]);
  });
});
