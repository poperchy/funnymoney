import { createEvent, createStore } from 'effector';
import type { BillLocation } from './types';
import { draftStarted, incomeOpened } from './ui';

/**
 * Bottom sheet open on the phone. Spending has its own sheet driven by `$spendDraft`.
 * `cell` is the one-tap fallback for dragging: pick a bill in a cell (or the pile) and say where it goes.
 */
export type MobileSheet =
  | { type: 'cell'; loc: BillLocation; sel: string | null }
  | { type: 'pig' }
  | { type: 'receipts' }
  | { type: 'menu' };

export const sheetOpened = createEvent<MobileSheet>();
export const sheetClosed = createEvent();
export const cellPicked = createEvent<string | null>();
export const $sheet = createStore<MobileSheet | null>(null)
  .on(sheetOpened, (_, s) => s)
  .on(cellPicked, (s, sel) => (s?.type === 'cell' ? { ...s, sel } : s))
  .reset(sheetClosed, draftStarted, incomeOpened);
