import { describe, expect, it } from 'vitest';
import { sum } from '@/lib/money/math';
import { emptyWallet } from './defaults';
import * as ops from './ops';

const funded = () => {
  const w = emptyWallet('BYN');
  return ops.addIncome(w, [20000, 20000, 10000, 5000, 2000, 1000, 500], [200, 50]);
};

describe('wallet ops', () => {
  it('income lands in the wallet: bills and coins alike', () => {
    const w = funded();
    expect(ops.billsIn(w, { type: 'pile' })).toHaveLength(7);
    expect(ops.coinsIn(w, { type: 'pile' }).map(c => c.value)).toEqual([200, 50]);
    expect(ops.pileTotal(w)).toBe(58750);
    expect(ops.piggyTotal(w)).toBe(0);
    expect(ops.balance(w)).toBe(58750);
    expect(w.onboarded).toBe(true);
  });

  it('a loose coin can go into the piggy or a cell, and is spent from there', () => {
    const w = funded();
    const [a, b] = w.coins;
    const after = ops.moveCoin(ops.moveCoin(w, a.id, { type: 'piggy' }), b.id, { type: 'cell', cellId: 'cafe' });
    expect(ops.piggyTotal(after)).toBe(a.value);
    expect(ops.totalIn(after, { type: 'cell', cellId: 'cafe' })).toBe(b.value);
    expect(ops.balance(after)).toBe(ops.balance(w));
    const plan = ops.planSpend(after, 'cafe', b.value);
    expect(plan.ok && plan.taken.map(t => t.id)).toEqual([b.id]);
  });

  it('removing a cell sends its coins back to the wallet', () => {
    const w = funded();
    const coin = w.coins[0];
    const after = ops.removeCategory(ops.moveCoin(w, coin.id, { type: 'cell', cellId: 'cafe' }), 'cafe');
    expect(after.coins.find(c => c.id === coin.id)?.location).toBe('wallet');
  });

  it('spending from the wallet can use its coins too', () => {
    const w = ops.addIncome(emptyWallet('BYN'), [500], [200, 200]);
    const plan = ops.planSpend(w, 'pile', 350);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    // The 5 covers it alone, so coins stay; ask for 8,50 and coins are needed.
    const big = ops.planSpend(w, 'pile', 850);
    expect(big.ok).toBe(true);
    if (!big.ok) return;
    const after = ops.spend(w, { source: 'pile', billIds: big.taken.map(t => t.id), change: [...big.back, ...big.coins] });
    expect(ops.balance(after)).toBe(900 - 850);
  });

  it('spreading fills cells up to their budget and conserves money', () => {
    const w = funded();
    const { wallet, moved } = ops.autoSpread(w);
    expect(moved).toBeGreaterThan(0);
    expect(ops.balance(wallet)).toBe(ops.balance(w));
    for (const c of wallet.categories) expect(ops.totalIn(wallet, { type: 'cell', cellId: c.id })).toBeLessThanOrEqual(c.budget);
  });

  it('spending returns bill change to the cell and coins to the piggy', () => {
    let w = funded();
    const bill = w.bills.find(b => b.value === 5000)!;
    w = ops.moveBill(w, bill.id, { type: 'cell', cellId: 'eda' });
    const plan = ops.planSpend(w, 'eda', 2730);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const before = ops.balance(w);
    const after = ops.spend(w, { source: 'eda', billIds: plan.taken.map(b => b.id), change: [...plan.back, ...plan.coins] });
    expect(ops.balance(after)).toBe(before - 2730);
    expect(ops.totalIn(after, { type: 'cell', cellId: 'eda' })).toBe(2000);
    expect(ops.coinTotal(after)).toBe(250 + 270);
    expect(after.receipts[0]).toMatchObject({ amount: 2730, paid: 5000, source: 'eda', label: 'Еда' });
  });

  it('refuses a spend with more change than paid', () => {
    const w = funded();
    const b = w.bills[0];
    expect(ops.spend(w, { source: 'pile', billIds: [b.id], change: [b.value] })).toBe(w);
  });

  it('breaking the piggy empties it completely: bills where possible, the rest as coins, all to the wallet', () => {
    let w = ops.addIncome(emptyWallet('BYN'), [], [200, 200, 100, 50, 50, 20, 10, 5, 100]);
    // All coins but the last 1 Br go to the piggy; that one stays in the wallet and must survive.
    for (const c of w.coins.slice(0, -1)) w = ops.moveCoin(w, c.id, { type: 'piggy' });
    const bill = ops.addIncome(w, [2000], []).bills.at(-1)!;
    w = ops.moveBill({ ...w, bills: [bill] }, bill.id, { type: 'piggy' });
    const before = ops.balance(w);
    const { wallet, taken } = ops.breakPiggy(w);
    expect(taken).toBe(2000 + 635);
    expect(ops.balance(wallet)).toBe(before);
    expect(ops.piggyTotal(wallet)).toBe(0);
    expect(sum(ops.walletCoins(wallet).map(c => c.value))).toBe(100 + 135);
    expect(ops.billsIn(wallet, { type: 'pile' }).map(b => b.value).sort()).toEqual([2000, 500]);
  });

  describe('editing a receipt', () => {
    // 50 in "Еда", spent 27,30: 20 back to the cell, 2,70 to the piggy.
    const spentFood = () => {
      let w = funded();
      w = ops.moveBill(w, w.bills.find(b => b.value === 5000)!.id, { type: 'cell', cellId: 'eda' });
      const p = ops.planSpend(w, 'eda', 2730);
      if (!p.ok) throw new Error('plan');
      return ops.spend(w, { source: 'eda', billIds: p.taken.map(t => t.id), change: [...p.back, ...p.coins] });
    };
    const eda = (w: ReturnType<typeof funded>) => ops.totalIn(w, { type: 'cell', cellId: 'eda' });

    it('spent less: the difference comes back, balance follows the receipt', () => {
      const w = spentFood();
      const r = w.receipts[0];
      const after = ops.editReceipt(w, r.id, { label: 'Продукты', amount: 2000, source: 'eda' });
      expect(ops.balance(after)).toBe(ops.balance(w) + 730);
      expect(after.receipts[0]).toMatchObject({ amount: 2000, label: 'Продукты' });
      expect(eda(after)).toBe(2500);
    });

    it('spent more: the extra is paid from the cell', () => {
      const w = spentFood();
      const after = ops.editReceipt(w, w.receipts[0].id, { label: '', amount: 3730, source: 'eda' });
      expect(ops.balance(after)).toBe(ops.balance(w) - 1000);
      expect(eda(after)).toBe(1000);
    });

    it('refuses when the cell cannot cover the extra', () => {
      const w = spentFood();
      const plan = ops.planReceiptEdit(w, w.receipts[0].id, { label: '', amount: 9000, source: 'eda' });
      expect(plan).toMatchObject({ ok: false, reason: 'not-enough', total: 2000 });
      expect(ops.editReceipt(w, w.receipts[0].id, { label: '', amount: 9000, source: 'eda' })).toBe(w);
    });

    it('another source: the old one is refunded, the new one pays', () => {
      const w = spentFood();
      const after = ops.editReceipt(w, w.receipts[0].id, { label: '', amount: 2730, source: 'pile' });
      expect(ops.balance(after)).toBe(ops.balance(w));
      // 25 comes back to the cell as bills; the 2,30 in coins goes to the wallet pocket.
      expect(eda(after)).toBe(2000 + 2500);
      expect(after.receipts[0].source).toBe('pile');
    });

    it('deleting returns the whole amount', () => {
      const w = spentFood();
      const after = ops.deleteReceipt(w, w.receipts[0].id);
      expect(ops.balance(after)).toBe(ops.balance(w) + 2730);
      expect(after.receipts).toHaveLength(0);
    });
  });

  it('removing a cell puts its bills back into the pile', () => {
    let w = funded();
    const bill = w.bills[0];
    w = ops.addCategory(w, { name: 'Котик', budget: 5000, colSpan: 1, rowSpan: 2 });
    const cat = w.categories.at(-1)!;
    w = ops.moveBill(w, bill.id, { type: 'cell', cellId: cat.id });
    const after = ops.removeCategory(w, cat.id);
    expect(after.categories.find(c => c.id === cat.id)).toBeUndefined();
    expect(after.bills.find(b => b.id === bill.id)?.location).toEqual({ type: 'pile' });
    expect(ops.balance(after)).toBe(ops.balance(w));
  });

  it('scales default budgets to the currency', () => {
    const rub = emptyWallet('RUB').categories.find(c => c.id === 'eda')!;
    expect(rub.budget).toBe(2400000);
  });
});

