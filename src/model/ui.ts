import { createEvent, createStore, sample } from 'effector';
import { persist } from 'effector-storage/local';
import type { BillLocation, DropTarget } from './types';
import { slotKey } from './types';
import { moneyShort } from '@/lib/money/format';
import { $wallet, piggyEmptied, spent, spreadDone } from './wallet';

export type Theme = 'light' | 'dark';
export const themeToggled = createEvent();
export const $theme = createStore<Theme>('light').on(themeToggled, t => (t === 'dark' ? 'light' : 'dark'));
persist({ store: $theme, key: 'nalichka:theme' });

export const muteToggled = createEvent();
export const $muted = createStore(false).on(muteToggled, m => !m);
persist({ store: $muted, key: 'nalichka:muted' });

/** Master volume 0..1. Quiet by default: these sounds play a lot. Moving the slider unmutes. */
export const volumeChanged = createEvent<number>();
export const $volume = createStore(0.3).on(volumeChanged, (_, v) => Math.min(1, Math.max(0, v)));
persist({ store: $volume, key: 'nalichka:volume' });
$muted.on(volumeChanged, (m, v) => (v > 0 ? false : m));

// Screen: the income ritual or the wall. First visit starts with income.
export const incomeOpened = createEvent();
export const wallOpened = createEvent();
export const tableReached = createEvent();
/**
 * Where the camera stands. The app is one tall stage — hand, table, wall — and the camera
 * pans between stops; the user never scrolls between them.
 * The wallet is already restored from storage here, so the first stop comes from it directly.
 */
export type Stop = 'hand' | 'table' | 'wall';
export const $stop = createStore<Stop>($wallet.getState().onboarded ? 'wall' : 'hand')
  .on(incomeOpened, () => 'hand')
  .on(tableReached, () => 'table')
  .on(wallOpened, () => 'wall');
/** Bumps on every new income ritual so the hand screen starts clean. */
export const $incomeRound = createStore(0).on(incomeOpened, n => n + 1);

export const welcomeClosed = createEvent();
export const $welcomeSeen = createStore(false).on(welcomeClosed, () => true);
persist({ store: $welcomeSeen, key: 'nalichka:welcome' });
// Fires only when the flag flips: first income, a currency reset, or another tab syncing storage.
const $onboarded = $wallet.map(w => w.onboarded);
sample({ clock: $onboarded, fn: (ob): Stop => (ob ? 'wall' : 'hand'), target: $stop });

// Drag of a single bill. The scene drives it, the DOM draws the ghost and highlights.
export type Drag = {
  /** Bills go anywhere; wallet coins only into the piggy. */
  kind: 'bill' | 'coin';
  billId: string;
  value: number;
  from: BillLocation;
  x: number;
  y: number;
  /** Grab point inside the bill, in screen px. */
  ox: number;
  oy: number;
  /** Screen px per scene px, for drawing the ghost at the bill's size. */
  k: number;
  target: DropTarget | null;
};
export const dragChanged = createEvent<Drag | null>();
export const $drag = createStore<Drag | null>(null).on(dragChanged, (_, d) => d);
export const $dragTarget = $drag.map(d => (d && d.target ? slotKey(d.target) : null));

// Spending by dropping bills into "Потрачено".
export type SpendDraft = { source: string; billIds: string[]; change: number[]; note: string; showNote: boolean };
export const draftStarted = createEvent<{ billId: string; from: BillLocation }>();
export const draftTopUp = createEvent<string>();
export const draftChanged = createEvent<Partial<Pick<SpendDraft, 'change' | 'note' | 'showNote'>>>();
export const draftCancelled = createEvent();
export const draftConfirmed = createEvent();
export const $spendDraft = createStore<SpendDraft | null>(null)
  .on(draftStarted, (_, { billId, from }) => ({ source: slotKey(from), billIds: [billId], change: [], note: '', showNote: false }))
  .on(draftTopUp, (d, id) => (d ? { ...d, billIds: [...d.billIds, id] } : d))
  .on(draftChanged, (d, patch) => (d ? { ...d, ...patch } : d))
  .reset(draftCancelled, spent);
