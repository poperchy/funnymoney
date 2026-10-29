const fmt2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** 123456 → "1 234,56" */
export const money = (minor: number) => fmt2.format(minor / 100);

/** Drops the kopecks when there are none: 120000 → "1 200", 120050 → "1 200,50" */
export const moneyShort = (minor: number) => (minor % 100 === 0 ? fmt0.format(minor / 100) : money(minor));

/** Label printed on a bill or coin: 500 → "5", 50 → "0,50" */
export const faceLabel = (minor: number) => (minor >= 100 ? fmt0.format(minor / 100) : '0,' + String(minor).padStart(2, '0'));

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