describe('exchange', () => {
  const cell = { type: 'cell', cellId: 'eda' } as const;
  const withFood = (values: number[], coins: number[] = []) => {
    let w = ops.addIncome(emptyWallet('BYN'), values, coins);
    for (const b of w.bills) w = ops.moveBill(w, b.id, cell);
    for (const c of w.coins) w = ops.moveCoin(w, c.id, cell);
    return w;
  };

  it('breaks a bill into the next denominations down, in the same cell', () => {
    const w = withFood([10000]);
    const after = ops.exchangeSplit(w, w.bills[0].id);
    expect(ops.billsIn(after, cell).map(b => b.value)).toEqual([5000, 5000]);
    expect(ops.balance(after)).toBe(10000);
  });

  it('breaks the smallest bill into coins', () => {
    const w = withFood([500]);
    const after = ops.exchangeSplit(w, w.bills[0].id);
    expect(ops.billsIn(after, cell)).toHaveLength(0);
    expect(ops.coinsIn(after, cell).map(c => c.value)).toEqual([200, 200, 100]);
  });

  it('gathers small money into bigger bills, coins included', () => {
    const w = withFood([2000, 2000, 500, 500], [200, 200, 100]);
    const opts = ops.exchangeOptions(w, cell);
    // 20 is out: everything smaller than 20 adds up to only 15.
    expect(opts.merge.map(m => m.target)).toEqual([500, 1000, 5000]);
    const after = ops.exchangeMerge(w, cell, 5000);
    expect(ops.billsIn(after, cell).map(b => b.value)).toContain(5000);
    expect(ops.balance(after)).toBe(ops.balance(w));
  });

  it('offers nothing it cannot do exactly', () => {
    const w = withFood([2000, 2000]);
    expect(ops.exchangeOptions(w, cell).merge.map(m => m.target)).toEqual([]);
  });
});

