'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { amountField, money, moneyShort } from '@/lib/money/format';
import { changeFor, sum } from '@/lib/money/math';
import { catName, FILL_ORDER, placeName } from '@/model/defaults';
import { sheetClosed } from '@/model/mobile';
import { sourceLocation, totalIn } from '@/model/ops';
import { toastShown } from '@/model/ui';
import { $denoms, $wallet, amountsDistributed } from '@/model/wallet';
import { play } from '@/sound/sfx';
import { flyMoney } from './fly';
import { parseAmount } from './ManualSpendSheet';
import { Sheet } from './Sheet';
import { tr } from '@/lib/i18n';

/** Distribution by typing: how much goes into each cell. Bills are broken on the way if they don't fit exactly. */
export function DistributeSheet({ source }: { source: string }) {
  const [w, denoms] = useUnit([$wallet, $denoms]);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const available = totalIn(w, sourceLocation(source));
  const fromName = placeName(source, w.categories);
  const inName = source === 'pile' ? tr.common.inWalletPlace : fromName;
  const targets = [
    ...w.categories.filter(c => c.id !== source).map(c => ({ id: c.id, name: catName(c), budget: c.budget })),
    ...(source === 'pile' ? [] : [{ id: 'pile', name: tr.mobile.backToWallet, budget: 0 }]),
    { id: 'piggy', name: tr.mobile.pig, budget: 0 },
  ];

  const amounts = Object.fromEntries(targets.map(t => [t.id, parseAmount(texts[t.id] ?? '')]));
  const total = sum(Object.values(amounts));
  const left = available - total;
  const odd = targets.filter(t => amounts[t.id] && sum(changeFor(amounts[t.id], denoms)) !== amounts[t.id]);
  const need = (id: string, budget: number) => Math.max(0, budget - totalIn(w, sourceLocation(id)));
  const set = (id: string, minor: number) => setTexts(t => ({ ...t, [id]: minor ? amountField(minor) : '' }));

  /** Tops up each cell to its budget, must-pay first, while the money lasts. */
  const fillBudgets = () => {
    let rest = available;
    const next: Record<string, string> = {};
    const order = [...targets].sort((a, b) => {
      const ia = FILL_ORDER.indexOf(a.id), ib = FILL_ORDER.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    for (const t of order) {
      const give = Math.min(need(t.id, t.budget), rest);
      if (give > 0) next[t.id] = amountField(give);
      rest -= give;
    }
    setTexts(next);
  };

  const submit = () => {
    if (!total || left < 0 || odd.length) return;
    const parts = targets.filter(t => amounts[t.id] > 0).map(t => ({ target: t.id, amount: amounts[t.id] }));
    const hops = parts.map((p, i) => ({
      from: source,
      to: p.target,
      values: changeFor(p.amount, denoms),
      at: i * 130,
      onLand: () => {
        if (p.target === 'piggy') play('oink', 0.05);
        else play(p.amount < denoms.bills[0] ? 'clink' : 'rustle');
        if (i === parts.length - 1) toastShown(tr.mobile.flew(money(total)));
      },
    }));
    sheetClosed();
    play('flutter');
    flyMoney(hops, () => amountsDistributed({ source, parts }));
  };

  let status = left === available ? tr.mobile.enterHint : tr.mobile.remains(inName, money(Math.max(0, left)));
  if (left < 0) status = tr.mobile.tooMuch(inName, money(available), money(total));
  else if (odd.length) status = tr.mobile.oddKopecks(odd[0].name);

  return (
    <Sheet title={tr.mobile.distributeTitle} onClose={() => sheetClosed()} className="gap-3.5 px-5 pt-2" flush>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-2xl font-bold tracking-[-0.025em]">{source === 'pile' ? tr.mobile.whereFromWallet : tr.mobile.whereFrom(fromName)}</span>
          <span className="text-sm text-ink2">
            {tr.mobile.available(money(available))}
          </span>
        </div>
        {source === 'pile' && (
          <button onClick={fillBudgets} className="h-11 flex-none rounded-full border-[1.5px] border-accent bg-accent-wash px-3.5 text-sm font-semibold text-ink">
            {tr.mobile.byBudgets}
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {targets.map(t => {
          const has = totalIn(w, sourceLocation(t.id));
          const gap = need(t.id, t.budget);
          const value = amounts[t.id];
          return (
            <div key={t.id} className="flex items-center gap-2.5 border-b border-line py-2.5 last:border-none">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-semibold">{t.name}</span>
                <span className="truncate text-xs text-ink2">
                  {moneyShort(has)}
                  {t.budget > 0 && ` ${tr.mobile.ofBudget(moneyShort(t.budget))}`}
                  {value > 0 && <span className="font-semibold text-accent"> → {moneyShort(has + value)}</span>}
                </span>
              </div>
              {gap > 0 && !value && (
                <button onClick={() => set(t.id, Math.min(gap, Math.max(0, left)))} disabled={left <= 0} className="h-11 flex-none rounded-full bg-btn2 px-3 text-sm font-semibold text-ink disabled:opacity-40">
                  +{moneyShort(Math.min(gap, Math.max(0, left)) || gap)}
                </button>
              )}
              <label className="flex h-[52px] w-[112px] flex-none items-center gap-1 rounded-[14px] border border-line bg-field px-2.5">
                <input
                  value={texts[t.id] ?? ''}
                  inputMode="decimal"
                  placeholder="0"
                  aria-label={tr.mobile.amountIn(t.name)}
                  onChange={e => setTexts(x => ({ ...x, [t.id]: e.target.value.replace(/[^\d.,]/g, '').slice(0, 10) }))}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  className="w-full min-w-0 bg-transparent text-right text-lg font-semibold text-ink"
                />
              </label>
            </div>
          );
        })}
      </div>

      {/* Stays on screen however many cells there are: the list scrolls under it. */}
      <div className="sticky bottom-0 z-[1] -mx-5 -mt-3.5 flex shrink-0 flex-col gap-2.5 bg-modal px-5 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+14px)]">
        <span className="text-sm leading-snug" style={{ color: left < 0 || odd.length ? 'var(--danger)' : 'var(--ink2)' }}>
          {status}
        </span>
        <button onClick={submit} disabled={!total || left < 0 || odd.length > 0} className="h-[64px] rounded-[20px] bg-accent text-[17px] font-semibold text-accent-ink disabled:opacity-40">
          {total ? tr.mobile.flyAway(moneyShort(total)) : tr.common.firstAmount}
        </button>
      </div>
    </Sheet>
  );
}
