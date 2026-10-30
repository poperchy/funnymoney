'use client';

import { useUnit } from 'effector-react';
import { moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { cellPicked, sheetClosed, sheetOpened } from '@/model/mobile';
import { billsIn, coinsIn, exchangeOptions } from '@/model/ops';
import { slotKey, type BillLocation } from '@/model/types';
import { categoryEditOpened, exchangeOpened } from '@/model/ui';
import { $currency, $wallet } from '@/model/wallet';
import { CoinFace } from '@/components/money/BillImg';
import { dropItem, itemOf } from './actions';
import { billImg } from './parts';
import { Sheet } from './Sheet';

/** The no-drag path: tap a cell, pick a bill, then spend it, feed it to the pig or move it. Works with one thumb. */
export function CellSheet({ loc, sel }: { loc: BillLocation; sel: string | null }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const key = slotKey(loc);
  const cat = loc.type === 'cell' ? w.categories.find(c => c.id === loc.cellId) : null;
  const bills = [...billsIn(w, loc)].sort((a, b) => b.value - a.value);
  const coins = [...coinsIn(w, loc)].sort((a, b) => b.value - a.value);
  const total = sum([...bills, ...coins].map(b => b.value));
  const budget = cat?.budget ?? 0;
  const low = total > 0 && budget > 0 && total <= budget * 0.15;
  const item = sel ? itemOf(sel) : null;
  const canExchange = (() => {
    const o = exchangeOptions(w, loc);
    return o.split.length > 0 || o.merge.length > 0;
  })();

  const status = !total ? 'Тут было что-то. Было.' : low ? 'Осторожно, на донышке' : (JOKES[key] ?? DEFAULT_JOKE);
  const go = (to: string) => {
    if (!item) return;
    if (dropItem(item, to)) sheetClosed();
  };
  const moves = [
    ...w.categories.filter(c => c.id !== key).map(c => ({ id: c.id, name: c.name })),
    ...(key === 'pile' ? [] : [{ id: 'pile', name: 'Обратно в кошелёк' }]),
  ];

  const pickable = (id: string, face: React.ReactNode, label: string, width: number, height: number) => {
    const on = id === sel;
    return (
      <button
        key={id}
        onClick={() => cellPicked(on ? null : id)}
        aria-pressed={on}
        aria-label={label}
        className="relative flex-none rounded-[5px] transition-[transform,box-shadow] duration-200"
        style={{
          width,
          height,
          transform: on ? 'translateY(-6px) rotate(-3deg) scale(1.05)' : 'none',
          boxShadow: on ? '0 0 0 3px var(--accent), 0 14px 20px -10px rgba(0,0,0,0.45)' : 'none',
          borderRadius: height === width ? '50%' : 5,
        }}
      >
        {face}
      </button>
    );
  };

  return (
    <Sheet title={cat?.name ?? 'Кошелёк'} onClose={() => sheetClosed()} className="gap-3.5 px-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[26px] font-bold tracking-[-0.025em]">{cat?.name ?? 'Кошелёк'}</span>
        <span className="text-[15px] whitespace-nowrap text-ink2">
          <span className="font-bold text-ink">{moneyShort(total)}</span>
          {budget > 0 && ` / ${moneyShort(budget)}`} {cur.symbol}
        </span>
      </div>
      <span className="-mt-2 text-sm" style={{ color: low ? 'var(--danger)' : 'var(--ink2)' }}>
        {status}
      </span>

      {(bills.length > 0 || coins.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3.5 pt-2 pb-0.5">
          {bills.map(b => pickable(b.id, billImg(b.value, cur, 96, { boxShadow: '0 1px 1px rgba(0,0,0,0.22), 0 6px 10px -4px rgba(40,20,0,0.45)' }), `${moneyShort(b.value)} ${cur.code}`, 96, 48))}
          {coins.map(c => pickable(c.id, <CoinFace value={c.value} size={40} />, `Монета ${moneyShort(c.value)}`, 40, 40))}
        </div>
      )}

      {item ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2">
            {item.kind === 'bill' && (
              <button onClick={() => go('spent')} className="h-[52px] flex-1 rounded-2xl bg-accent text-base font-semibold text-accent-ink">
                Потратить {moneyShort(item.value)} {cur.symbol}
              </button>
            )}
            <button onClick={() => go('piggy')} className={`h-[52px] rounded-2xl border border-line px-[18px] text-[15px] font-medium text-ink ${item.kind === 'coin' ? 'flex-1' : ''}`}>
              В свинку
            </button>
          </div>
          {moves.length > 0 && (
            <>
              <span className="text-[13px] text-ink2">Или переложить в</span>
              <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
                {moves.map(m => (
                  <button key={m.id} onClick={() => go(m.id)} className="h-[42px] flex-none rounded-full border border-line px-[15px] text-sm whitespace-nowrap text-ink">
                    {m.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <span className="text-sm leading-normal text-ink2">
          {bills.length || coins.length
            ? 'Выбери купюру. А вообще её можно просто зажать на стене и тащить'
            : 'Перетащи сюда купюру из кошелька или другой ячейки. Или переложи через её ячейку'}
        </span>
      )}

      {(cat || canExchange || total > 0) && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-3.5">
          {total > 0 && cat && (
            <button onClick={() => sheetOpened({ type: 'spend', source: key })} className="h-10 rounded-full bg-btn2 px-4 text-sm font-semibold text-ink">
              − Вписать трату
            </button>
          )}
          {total > 0 && (
            <button onClick={() => sheetOpened({ type: 'distribute', source: key })} className="h-10 rounded-full bg-btn2 px-4 text-sm font-semibold text-ink">
              {key === 'pile' ? 'Вписать суммы' : '→ Переложить сумму'}
            </button>
          )}
          {canExchange && (
            <button
              onClick={() => {
                sheetClosed();
                exchangeOpened(loc);
              }}
              className="h-10 rounded-full bg-btn2 px-4 text-sm font-semibold text-ink"
            >
              ⇄ Размен
            </button>
          )}
          {cat && (
            <button
              onClick={() => {
                sheetClosed();
                categoryEditOpened(cat.id);
              }}
              className="h-10 rounded-full bg-btn2 px-4 text-sm font-semibold text-ink"
            >
              ✎ Ячейка
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
