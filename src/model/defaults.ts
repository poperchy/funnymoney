import { CURRENCIES, type CurrencyCode } from '@/lib/money/currency';
import type { Category, Wallet } from './types';

// Budgets are in BYN; other currencies scale them.
const CATS: (Omit<Category, 'budget'> & { byn: number })[] = [
  // Order matters: packing these sizes in this order reproduces the 8×4 wall from the design.
  { id: 'podushka', name: 'Подушка', byn: 1100, colSpan: 3, rowSpan: 2 },
  { id: 'arenda', name: 'Аренда', byn: 900, colSpan: 2, rowSpan: 2 },
  { id: 'eda', name: 'Еда', byn: 800, colSpan: 3, rowSpan: 2 },
  { id: 'transport', name: 'Транспорт', byn: 150, colSpan: 2, rowSpan: 2 },
  { id: 'fun', name: 'Развлечения', byn: 250, colSpan: 2, rowSpan: 2 },
  { id: 'cafe', name: 'Кафе', byn: 120, colSpan: 1, rowSpan: 2 },
  { id: 'health', name: 'Здоровье', byn: 100, colSpan: 2, rowSpan: 1 },
  { id: 'phone', name: 'Связь', byn: 40, colSpan: 1, rowSpan: 2 },
  { id: 'gifts', name: 'Подарки', byn: 100, colSpan: 2, rowSpan: 1 },
];

export const CELL_SIZES = [
  { id: 'narrow', label: 'Узкая', colSpan: 1, rowSpan: 2 },
  { id: 'strip', label: 'Полоска', colSpan: 2, rowSpan: 1 },
  { id: 'square', label: 'Квадрат', colSpan: 2, rowSpan: 2 },
  { id: 'big', label: 'Большая', colSpan: 3, rowSpan: 2 },
] as const;

export const MAX_CATEGORIES = 24;

/** Order in which money is counted out and spread: must-pay first, savings last. */
export const FILL_ORDER = ['arenda', 'eda', 'transport', 'phone', 'health', 'cafe', 'fun', 'gifts', 'podushka'];

export const JOKES: Record<string, string> = {
  podushka: 'Подушка худеет. Надеюсь, по делу',
  arenda: 'Крыша над головой. Уважаем',
  eda: 'Еда — это святое',
  transport: 'Ехать-то надо',
  fun: 'Заслужил. Наверное',
  cafe: 'Это не кофе, это топливо',
  health: 'Здоровье дороже. Буквально',
  gifts: 'Щедрая душа',
  phone: 'Без связи никуда',
  pile: 'Прямо из кошелька? Смело',
};
export const DEFAULT_JOKE = 'Прощай, дружок';

export function defaultCategories(code: CurrencyCode): Category[] {
  const cur = CURRENCIES[code];
  const step = cur.bills[0];
  return CATS.map(({ byn, ...c }) => ({
    ...c,
    budget: Math.max(step, Math.round((byn * 100 * cur.scale) / step) * step),
  }));
}

export function emptyWallet(code: CurrencyCode = 'BYN'): Wallet {
  return {
    version: 1,
    currency: code,
    categories: defaultCategories(code),
    bills: [],
    coins: [],
    receipts: [],
    lastIncome: 0,
    onboarded: false,
  };
}
