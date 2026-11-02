'use client';

import { useUnit } from 'effector-react';
import { moneyShort } from '@/lib/money/format';
import { DEFAULT_JOKE, JOKES } from '@/model/defaults';
import { sheetClosed, sheetOpened } from '@/model/mobile';
import { exchangeOptions, pileTotal, totalIn } from '@/model/ops';
import { slotKey, type BillLocation } from '@/model/types';
import { categoryEditOpened, exchangeOpened } from '@/model/ui';
import { $currency, $wallet } from '@/model/wallet';
import { Sheet } from './Sheet';

const SECONDARY = 'h-[52px] flex-1 whitespace-nowrap rounded-2xl border border-line px-4 text-[15px] font-medium text-ink';

/** Tap on a cell or the wallet: how much is there, and two big buttons to type what happens to it. */
export function CellSheet({ loc }: { loc: BillLocation }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const key = slotKey(loc);
  const cat = loc.type === 'cell' ? w.categories.find(c => c.id === loc.cellId) : null;
  const total = totalIn(w, loc);
  const budget = cat?.budget ?? 0;
  const low = total > 0 && budget > 0 && total <= budget * 0.15;
  const canExchange = (() => {
    const o = exchangeOptions(w, loc);
    return o.split.length > 0 || o.merge.length > 0;
  })();
  const status = !total ? 'Тут было что-то. Было.' : low ? 'Осторожно, на донышке' : (JOKES[key] ?? DEFAULT_JOKE);

  return (
    <Sheet title={cat?.name ?? 'Кошелёк'} onClose={() => sheetClosed()} className="gap-4 px-5 pt-2">
      <div className="flex flex-col gap-1">
        <span className="truncate text-[17px] font-semibold text-ink2">{cat?.name ?? 'Кошелёк'}</span>
        <span className="text-[52px] leading-none font-bold tracking-[-0.04em] whitespace-nowrap">
          {moneyShort(total)} <span className="text-2xl font-medium tracking-normal text-ink2">{cur.symbol}</span>
        </span>
        {budget > 0 && <span className="text-[15px] text-ink2">из {moneyShort(budget)}</span>}
        <span className="mt-1 text-[15px]" style={{ color: low ? 'var(--danger)' : 'var(--ink2)' }}>
          {status}
        </span>
      </div>

      {total > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => sheetOpened({ type: 'spend', source: key })} className="h-[68px] rounded-[20px] bg-accent text-[17px] font-semibold text-accent-ink">
            Потратить
          </button>
          <button onClick={() => sheetOpened({ type: 'distribute', source: key })} className="h-[68px] rounded-[20px] bg-btn2 text-[17px] font-semibold text-ink">
            {key === 'pile' ? 'Разложить' : 'Переложить'}
          </button>
        </div>
      ) : (
        pileTotal(w) > 0 && (
          <button onClick={() => sheetOpened({ type: 'distribute', source: 'pile' })} className="h-[68px] rounded-[20px] bg-accent text-[17px] font-semibold text-accent-ink">
            Положить из кошелька
          </button>
        )
      )}

      {(canExchange || cat) && (
        <div className="flex gap-2.5">
          {canExchange && (
            <button
              onClick={() => {
                sheetClosed();
                exchangeOpened(loc);
              }}
              className={SECONDARY}
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
              className={SECONDARY}
            >
              ✎ Ячейка
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}
