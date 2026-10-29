// All amounts in the app are integers in minor units (kopecks, cents).

export type CurrencyCode = 'BYN' | 'USD' | 'EUR' | 'RUB' | 'PLN' | 'KZT';

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  // Six banknote values, ascending, in minor units. Index picks the bill colour.
  bills: number[];
  // Coin values, ascending, in minor units. Change below the smallest bill becomes coins.
  coins: number[];
  // Multiplier for default budgets, which are written in BYN.
  scale: number;
};

const M = 100;

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  BYN: { code: 'BYN', symbol: 'Br', bills: [5, 10, 20, 50, 100, 200].map(v => v * M), coins: [1, 2, 5, 10, 20, 50, 100, 200], scale: 1 },
  USD: { code: 'USD', symbol: '$', bills: [1, 5, 10, 20, 50, 100].map(v => v * M), coins: [1, 5, 10, 25, 50], scale: 0.35 },
  EUR: { code: 'EUR', symbol: '€', bills: [5, 10, 20, 50, 100, 200].map(v => v * M), coins: [1, 2, 5, 10, 20, 50, 100, 200], scale: 0.3 },
  RUB: { code: 'RUB', symbol: '₽', bills: [50, 100, 200, 500, 1000, 5000].map(v => v * M), coins: [1, 2, 5, 10].map(v => v * M), scale: 30 },
  PLN: { code: 'PLN', symbol: 'zł', bills: [10, 20, 50, 100, 200, 500].map(v => v * M), coins: [1, 2, 5, 10, 20, 50, 100, 200, 500], scale: 1.25 },
  KZT: { code: 'KZT', symbol: '₸', bills: [200, 500, 1000, 2000, 5000, 10000].map(v => v * M), coins: [1, 2, 5, 10, 20, 50, 100].map(v => v * M), scale: 150 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export const billIndex = (cur: Currency, value: number) => Math.max(0, cur.bills.indexOf(value));
export const smallestBill = (cur: Currency) => cur.bills[0];
