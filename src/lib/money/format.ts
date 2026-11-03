import { tr } from '@/lib/i18n';

const fmt2 = new Intl.NumberFormat(tr.intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = new Intl.NumberFormat(tr.intl, { maximumFractionDigits: 0 });

/** 123456 → "1 234,56" */
export const money = (minor: number) => fmt2.format(minor / 100);

/** Drops the kopecks when there are none: 120000 → "1 200", 120050 → "1 200,50" */
export const moneyShort = (minor: number) => (minor % 100 === 0 ? fmt0.format(minor / 100) : money(minor));

/** Label printed on a bill or coin: 500 → "5", 50 → "0,50" */
export const faceLabel = (minor: number) => (minor >= 100 ? fmt0.format(minor / 100) : '0' + tr.decimal + String(minor).padStart(2, '0'));

/** A set of bills by its ends: "50–2 000". */
export const billRange = (bills: number[]) => `${moneyShort(bills[0])}–${moneyShort(bills[bills.length - 1])}`;

/** An amount for a text field, to be read back by `amountNumber`: 1250 → "12,5" */
export const amountField = (minor: number) => String(minor / 100).replace('.', tr.decimal);

/**
 * What someone typed, as a number; NaN if it isn't one. Both decimal marks work everywhere, but where the
 * decimal mark is a point, "1,000" means a thousand: read as 1.00 it would quietly lose the money.
 */
export function amountNumber(text: string, decimal = tr.decimal) {
  const s = text.replace(/\s/g, '');
  return parseFloat((decimal === '.' ? s.replace(/,(?=\d{3}(\D|$))/g, '') : s).replace(',', '.'));
}