sample({
  clock: draftConfirmed,
  source: $spendDraft,
  filter: d => d !== null,
  fn: d => ({ source: d!.source, billIds: d!.billIds, change: d!.change, label: d!.note }),
  target: spent,
});
/** Last bill pushed into the till slot; `key` restarts its slide-in animation. */
/**
 * The bill in the till slot: it hovers while the spend dialog is open, then the till swallows it
 * (spent) or spits it back (cancelled), and it is gone. `key` restarts the animation.
 */
export type TillBill = { value: number; key: number; state: 'waiting' | 'eaten' | 'returned' };
/** Manual spends feed the till directly with the bill they paid with. */
export const tillFed = createEvent<number>();
export const tillCleared = createEvent();
export const $tillBill = createStore<TillBill | null>(null)
  .on(tillFed, (t, value) => ({ value, key: (t?.key ?? 0) + 1, state: 'eaten' }))
  .on(draftConfirmed, t => (t ? { ...t, state: 'eaten' } : t))
  .on(draftCancelled, t => (t ? { ...t, state: 'returned' } : t))
  .reset(tillCleared);
sample({
  clock: [draftStarted.map(p => p.billId), draftTopUp],
  source: { w: $wallet, t: $tillBill },
  fn: ({ w, t }, id): TillBill | null => {
    const value = w.bills.find(b => b.id === id)?.value;
    return value ? { value, key: (t?.key ?? 0) + 1, state: 'waiting' } : t;
  },
  target: $tillBill,
});

/**
 * Each swallowed bill comes out under the slot as shredded strips. Kept apart from $tillBill,
 * which clears as soon as the bill is gone, while the strips are still falling.
 */
export const $shred = createStore<{ key: number; value: number } | null>(null);
sample({
  clock: $tillBill,
  filter: t => t?.state === 'eaten',
  fn: t => ({ key: t!.key, value: t!.value }),
  target: $shred,
});

/** Exchange dialog for the money lying in one place (a cell or the wallet). */
export const exchangeOpened = createEvent<BillLocation | null>();
export const $exchangeAt = createStore<BillLocation | null>(null).on(exchangeOpened, (_, loc) => loc);

export const receiptEditOpened = createEvent<string | null>();
export const $editingReceipt = createStore<string | null>(null).on(receiptEditOpened, (_, id) => id);
/** Bills that sit in an open draft are hidden from the wall. */
export const $draftBillIds = $spendDraft.map(d => new Set(d?.billIds ?? []));

export const manualSpendToggled = createEvent<boolean>();
export const $manualSpendOpen = createStore(false).on(manualSpendToggled, (_, v) => v).reset(spent);

// Piggy: ask → shake three times → broken → take.
export type PigFlow = { step: 'ask' | 'shake' | 'broken'; shakes: number };
export const pigOpened = createEvent();
export const pigClosed = createEvent();
export const pigAgreed = createEvent();
export const pigShaken = createEvent();
export const SHAKES_TO_BREAK = 3;
export const $pigFlow = createStore<PigFlow | null>(null)
  .on(pigOpened, () => ({ step: 'ask', shakes: 0 }))
  .on(pigAgreed, f => (f ? { ...f, step: 'shake' } : f))
  .on(pigShaken, f => {
    if (!f || f.step !== 'shake') return f;
    const shakes = f.shakes + 1;
    return { step: shakes >= SHAKES_TO_BREAK ? 'broken' : 'shake', shakes };
  })
  .reset(pigClosed, piggyEmptied);

export const categoryEditOpened = createEvent<string | null>();
export const $editingCategory = createStore<string | null>(null).on(categoryEditOpened, (_, id) => id);

export const toastShown = createEvent<string>();
export const toastHidden = createEvent();
export const $toast = createStore<{ text: string; key: number } | null>(null)
  .on(toastShown, (t, text) => ({ text, key: (t?.key ?? 0) + 1 }))
  .reset(toastHidden);

sample({
  clock: spreadDone,
  fn: moved => (moved ? 'Разложил как в прошлый раз. Стабильность — признак мастерства' : 'Подходящих купюр нет. Тут нужен человек'),
  target: toastShown,
});
sample({
  clock: piggyEmptied,
  fn: taken =>
    taken
      ? `Забрал ${moneyShort(taken)} в кошелёк. Новая свинка уже на месте и снова голодает`
      : 'Мелочи не набралось даже на купюру. Свинка возвращается на полку',
  target: toastShown,
});
