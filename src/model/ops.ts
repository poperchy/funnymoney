// Pure wallet operations. Effector stores call these; the scene only animates the result.
import { CURRENCIES, type Currency } from '@/lib/money/currency';
import { decompose, pickBills, splitChange, sum } from '@/lib/money/math';
import { gauss, rng, uid } from '@/lib/rng';
import { FILL_ORDER, MAX_CATEGORIES } from './defaults';
import { coinLocation, coinPlace, inPiggy, inWallet, sameSlot, type Bill, type BillLocation, type Category, type Coin, type Pose, type Wallet } from './types';

const PILE: BillLocation = { type: 'pile' };
const PIGGY: BillLocation = { type: 'piggy' };
const MAX_RECEIPTS = 300;

export const currencyOf = (w: Wallet): Currency => CURRENCIES[w.currency];
export const billsIn = (w: Wallet, loc: BillLocation) => w.bills.filter(b => sameSlot(b.location, loc));
export const coinsIn = (w: Wallet, loc: BillLocation) => w.coins.filter(c => sameSlot(coinLocation(c), loc));
/** Everything lying somewhere, bills and coins. */
export const totalIn = (w: Wallet, loc: BillLocation) => sum([...billsIn(w, loc), ...coinsIn(w, loc)].map(b => b.value));
export const coinTotal = (w: Wallet) => sum(w.coins.map(c => c.value));
export const walletCoins = (w: Wallet) => w.coins.filter(inWallet);
export const piggyCoins = (w: Wallet) => w.coins.filter(inPiggy);
export const piggyTotal = (w: Wallet) => totalIn(w, PIGGY);
/** The big wallet under the board ("pile" in code): its bills plus the coins in its pocket. */
export const pileTotal = (w: Wallet) => totalIn(w, PILE);
export const balance = (w: Wallet) => sum(w.bills.map(b => b.value)) + coinTotal(w);
export const sourceLocation = (source: string): BillLocation => (source === 'pile' ? PILE : { type: 'cell', cellId: source });

export function randomPose(loc: BillLocation, r: () => number = Math.random): Pose {
  // Stuffed into the wallet any old way.
  if (loc.type === 'pile') return { x: r(), y: r(), r: gauss(r) * 34 };
  if (loc.type === 'piggy') return { x: r(), y: r(), r: (r() - 0.5) * 40 };
  return { x: r(), y: r(), r: (r() - 0.5) * 26 };
}

const nextZ = (w: Wallet) => w.bills.reduce((m, b) => Math.max(m, b.z), 0) + 1;

function makeBills(w: Wallet, values: number[], loc: BillLocation): Bill[] {
  const r = rng(Date.now() % 1e6);
  let z = nextZ(w);
  return values.map(value => ({ id: uid('b'), value, location: loc, pose: randomPose(loc, r), z: z++ }));
}

const makeCoins = (values: number[], location: Coin['location']): Coin[] => values.map(value => ({ id: uid('c'), value, location }));

export function addIncome(w: Wallet, bills: number[], coins: number[]): Wallet {
  return {
    ...w,
    onboarded: true,
    lastIncome: sum(bills) + sum(coins),
    bills: [...w.bills, ...makeBills(w, bills, PILE)],
    coins: [...w.coins, ...makeCoins(coins, 'wallet')],
  };
}

/** A loose coin carried somewhere: a cell, the wallet pocket, or the piggy. */
export function moveCoin(w: Wallet, id: string, to: BillLocation): Wallet {
  return { ...w, coins: w.coins.map(c => (c.id === id ? { ...c, ...coinPlace(to) } : c)) };
}

export function moveBill(w: Wallet, id: string, to: BillLocation, pose?: Pose): Wallet {
  const z = nextZ(w);
  return {
    ...w,
    bills: w.bills.map(b => (b.id === id ? { ...b, location: to, pose: pose ?? randomPose(to), z } : b)),
  };
}

export type SpendInput = { source: string; billIds: string[]; change: number[]; label?: string };

/** Paid bills (and wallet coins) leave, change bills return to where the money came from, change coins drop into the piggy. */
export function spend(w: Wallet, { source, billIds, change, label }: SpendInput): Wallet {
  const ids = new Set(billIds);
  const paid = sum([...w.bills, ...w.coins].filter(b => ids.has(b.id)).map(b => b.value));
  const amount = paid - sum(change);
  if (amount <= 0) return w;
  const rest = pay(w, source, ids, change);
  const name = source === 'pile' ? 'Из кошелька' : w.categories.find(c => c.id === source)?.name ?? '';
  return {
    ...rest,
    receipts: [
      { id: uid('r'), label: label?.trim() || name, source, amount, paid, at: new Date().toISOString() },
      ...w.receipts,
    ].slice(0, MAX_RECEIPTS),
  };
}

