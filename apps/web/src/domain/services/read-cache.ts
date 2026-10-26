/**
 * Shared reads for one screen's worth of work (N10): Today's steps run side by side and each
 * reads the word items, the settings and the kanji readings. Over this view they are read once
 * and shared; a write through it drops what was read.
 */
import type { Repos, Store } from '../repos.ts';
import type { Item, ItemKind, KanjiReading, Settings } from '../types.ts';

type Memo = Map<string, Promise<unknown>>;

function once<T>(memo: Memo, key: string, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const next = load();
  memo.set(key, next);
  return next;
}

/** A copy for each caller, so one that sorts its list in place does not reorder another's. */
const copy = <T>(list: Promise<T[]>) => list.then((values) => [...values]);

/** A store's writes, each dropping every shared read first. */
function writes<T, K extends string>(base: Store<T, K>, memo: Memo) {
  return {
    put: (value: T) => {
      memo.clear();
      return base.put(value);
    },
    putMany: (values: readonly T[]) => {
      memo.clear();
      return base.putMany(values);
    },
    delete: (key: K) => {
      memo.clear();
      return base.delete(key);
    },
  };
}

function items(base: Repos['items'], memo: Memo): Repos['items'] {
  return Object.assign(Object.create(base) as Repos['items'], {
    byKind: (kind: ItemKind) => copy(once<Item[]>(memo, `items:${kind}`, () => base.byKind(kind))),
    ...writes(base, memo),
  });
}

function kanjiReadings(base: Repos['kanjiReadings'], memo: Memo): Repos['kanjiReadings'] {
  return Object.assign(Object.create(base) as Repos['kanjiReadings'], {
    all: () => copy(once<KanjiReading[]>(memo, 'kanjiReadings', () => base.all())),
    ...writes(base, memo),
  });
}

function settings(base: Repos['settings'], memo: Memo): Repos['settings'] {
  return {
    get: () => once<Settings>(memo, 'settings', () => base.get()).then((s) => ({ ...s })),
    patch: (patch) => {
      memo.clear();
      return base.patch(patch);
    },
  };
}

/** Each shared view's memo, so results built from its reads can be kept with them. */
const memos = new WeakMap<Repos, Memo>();

/** The repos with word items, settings and kanji readings read once while in use (N10). */
export function sharedReads(repos: Repos): Repos {
  const memo: Memo = new Map();
  const view: Repos = {
    ...repos,
    items: items(repos.items, memo),
    kanjiReadings: kanjiReadings(repos.kanjiReadings, memo),
    settings: settings(repos.settings, memo),
  };
  memos.set(view, memo);
  return view;
}

/**
 * `load`'s result, built once per shared view and dropped with its reads on a write through it.
 * Over repos that are not a shared view, `load` runs on every call. The result is shared, so
 * callers must not change it.
 */
export function sharedResult<T>(repos: Repos, key: string, load: () => Promise<T>): Promise<T> {
  const memo = memos.get(repos);
  return memo ? once(memo, key, load) : load();
}