describe('transfer', () => {
  const cell = (id: string) => ({ type: 'cell' as const, cellId: id });

  it('moves the very bills when they add up exactly', () => {
    const w = funded();
    const ids = ops.billsIn(w, { type: 'pile' }).filter(b => b.value === 20000).map(b => b.id);
    const after = ops.transfer(w, 'pile', 'arenda', 40000);
    expect(ops.billsIn(after, cell('arenda')).map(b => b.id).sort()).toEqual([...ids].sort());
    expect(ops.balance(after)).toBe(ops.balance(w));
  });

  it('breaks a bill on the way when the amount is odd, keeping the total', () => {
    const w = funded();
    const after = ops.transfer(w, 'pile', 'transport', 15030);
    expect(ops.totalIn(after, cell('transport'))).toBe(15030);
    expect(ops.pileTotal(after)).toBe(ops.pileTotal(w) - 15030);
    expect(ops.balance(after)).toBe(ops.balance(w));
  });

  it('refuses more than there is, and amounts the currency has no coin for', () => {
    const w = funded();
    expect(ops.planTransfer(w, 'pile', 100000)).toMatchObject({ ok: false, reason: 'not-enough' });
    const rub = ops.addIncome(emptyWallet('RUB'), [100000], []);
    expect(ops.planTransfer(rub, 'pile', 15050)).toMatchObject({ ok: false, reason: 'odd' });
  });

  it('distributes several amounts and stops when the money runs out', () => {
    const w = funded();
    const { wallet, moved } = ops.distribute(w, 'pile', [
      { target: 'arenda', amount: 30000 },
      { target: 'eda', amount: 20000 },
      { target: 'cafe', amount: 50000 },
    ]);
    expect(moved).toBe(50000);
    expect(ops.totalIn(wallet, cell('arenda'))).toBe(30000);
    expect(ops.totalIn(wallet, cell('eda'))).toBe(20000);
    expect(ops.totalIn(wallet, cell('cafe'))).toBe(0);
    expect(ops.balance(wallet)).toBe(ops.balance(w));
  });
});

describe('spendingByMonth', () => {
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();
  const receipt = (source: string, amount: number, iso: string) => ({ id: iso + source + amount, label: '', source, amount, paid: amount, at: iso });

  it('sums receipts per month and per category', () => {
    const w = {
      ...emptyWallet('BYN'),
      receipts: [
        receipt('eda', 1500, at(2026, 10, 3)),
        receipt('eda', 2500, at(2026, 10, 20)),
        receipt('cafe', 800, at(2026, 10, 21)),
        receipt('eda', 3000, at(2026, 9, 30)),
        receipt('pile', 500, at(2025, 12, 31)),
      ],
    };
    const m = ops.spendingByMonth(w);
    expect(m.get('2026-10')).toEqual({ total: 4800, bySource: { eda: 4000, cafe: 800 } });
    expect(m.get('2026-09')).toEqual({ total: 3000, bySource: { eda: 3000 } });
    expect(m.get('2025-12')?.bySource.pile).toBe(500);
  });

  it('knows the month before across a new year', () => {
    expect(ops.prevMonthKey('2026-01')).toBe('2025-12');
    expect(ops.prevMonthKey('2026-10')).toBe('2026-09');
  });
});