/** Hands over the given bills/coins; change bills go back to the source, change coins to the piggy. */
function pay(w: Wallet, source: string, ids: Set<string>, change: number[]): Wallet {
  const cur = currencyOf(w);
  const rest = { ...w, bills: w.bills.filter(b => !ids.has(b.id)), coins: w.coins.filter(c => !ids.has(c.id)) };
  return {
    ...rest,
    bills: [...rest.bills, ...makeBills(rest, change.filter(v => v >= cur.bills[0]), sourceLocation(source))],
    coins: [...rest.coins, ...makeCoins(change.filter(v => v < cur.bills[0]), 'piggy')],
  };
}

/** Money coming back (a corrected receipt): bills into the source, the odd kopecks into the wallet pocket. */
function refund(w: Wallet, source: string, amount: number): Wallet {
  const cur = currencyOf(w);
  const bills = decompose(amount, cur.bills);
  const coins = decompose(amount - sum(bills), cur.coins);
  // The cell may have been taken off the wall since; then the money goes to the wallet.
  const to = source === 'pile' || w.categories.some(c => c.id === source) ? source : 'pile';
  return { ...w, bills: [...w.bills, ...makeBills(w, bills, sourceLocation(to))], coins: [...w.coins, ...makeCoins(coins, 'wallet')] };
}

export type ReceiptEdit = { label: string; amount: number; source: string };

export type ReceiptEditPlan =
  | { ok: true; refund: { source: string; amount: number } | null; charge: { source: string; amount: number; plan: Extract<SpendPlan, { ok: true }> } | null }
  | { ok: false; reason: 'no-amount' | 'not-enough' | 'missing'; source?: string; total?: number; need?: number };

/**
 * Fixing a receipt moves real money: spent less → the difference comes back; spent more → it is taken
 * from the cell like a normal purchase; another cell → the old one is refunded and the new one pays.
 */
export function planReceiptEdit(w: Wallet, id: string, edit: ReceiptEdit): ReceiptEditPlan {
  const r = w.receipts.find(x => x.id === id);
  if (!r) return { ok: false, reason: 'missing' };
  if (edit.amount <= 0) return { ok: false, reason: 'no-amount' };
  const moved = edit.source !== r.source;
  const back = moved ? r.amount : Math.max(0, r.amount - edit.amount);
  const more = moved ? edit.amount : Math.max(0, edit.amount - r.amount);
  const refunded = back ? refund(w, r.source, back) : w;
  if (!more) return { ok: true, refund: back ? { source: r.source, amount: back } : null, charge: null };
  // The refund lands first, so moving within the same cell can reuse it — but a different cell can't.
  const plan = planSpend(moved ? refunded : w, edit.source, more);
  if (!plan.ok) return { ok: false, reason: 'not-enough', source: edit.source, total: plan.total, need: more };
  return { ok: true, refund: back ? { source: r.source, amount: back } : null, charge: { source: edit.source, amount: more, plan } };
}

export function editReceipt(w: Wallet, id: string, edit: ReceiptEdit): Wallet {
  const plan = planReceiptEdit(w, id, edit);
  if (!plan.ok) return w;
  const r = w.receipts.find(x => x.id === id)!;
  let next = plan.refund ? refund(w, plan.refund.source, plan.refund.amount) : w;
  let paid = edit.source !== r.source ? 0 : r.paid;
  if (plan.charge) {
    const { taken, back, coins } = plan.charge.plan;
    next = pay(next, edit.source, new Set(taken.map(t => t.id)), [...back, ...coins]);
    paid += plan.charge.plan.paid;
  }
  const receipt = { ...r, label: edit.label.trim() || r.label, amount: edit.amount, source: edit.source, paid: Math.max(paid, edit.amount) };
  return { ...next, receipts: next.receipts.map(x => (x.id === id ? receipt : x)) };
}

/** "Never happened": the whole amount returns to where it was spent from. */
export function deleteReceipt(w: Wallet, id: string): Wallet {
  const r = w.receipts.find(x => x.id === id);
  if (!r) return w;
  const back = refund(w, r.source, r.amount);
  return { ...back, receipts: back.receipts.filter(x => x.id !== id) };
}

