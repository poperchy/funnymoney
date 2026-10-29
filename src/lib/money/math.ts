import type { Currency } from './currency';

const desc = (list: number[]) => [...list].sort((a, b) => b - a);

/** Greedy split of an amount into the given denominations. Leftover that fits nothing is dropped. */
export function decompose(amount: number, denominations: number[]): number[] {
  const out: number[] = [];
  let left = amount;
  for (const d of desc(denominations)) {
    while (left >= d) {
      out.push(d);
      left -= d;
    }
  }
  return out;
}

export const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

/** Splits change into bills (go back to the cell) and coins (go to the piggy bank). */
export function splitChange(amount: number, cur: Currency) {
  const bills = decompose(amount, cur.bills);
  const coins = decompose(amount - sum(bills), cur.coins);
  return { bills, coins };
}

/** Change handed back for `amount`, as the flat list of bill and coin values. */
export function changeFor(amount: number, cur: Currency): number[] {
  const { bills, coins } = splitChange(amount, cur);
  return [...bills, ...coins];
}

/**
 * Turns an income into bills the way a cashier would if they knew your budgets:
 * each category's budget is counted out separately, so "spread like last time" fits exactly.
 */
export function payout(amount: number, cur: Currency, budgets: number[]) {
  const bills: number[] = [];
  let left = amount;
  for (const budget of budgets) {
    if (left <= 0) break;
    const part = decompose(Math.min(budget, left), cur.bills);
    bills.push(...part);
    left -= sum(part);
  }
  const rest = decompose(left, cur.bills);
  bills.push(...rest);
  left -= sum(rest);
  return { bills, coins: decompose(left, cur.coins) };
}

/** Picks bills to pay `amount`: the smallest single bill that covers it, otherwise biggest-first. */
export function pickBills<T extends { value: number }>(available: T[], amount: number): T[] | null {
  if (amount <= 0 || sum(available.map(b => b.value)) < amount) return null;
  const one = [...available].sort((a, b) => a.value - b.value).find(b => b.value >= amount);
  if (one) return [one];
  const taken: T[] = [];
  let paid = 0;
  for (const b of [...available].sort((a, b) => b.value - a.value)) {
    taken.push(b);
    paid += b.value;
    if (paid >= amount) break;
  }
  return taken;
}
