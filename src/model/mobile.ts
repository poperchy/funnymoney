import { createEvent, createStore } from 'effector';
import type { BillLocation } from './types';
import { incomeOpened } from './ui';

/** Bottom sheet open on the phone. The piggy has its own (`$pigFlow`). */
export type MobileSheet =
  /** Tap on a cell or the wallet: how much is there, and what to do with it. */
  | { type: 'cell'; loc: BillLocation }
  | { type: 'receipts'; tab?: 'receipts' | 'stats' }
  | { type: 'menu' }
  /** Spending by typing an amount; `source` preselects the cell. */
  | { type: 'spend'; source?: string }
  /** Typing how much goes where, from the pile or a cell. */
  | { type: 'distribute'; source: string };

export const sheetOpened = createEvent<MobileSheet>();
export const sheetClosed = createEvent();
export const $sheet = createStore<MobileSheet | null>(null)
  .on(sheetOpened, (_, s) => s)
  .reset(sheetClosed, incomeOpened);
