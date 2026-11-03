import { tr } from '@/lib/i18n';
import { detectScale, SCALES, type BillScale } from '@/lib/money/denominations';
import type { Category, Wallet } from './types';

// Budgets are written for the small scale; the others multiply them.
// The stored name of an untouched default cell stays Russian in every language: that's how `catName` knows it's untouched.
const CATS: (Omit<Category, 'budget'> & { base: number })[] = [
  // Order matters: packing these sizes in this order reproduces the 8×4 wall from the design.
  { id: 'podushka', name: 'Подушка', base: 1100, colSpan: 3, rowSpan: 2 },
  { id: 'arenda', name: 'Аренда', base: 900, colSpan: 2, rowSpan: 2 },
  { id: 'eda', name: 'Еда', base: 800, colSpan: 3, rowSpan: 2 },
  { id: 'transport', name: 'Транспорт', base: 150, colSpan: 2, rowSpan: 2 },
  { id: 'fun', name: 'Развлечения', base: 250, colSpan: 2, rowSpan: 2 },
  { id: 'cafe', name: 'Кафе', base: 120, colSpan: 1, rowSpan: 2 },
  { id: 'health', name: 'Здоровье', base: 100, colSpan: 2, rowSpan: 1 },
  { id: 'phone', name: 'Связь', base: 40, colSpan: 1, rowSpan: 2 },
  { id: 'gifts', name: 'Подарки', base: 100, colSpan: 2, rowSpan: 1 },
];

export const CELL_SIZES = [
  { id: 'narrow', label: tr.cellSizes.narrow, colSpan: 1, rowSpan: 2 },
  { id: 'strip', label: tr.cellSizes.strip, colSpan: 2, rowSpan: 1 },
  { id: 'square', label: tr.cellSizes.square, colSpan: 2, rowSpan: 2 },
  { id: 'big', label: tr.cellSizes.big, colSpan: 3, rowSpan: 2 },
] as const;

export const MAX_CATEGORIES = 24;

/** Order in which money is counted out and spread: must-pay first, savings last. */
export const FILL_ORDER = ['arenda', 'eda', 'transport', 'phone', 'health', 'cafe', 'fun', 'gifts', 'podushka'];

export const JOKES = tr.jokes;
export const DEFAULT_JOKE = tr.common.goodbye;

/** What the pig says when poked (every fourth poke). */
export const PIG_LINES = tr.pigLines;

/** A cell's name to show: a default cell nobody renamed speaks the current language, a renamed one stays as typed. */
export const catName = (c: Pick<Category, 'id' | 'name'>) => (CATS.find(d => d.id === c.id)?.name === c.name ? tr.cats[c.id] : c.name);

/** What to call a receipt's source or a slot: the wallet, a cell, or something that isn't on the wall anymore. */
export function sourceLabel(key: string, cats: Pick<Category, 'id' | 'name'>[], wallet: string = tr.common.wallet, missing = '—') {
  if (key === 'pile') return wallet;
  const cat = cats.find(c => c.id === key);
  return cat ? catName(cat) : missing;
}

/** A place inside a sentence: "из кошелька", "из «Еды»". */
export const placeName = (key: string, cats: Pick<Category, 'id' | 'name'>[]) => (key === 'pile' ? tr.common.walletOf : tr.common.quote(sourceLabel(key, cats, '', '')));

export function defaultCategories(code: BillScale): Category[] {
  const denoms = SCALES[code];
  const step = denoms.bills[0];
  return CATS.map(({ base, ...c }) => ({
    ...c,
    budget: Math.max(step, Math.round((base * 100 * denoms.budgets) / step) * step),
  }));
}

export function emptyWallet(scale: BillScale = detectScale()): Wallet {
  return {
    version: 1,
    scale,
    categories: defaultCategories(scale),
    bills: [],
    coins: [],
    receipts: [],
    lastIncome: 0,
    onboarded: false,
  };
}
