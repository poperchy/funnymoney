import { describe, expect, it } from 'vitest';
import { CURRENCIES } from './currency';
import { changeFor, decompose, payout, pickBills, splitChange, sum } from './math';

const BYN = CURRENCIES.BYN;

describe('decompose', () => {
  it('splits greedily into denominations', () => {
    expect(decompose(37500, BYN.bills)).toEqual([20000, 10000, 5000, 2000, 500]);
  });
  it('drops what fits nothing', () => {
    expect(decompose(301, [100])).toEqual([100, 100, 100]);
  });
});

describe('splitChange', () => {
  it('returns bills down to the smallest note and the rest as coins', () => {
    const { bills, coins } = splitChange(2730, BYN);
    expect(bills).toEqual([2000, 500]);
    expect(coins).toEqual([200, 20, 10]);
    expect(sum(changeFor(2730, BYN))).toBe(2730);
  });
});

describe('payout', () => {
  it('counts each budget out separately and keeps the total', () => {
    const { bills, coins } = payout(360000 + 300, BYN, [90000, 80000, 15000]);
    expect(sum(bills) + sum(coins)).toBe(360300);
    expect(coins).toEqual([200, 100]);
    // The first budget is a clean 900 made of 200s and a 100.
    expect(bills.slice(0, 5)).toEqual([20000, 20000, 20000, 20000, 10000]);
  });
});

describe('pickBills', () => {
  const bills = [5000, 2000, 1000, 500].map((value, i) => ({ id: String(i), value }));
  it('prefers the smallest single bill that covers the amount', () => {
    expect(pickBills(bills, 1800)?.map(b => b.value)).toEqual([2000]);
  });
  it('combines bills biggest-first when no single one is enough', () => {
    expect(pickBills(bills, 6800)?.map(b => b.value)).toEqual([5000, 2000]);
  });
  it('refuses when there is not enough money', () => {
    expect(pickBills(bills, 9000)).toBeNull();
  });
});
