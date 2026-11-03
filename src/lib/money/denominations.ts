// All amounts in the app are integers in minor units (kopecks, cents).
// Money here has no currency: it's just money, in whatever you get paid in. The only thing that depends on the
// country is how big the numbers are, so that a salary still makes a stack and not a pile of 1500 bills.

export type BillScale = 'small' | 'medium' | 'large';

export type Denoms = {
  id: BillScale;
  // Six banknote values, ascending, in minor units. Index picks the bill colour.
  bills: number[];
  // Coin values, ascending, in minor units. Change below the smallest bill becomes coins.
  coins: number[];
  // Multiplier for default budgets and typical amounts, which are written for the small scale.
  budgets: number;
};

const M = 100;
const BILLS = [5, 10, 20, 50, 100, 200].map(v => v * M);
const COINS = [1, 2, 5, 10, 20, 50, 100, 200];
const times = (list: number[], k: number) => list.map(v => v * k);

export const SCALES: Record<BillScale, Denoms> = {
  small: { id: 'small', bills: BILLS, coins: COINS, budgets: 1 },
  medium: { id: 'medium', bills: times(BILLS, 10), coins: times(COINS, 10), budgets: 30 },
  large: { id: 'large', bills: times(BILLS, 100), coins: times(COINS, 100), budgets: 150 },
};

export const SCALE_LIST = Object.values(SCALES);

/** A country's money is close enough if it lands on the right stack: a typical salary is 20–80 bills. */
const MEDIUM_REGIONS = new Set(['RU', 'UA', 'IN', 'TH', 'TR', 'MX', 'PH', 'ZA', 'CZ', 'SE', 'NO', 'DK']);
const LARGE_REGIONS = new Set(['KZ', 'UZ', 'JP', 'KR', 'VN', 'ID', 'HU', 'CL', 'CO']);
/** Browsers here are often set to plain "ru" or "ru-RU", and only the clock tells the country. */
const TIME_ZONES: Record<string, BillScale> = {
  'Europe/Minsk': 'small',
  'Asia/Almaty': 'large',
  'Asia/Qyzylorda': 'large',
  'Asia/Qostanay': 'large',
  'Asia/Aqtobe': 'large',
  'Asia/Aqtau': 'large',
  'Asia/Atyrau': 'large',
  'Asia/Oral': 'large',
  'Asia/Tashkent': 'large',
  'Asia/Samarkand': 'large',
};

/** Picks the bills nobody should have to think about. A wrong guess is fixed in the settings. */
export function guessScale(language: string, timeZone: string): BillScale {
  if (TIME_ZONES[timeZone]) return TIME_ZONES[timeZone];
  const [lang, region] = language.split('-');
  const up = region?.toUpperCase();
  if (up && LARGE_REGIONS.has(up)) return 'large';
  if (up && MEDIUM_REGIONS.has(up)) return 'medium';
  if (up) return 'small';
  return lang === 'kk' || lang === 'uz' || lang === 'ja' || lang === 'ko' ? 'large' : lang === 'ru' || lang === 'uk' ? 'medium' : 'small';
}

export const detectScale = (): BillScale => (typeof window === 'undefined' ? 'small' : guessScale(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone));

export const billIndex = (denoms: Denoms, value: number) => Math.max(0, denoms.bills.indexOf(value));
export const smallestBill = (denoms: Denoms) => denoms.bills[0];
