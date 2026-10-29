'use client';

import { useUnit } from 'effector-react';
import { moneyShort, money } from '@/lib/money/format';
import { billsIn, totalIn, walletCoins } from '@/model/ops';
import { $drag, $dragTarget, categoryEditOpened, exchangeOpened, pigOpened } from '@/model/ui';
import { $currency, $layout, $piggyTotal, $pileTotal, $wallet, spreadRequested } from '@/model/wallet';
import { slotKey } from '@/model/types';
import { Button } from '@/components/ui/Button';

/** DOM layer above the canvas: paper tags, labels and drop highlights. Click-through except buttons. */
export function WallOverlay() {
  const [w, L, cur, drag, target, pileTotal, pigTotal] = useUnit([$wallet, $layout, $currency, $drag, $dragTarget, $pileTotal, $piggyTotal]);
  const PILE = L.pile, PIGGY = L.piggy, PIG_INFO = L.pigInfo, purse = L.purse;
  const from = drag ? slotKey(drag.from) : null;
  const pileCount = billsIn(w, { type: 'pile' }).length;
  const walletCoinCount = walletCoins(w).length;

  return (
    <div className="pointer-events-none absolute inset-0">
      {w.categories.map((c, i) => {
        const r = L.cells.get(c.id);
        if (!r) return null;
        const k = totalIn(w, { type: 'cell', cellId: c.id });
        const low = c.budget > 0 && k > 0 && k <= c.budget * 0.15;
        return (
          <div key={c.id} className="absolute" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
            <button
              onClick={() => categoryEditOpened(c.id)}
              title="Переименовать или поменять бюджет"
              className="pointer-events-auto absolute top-2 left-2 z-10 max-w-[calc(100%-16px)] rounded-[3px] bg-tag py-1.5 pr-2.5 pl-[18px] text-left text-tag-ink shadow-[0_1px_1px_rgba(0,0,0,0.2),0_4px_8px_-4px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-px"
              style={{ transform: `rotate(${(((i * 37) % 5) - 2) * 0.8}deg)` }}
            >
              <span className="absolute top-[9px] left-1.5 h-[7px] w-[7px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#ff8a6a,#b8321b)] shadow-[0_1px_1px_rgba(0,0,0,0.4)]" />
              <div className="truncate text-[13px] leading-tight font-semibold">{c.name}</div>
              <div className="text-[11px] leading-snug whitespace-nowrap">
                <span className="font-semibold">{moneyShort(k)}</span>
                {c.budget > 0 && <span className="opacity-60"> / {moneyShort(c.budget)}</span>}
              </div>
              {low && <div className="mt-0.5 text-[10px] leading-tight font-semibold text-[#b8321b]">Осторожно, на донышке</div>}
            </button>
            {k === 0 && (
              <div className="absolute inset-[52px_10px_10px_10px] flex items-center justify-center p-1.5 text-center text-[13px] leading-snug font-medium text-[var(--dash-ink)] opacity-80">
                Тут было что-то. Было.
              </div>
            )}
            {target === c.id && from !== c.id && (
              <div className="absolute -inset-[3px] rounded-[7px] border-2 border-[rgba(255,250,235,0.95)] bg-[rgba(255,250,235,0.14)] shadow-[0_0_0_4px_rgba(255,250,235,0.25)]" />
            )}
          </div>
        );
      })}

      {L.addCell && (
        // A flat empty slot on the board: pale frame, big plus, no words.
        <button
          onClick={() => categoryEditOpened('new')}
          aria-label="Добавить ячейку"
          title="Добавить ячейку"
          className="group pointer-events-auto absolute flex items-center justify-center rounded-[6px] border-2 border-[rgba(255,244,225,0.16)] bg-[rgba(255,244,225,0.03)] text-[rgba(255,244,225,0.28)] transition-colors duration-200 hover:border-[rgba(255,244,225,0.4)] hover:bg-[rgba(255,244,225,0.07)] hover:text-[rgba(255,244,225,0.65)]"
          style={{ left: L.addCell.x, top: L.addCell.y, width: L.addCell.w, height: L.addCell.h }}
        >
          <svg viewBox="0 0 40 40" width={44} height={44} className="transition-transform duration-200 group-hover:scale-110" aria-hidden>
            <path d="M20 6v28M6 20h28" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" />
          </svg>
        </button>
      )}

      <div className="absolute" style={{ left: PILE.x, top: PILE.y, width: PILE.w, height: PILE.h }}>
        {/* One line, so the bills sticking out of the wallet never reach it. */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2 whitespace-nowrap">
            <span className="text-base">
              В кошельке: <b>{moneyShort(pileTotal)} {cur.symbol}</b>
            </span>
            <span className="truncate text-[13px] text-ink2">
              {pileCount ? 'Грустят без дела' : walletCoinCount ? 'Мелочь — свинке' : 'Всё по местам'}
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" className="pointer-events-auto" title="Разменять или собрать крупнее. Ещё — двойной клик по купюре" onClick={() => exchangeOpened({ type: 'pile' })}>
            ⇄ Размен
          </Button>
          <Button variant="accentOutline" size="sm" className="pointer-events-auto" disabled={!pileCount} onClick={() => spreadRequested()}>
            Разложить как в прошлый раз
          </Button>
          </div>
        </div>
      </div>
      {!pileCount && (
        <div
          className="absolute flex items-center justify-center text-center text-[13px] font-medium text-[rgba(255,236,205,0.75)]"
          style={{ left: purse.pocket.x, top: purse.pocket.y + 18, width: purse.coinPocket.x - purse.pocket.x, height: purse.pocket.h - 24 }}
        >
          Пусто. Даже моль улетела
        </div>
      )}
      {target === 'pile' && from !== 'pile' && (
        <div
          className="absolute rounded-[22px] shadow-[0_0_0_4px_rgba(255,250,235,0.7),0_0_34px_10px_rgba(255,220,180,0.45)]"
          style={{ left: purse.back.x - 6, top: purse.back.y - 6, width: purse.back.w + 12, height: purse.pocket.y + purse.pocket.h - purse.back.y + 6 }}
        />
      )}

      {target === 'piggy' && (
        <div
          className="absolute rounded-[50%] shadow-[0_0_0_6px_rgba(255,250,235,0.6),0_0_30px_8px_rgba(255,220,180,0.45)]"
          style={{ left: PIGGY.x + 16, top: PIGGY.y + 26, width: 180, height: 124 }}
        />
      )}

      <div className="absolute flex flex-col gap-1" style={{ left: PIG_INFO.x, top: PIG_INFO.y, width: PIG_INFO.w }}>
        <span className="text-[15px] font-semibold">Нужная мусорка</span>
        <span className="text-[26px] leading-tight font-semibold tracking-[-0.03em]">
          {money(pigTotal)} <span className="text-base font-medium text-ink2">{cur.symbol}</span>
        </span>
        {pigTotal === 0 && <span className="text-[13px] leading-snug text-ink2">Свинка голодает</span>}
        <Button variant="secondary" size="sm" className="pointer-events-auto mt-1.5 self-start border border-line !h-[38px] !text-[13px]" disabled={pigTotal === 0} onClick={() => pigOpened()}>
          Забрать
        </Button>
      </div>
    </div>
  );
}