export type SpendPlan =
  | { ok: false; total: number; reason: 'no-amount' | 'not-enough' }
  | { ok: true; total: number; taken: Payable[]; paid: number; back: number[]; coins: number[] };

/** Something you can hand over: a bill, or a coin from the wallet pocket. */
export type Payable = { id: string; value: number };

export function planSpend(w: Wallet, source: string, amount: number): SpendPlan {
  const loc = sourceLocation(source);
  const available: Payable[] = [...billsIn(w, loc), ...coinsIn(w, loc)];
  const total = sum(available.map(b => b.value));
  if (amount <= 0) return { ok: false, total, reason: 'no-amount' };
  const taken = pickBills(available, amount);
  if (!taken) return { ok: false, total, reason: 'not-enough' };
  const paid = sum(taken.map(b => b.value));
  const { bills, coins } = splitChange(paid - amount, currencyOf(w));
  return { ok: true, total, taken, paid, back: bills, coins };
}

const fillOrder = (cats: Category[]) =>
  [...cats].sort((a, b) => {
    const ia = FILL_ORDER.indexOf(a.id), ib = FILL_ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

export const budgetsInFillOrder = (w: Wallet) => fillOrder(w.categories).map(c => c.budget);

/** Moves pile bills into cells until each reaches its budget: biggest bills first, must-pay cells first. */
export function autoSpread(w: Wallet): { wallet: Wallet; moved: number } {
  const order = fillOrder(w.categories);
  const need: Record<string, number> = {};
  for (const c of order) need[c.id] = c.budget - totalIn(w, { type: 'cell', cellId: c.id });
  const r = rng(Date.now() % 1e6);
  let z = nextZ(w);
  let moved = 0;
  const pile = billsIn(w, PILE).sort((a, b) => b.value - a.value);
  const moves = new Map<string, Bill>();
  for (const b of pile) {
    const target = order.find(c => need[c.id] >= b.value);
    if (!target) continue;
    need[target.id] -= b.value;
    const loc: BillLocation = { type: 'cell', cellId: target.id };
    moves.set(b.id, { ...b, location: loc, pose: randomPose(loc, r), z: z++ });
    moved++;
  }
  return { wallet: { ...w, bills: w.bills.map(b => moves.get(b.id) ?? b) }, moved };
}

/**
 * Everything comes out: coins are exchanged for bills where possible, and those bills, the bills that
 * were inside, and the coins too small to exchange all land in the wallet. The piggy is left empty.
 */
export function breakPiggy(w: Wallet): { wallet: Wallet; taken: number } {
  const cur = currencyOf(w);
  const coinsSum = sum(piggyCoins(w).map(c => c.value));
  const exchanged = decompose(coinsSum, cur.bills);
  const leftover = decompose(coinsSum - sum(exchanged), cur.coins);
  const fromPiggy = billsIn(w, PIGGY);
  const r = rng(Date.now() % 1e6);
  const moved = new Map(fromPiggy.map(b => [b.id, { ...b, location: PILE, pose: randomPose(PILE, r) }]));
  const base = { ...w, bills: w.bills.map(b => moved.get(b.id) ?? b) };
  return {
    wallet: {
      ...base,
      bills: [...base.bills, ...makeBills(base, exchanged, PILE)],
      coins: [...w.coins.filter(c => !inPiggy(c)), ...makeCoins(leftover, 'wallet')],
    },
    taken: coinsSum + sum(fromPiggy.map(b => b.value)),
  };
}

// Typical purchases in BYN kopecks: groceries, a lunch, a big shop, a coffee.
const FREQ_BYN = [1500, 4000, 12000, 850];

/** Amounts you spend most often, padded with typical ones for a fresh wallet. */
export function frequentAmounts(w: Wallet, n = 4): number[] {
  const cur = currencyOf(w);
  const counts = new Map<number, number>();
  for (const r of w.receipts) counts.set(r.amount, (counts.get(r.amount) ?? 0) + 1);
  const top = [...counts].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).map(([a]) => a);
  const step = cur.coins[cur.coins.length - 1];
  const typical = FREQ_BYN.map(v => Math.max(step, Math.round((v * cur.scale) / step) * step));
  return [...new Set([...top, ...typical])].slice(0, n);
}

export type CategoryPatch = Partial<Pick<Category, 'name' | 'budget' | 'colSpan' | 'rowSpan'>>;

export function updateCategory(w: Wallet, id: string, patch: CategoryPatch): Wallet {
  return { ...w, categories: w.categories.map(c => (c.id === id ? { ...c, ...patch } : c)) };
}

export function addCategory(w: Wallet, c: Omit<Category, 'id'>): Wallet {
  if (w.categories.length >= MAX_CATEGORIES) return w;
  return { ...w, categories: [...w.categories, { ...c, id: uid('cat') }] };
}

/** The cell goes away; whatever lay in it falls back into the pile. */
export function removeCategory(w: Wallet, id: string): Wallet {
  const r = rng(Date.now() % 1e6);
  return {
    ...w,
    categories: w.categories.filter(c => c.id !== id),
    bills: w.bills.map(b => (b.location.type === 'cell' && b.location.cellId === id ? { ...b, location: PILE, pose: randomPose(PILE, r) } : b)),
    coins: w.coins.map(c => (c.location === 'cell' && c.cellId === id ? { ...c, ...coinPlace(PILE) } : c)),
  };
}

// ── Exchange: breaking a bill into smaller money, or gathering small money into one bill ──

export type ExchangeOptions = {
  /** Each distinct value that can be broken, with what it turns into. */
  split: { value: number; id: string; pieces: number[] }[];
  /** Each bigger bill that can be gathered from smaller money lying here. */
  merge: { target: number; ids: string[]; parts: number[] }[];
};

const looseHere = (w: Wallet, loc: BillLocation): Payable[] =>
  loc.type === 'piggy' ? [] : [...billsIn(w, loc), ...coinsIn(w, loc)];

/** What a value breaks into: the next denomination down, then whatever completes it. 100 → 50 + 50, 5 → 2 + 2 + 1. */
export function piecesFor(value: number, cur: Currency): number[] {
  const smaller = [...cur.bills, ...cur.coins].filter(d => d < value);
  if (!smaller.length) return [];
  const pieces = decompose(value, smaller);
  return sum(pieces) === value ? pieces : [];
}

export function exchangeOptions(w: Wallet, loc: BillLocation): ExchangeOptions {
  const cur = currencyOf(w);
  const items = looseHere(w, loc).sort((a, b) => b.value - a.value);
  const split = [...new Map(items.map(i => [i.value, i])).values()]
    .map(i => ({ value: i.value, id: i.id, pieces: piecesFor(i.value, cur) }))
    .filter(o => o.pieces.length > 1);
  const merge: ExchangeOptions['merge'] = [];
  for (const target of cur.bills) {
    let total = 0;
    const take: Payable[] = [];
    for (const i of items) {
      if (i.value >= target || total + i.value > target) continue;
      take.push(i);
      total += i.value;
      if (total === target) break;
    }
    if (total === target && take.length > 1) merge.push({ target, ids: take.map(t => t.id), parts: take.map(t => t.value) });
  }
  return { split, merge };
}

/** Adds money of the given values at a location: bills as bills, the rest as coins. */
function addMoneyAt(w: Wallet, values: number[], loc: BillLocation): Wallet {
  const cur = currencyOf(w);
  const bills = values.filter(v => v >= cur.bills[0]);
  const coins = values.filter(v => v < cur.bills[0]);
  return {
    ...w,
    bills: [...w.bills, ...makeBills(w, bills, loc)],
    coins: [...w.coins, ...coins.map(value => ({ id: uid('c'), value, ...coinPlace(loc) }))],
  };
}

const without = (w: Wallet, ids: Set<string>): Wallet => ({ ...w, bills: w.bills.filter(b => !ids.has(b.id)), coins: w.coins.filter(c => !ids.has(c.id)) });

/** Breaks one bill (or coin) into smaller money, in the same place. */
export function exchangeSplit(w: Wallet, id: string): Wallet {
  const bill = w.bills.find(b => b.id === id);
  const coin = w.coins.find(c => c.id === id);
  const item = bill ?? coin;
  if (!item) return w;
  const loc = bill ? bill.location : coinLocation(coin!);
  if (loc.type === 'piggy') return w;
  const pieces = piecesFor(item.value, currencyOf(w));
  if (pieces.length < 2) return w;
  return addMoneyAt(without(w, new Set([id])), pieces, loc);
}

/** Gathers smaller money lying in one place into a single bill of `target`. */
export function exchangeMerge(w: Wallet, loc: BillLocation, target: number): Wallet {
  const option = exchangeOptions(w, loc).merge.find(m => m.target === target);
  if (!option) return w;
  return addMoneyAt(without(w, new Set(option.ids)), [target], loc);
}
