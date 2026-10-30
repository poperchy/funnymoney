import { createEvent, createStore, sample } from 'effector';
import { persist } from 'effector-storage/local';
import type { CurrencyCode } from '@/lib/money/currency';
import { emptyWallet } from './defaults';
import * as ops from './ops';
import { computeLayout } from '@/scene/layout';
import type { BillLocation, Category, Pose, Wallet } from './types';

export const $wallet = createStore<Wallet>(emptyWallet());

export const incomeReceived = createEvent<{ bills: number[]; coins: number[] }>();
export const billMoved = createEvent<{ id: string; to: BillLocation; pose?: Pose }>();
export const coinMoved = createEvent<{ id: string; to: BillLocation }>();
export const spent = createEvent<ops.SpendInput>();
export const spreadRequested = createEvent();
export const piggyBroken = createEvent();
export const categoryUpdated = createEvent<{ id: string } & ops.CategoryPatch>();
export const categoryAdded = createEvent<Omit<Category, 'id'>>();
export const categoryRemoved = createEvent<string>();
export const currencyChanged = createEvent<CurrencyCode>();
export const walletReset = createEvent();
export const receiptEdited = createEvent<{ id: string; edit: ops.ReceiptEdit }>();
export const receiptDeleted = createEvent<string>();
export const exchangeSplit = createEvent<string>();
export const exchangeMerge = createEvent<{ loc: BillLocation; target: number }>();
/** Amounts typed in by hand, moved from one place to several cells. */
export const amountsDistributed = createEvent<{ source: string; parts: { target: string; amount: number }[] }>();

$wallet
  .on(incomeReceived, (w, { bills, coins }) => ops.addIncome(w, bills, coins))
  .on(billMoved, (w, { id, to, pose }) => ops.moveBill(w, id, to, pose))
  .on(coinMoved, (w, { id, to }) => ops.moveCoin(w, id, to))
  .on(spent, (w, input) => ops.spend(w, input))
  .on(categoryUpdated, (w, { id, ...patch }) => ops.updateCategory(w, id, patch))
  .on(categoryAdded, (w, c) => ops.addCategory(w, c))
  .on(categoryRemoved, (w, id) => ops.removeCategory(w, id))
  .on(currencyChanged, (_, code) => emptyWallet(code))
  .on(walletReset, w => emptyWallet(w.currency))
  .on(receiptEdited, (w, { id, edit }) => ops.editReceipt(w, id, edit))
  .on(receiptDeleted, (w, id) => ops.deleteReceipt(w, id))
  .on(exchangeSplit, (w, id) => ops.exchangeSplit(w, id))
  .on(exchangeMerge, (w, { loc, target }) => ops.exchangeMerge(w, loc, target))
  .on(amountsDistributed, (w, { source, parts }) => ops.distribute(w, source, parts).wallet);

const spreadComputed = sample({ clock: spreadRequested, source: $wallet, fn: w => ops.autoSpread(w) });
$wallet.on(spreadComputed, (_, r) => r.wallet);
/** How many bills the spread moved. */
export const spreadDone = sample({ clock: spreadComputed, fn: r => r.moved });

const piggyComputed = sample({ clock: piggyBroken, source: $wallet, fn: w => ops.breakPiggy(w) });
$wallet.on(piggyComputed, (_, r) => r.wallet);
/** How much money came out of the piggy as bills. */
export const piggyEmptied = sample({ clock: piggyComputed, fn: r => r.taken });

persist({ store: $wallet, key: 'nalichka:wallet' });

export const $currency = $wallet.map(ops.currencyOf);
export const $balance = $wallet.map(ops.balance);
export const $piggyTotal = $wallet.map(ops.piggyTotal);
export const $pileTotal = $wallet.map(ops.pileTotal);
/** Recomputed only when categories change: map() skips identical values. */
export const $categories = $wallet.map(w => w.categories);
export const $layout = $categories.map(computeLayout);
