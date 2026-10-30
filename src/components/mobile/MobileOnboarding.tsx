'use client';

import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { moneyShort, plural } from '@/lib/money/format';
import { payout, sum } from '@/lib/money/math';
import { pageHref } from '@/lib/paths';
import { gauss, rng } from '@/lib/rng';
import { sheetOpened } from '@/model/mobile';
import { budgetsInFillOrder } from '@/model/ops';
import { wallOpened } from '@/model/ui';
import { $currency, $wallet, incomeReceived } from '@/model/wallet';
import { Hand } from '@/components/onboarding/Hand';
import { Stack } from '@/components/onboarding/Stack';
import { play } from '@/sound/sfx';
import { billImg } from './parts';

type Phase = 'income' | 'falling' | 'landed';

const HAND_SCALE = 0.78;
const MAX_BILLS = 80;
const TABLE_H = 340;
/** The heap on the table: inset from the sides, raised above the bottom edge. */
const HEAP = { side: 16, bottom: 108, h: 200, bw: 80, bh: 40 };
/** Holding a bill removes one, like the "−" under it. */
const HOLD_MS = 450;

const subscribeResize = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};
const useViewport = () => {
  const key = useSyncExternalStore(subscribeResize, () => `${window.innerWidth}x${window.innerHeight}`, () => '390x844');
  const [w, h] = key.split('x').map(Number);
  return { vw: w, vh: h };
};

/** Bill you tap to add to the wad; "−" or a long press takes one back. */
function DenomButton({ value, count, onAdd, onRemove }: { value: number; count: number; onAdd: () => void; onRemove: () => void }) {
  const cur = useUnit($currency);
  const hold = useRef<{ t: number; fired: boolean } | null>(null);
  const release = () => {
    if (hold.current) clearTimeout(hold.current.t);
  };
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        aria-label={'Добавить ' + moneyShort(value)}
        onPointerDown={() => {
          release();
          const h = { t: 0, fired: false };
          h.t = window.setTimeout(() => {
            h.fired = true;
            if (count) {
              onRemove();
              navigator.vibrate?.(10);
            }
          }, HOLD_MS);
          hold.current = h;
        }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onClick={() => {
          if (hold.current?.fired) return;
          onAdd();
        }}
        onContextMenu={e => {
          e.preventDefault();
          if (!hold.current?.fired) onRemove();
        }}
        className="relative h-[52px] w-[104px] select-none transition-transform duration-150 active:scale-[0.96] [-webkit-touch-callout:none]"
      >
        {billImg(value, cur, 104, { boxShadow: '0 1px 1px rgba(0,0,0,0.22), 0 6px 10px -4px rgba(40,20,0,0.45)', borderRadius: 4 })}
      </button>
      <div className="flex h-[30px] items-center gap-2">
        {count > 0 && (
          <>
            <button onClick={onRemove} aria-label={'Убрать ' + moneyShort(value)} className="h-[30px] w-[30px] rounded-full border border-line bg-btn2 text-[17px] leading-none text-ink">
              −
            </button>
            <span className="text-sm font-semibold">×{count}</span>
          </>
        )}
      </div>
    </div>
  );
}

/** "Сколько получил?" on a phone: tap bills into the hand, it lets go, they land on the table. */
export function MobileOnboarding() {
  const [w, cur] = useUnit([$wallet, $currency]);
  const { vw, vh } = useViewport();
  const [phase, setPhase] = useState<Phase>('income');
  const [bills, setBills] = useState<number[]>([]);
  const [coins, setCoins] = useState<number[]>([]);
  const [manual, setManual] = useState<string | null>(null);
  const total = sum(bills) + sum(coins);
  // Short phones: the picker moves up and the hand with it.
  const pickTop = vh < 760 ? 200 : 246;
  const handClosed = -74 + (pickTop - 246) / HAND_SCALE;

  const heapW = vw - 2 * HEAP.side;
  const heapTop = vh - HEAP.bottom - HEAP.h;
  const heap = useMemo(() => {
    const r = rng(bills.length * 13 + 5);
    return [...bills].reverse().map((value, i) => {
      const x = Math.max(0, Math.min(heapW - HEAP.bw, heapW / 2 - HEAP.bw / 2 + gauss(r) * 130));
      const y = Math.max(0, Math.min(HEAP.h - HEAP.bh, 80 + gauss(r) * 46));
      // Starts in the hand, at the top middle of the screen.
      const sx = vw / 2 - (HEAP.side + x + HEAP.bw / 2);
      const sy = 205 - (heapTop + y + HEAP.bh / 2);
      return { value, x, y, r: (r() - 0.5) * 80, sx, sy, sw: (r() - 0.5) * 90, delay: i * 0.045 };
    });
  }, [bills, heapW, heapTop, vw]);

  useEffect(() => {
    if (phase !== 'falling') return;
    play('flutter', 0.3);
    const t = setTimeout(() => setPhase('landed'), heap.length * 45 + 1050);
    return () => clearTimeout(t);
  }, [phase, heap.length]);

  const fill = (amount: number) => {
    const p = payout(amount, cur, budgetsInFillOrder(w));
    setBills(p.bills.slice(0, MAX_BILLS));
    setCoins(p.coins);
  };
  const add = (v: number) => {
    if (bills.length >= MAX_BILLS) return;
    setBills(b => [...b, v]);
    play('rustle');
  };
  const remove = (v: number) =>
    setBills(b => {
      const i = b.lastIndexOf(v);
      return i < 0 ? b : b.filter((_, j) => j !== i);
    });
  const confirm = () => {
    if (!total) return;
    setManual(null);
    setPhase('falling');
  };
  const toWall = () => {
    wallOpened();
    // The wall is on screen by then, so the bills drop into the pile.
    setTimeout(() => incomeReceived({ bills, coins }), 350);
  };

  const rich = total >= 2000 * 100 * cur.scale, poor = total < 700 * 100 * cur.scale;
  const n = bills.length;
  const open = phase !== 'income';

  return (
    <div className="fixed inset-0 overflow-hidden bg-page" style={{ background: 'radial-gradient(ellipse 360px 320px at 50% 0%, var(--spot), transparent 72%), var(--page)' }}>
      <div className="absolute inset-x-0 z-30 flex items-center justify-between pr-4 pl-5" style={{ top: 'max(10px, env(safe-area-inset-top))' }}>
        <a href={pageHref('/')} className="text-[17px] font-bold tracking-[-0.02em] text-ink">
          наличка
        </a>
        <div className="flex gap-2">
          {w.onboarded && phase === 'income' && (
            <button onClick={() => wallOpened()} className="h-10 rounded-full bg-btn2 px-3.5 text-sm font-medium text-ink">
              К стене
            </button>
          )}
          <button onClick={() => sheetOpened({ type: 'menu' })} aria-label="Настройки" className="h-10 w-10 rounded-full bg-btn2 text-lg text-ink">
            ⋯
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 z-10 h-[340px] w-[260px] origin-top-left" style={{ left: 'calc(50% - 101px)', transform: `scale(${HAND_SCALE})` }}>
        <Hand open={open} left={0} top={{ closed: handClosed, open: -385 }}>
          {phase === 'income' && <Stack bills={bills} />}
        </Hand>
      </div>

      {phase === 'income' && (
        <div className="absolute inset-x-0 z-[15] flex flex-col items-center text-center" style={{ top: pickTop }}>
          <h1 className="m-0 text-[32px] leading-[1.1] font-bold tracking-[-0.035em]">Сколько получил?</h1>
          <div className="mt-1.5 text-[46px] leading-[1.05] font-bold tracking-[-0.04em]">
            {moneyShort(total)} <span className="text-[22px] font-medium text-ink2">{cur.code}</span>
          </div>
          <div className="mt-1 min-h-5 text-sm text-ink2">
            {n
              ? `${n} ${plural(n, 'купюра', 'купюры', 'купюр')} в пачке` + (coins.length ? ` и ${coins.length} ${plural(coins.length, 'монета', 'монеты', 'монет')}` : '')
              : 'Тапай по купюрам — пачка в руке растёт'}
          </div>
          <div className="mt-4 grid grid-cols-[repeat(3,104px)] gap-x-3.5 gap-y-2.5">
            {cur.bills.map(v => (
              <DenomButton key={v} value={v} count={bills.filter(x => x === v).length} onAdd={() => add(v)} onRemove={() => remove(v)} />
            ))}
          </div>
          {manual === null ? (
            <div className="mt-2.5 flex items-center gap-3.5">
              {w.lastIncome > 0 && (
                <button onClick={() => fill(w.lastIncome)} className="h-10 rounded-full border-[1.5px] border-accent bg-accent-wash px-4 text-sm font-semibold text-ink">
                  Как в прошлый раз · {moneyShort(w.lastIncome)}
                </button>
              )}
              <button onClick={() => setManual(total ? String(Math.floor(total / 100)) : '')} className="h-10 text-sm text-ink2 underline underline-offset-[3px]">
                ввести вручную
              </button>
            </div>
          ) : (
            <div className="mt-2.5 flex items-center gap-2">
              <input
                autoFocus
                value={manual}
                inputMode="numeric"
                placeholder="3600"
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '').slice(0, 7);
                  setManual(raw);
                  fill(parseInt(raw || '0', 10) * 100);
                }}
                onKeyDown={e => e.key === 'Enter' && setManual(null)}
                className="h-11 w-[140px] rounded-[14px] border border-line bg-field px-3.5 text-right text-lg font-semibold text-ink"
              />
              <span className="text-[15px] text-ink2">{cur.code}</span>
              <button onClick={() => setManual(null)} className="h-11 rounded-full bg-btn2 px-4 text-sm font-semibold text-ink">
                Готово
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'falling' && <div className="absolute inset-x-0 top-[300px] z-[15] animate-[fade-up_.3s_ease_both] text-center text-5xl font-bold tracking-[-0.04em]">Лови!</div>}
      {phase === 'landed' && (
        <div className="absolute inset-x-7 top-[168px] z-[15] flex animate-[fade-up_.4s_ease_both] flex-col items-center gap-2.5 text-center">
          <h1 className="m-0 text-[30px] leading-[1.12] font-bold tracking-[-0.03em] text-balance">
            {rich ? 'Ого, богач! Ну давай раскладывать, пока не разлетелось' : poor ? 'Ну… бывает. Зато раскладывать быстро' : 'Неплохо! Давай разложим, пока ветер не поднялся'}
          </h1>
          <span className="text-[15px] text-ink2">
            {n} {plural(n, 'купюра', 'купюры', 'купюр')} на столе · {moneyShort(total)} {cur.code}
          </span>
        </div>
      )}

      {open && (
        <div
          className="wood absolute inset-x-0 bottom-0 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_-20px_40px_-20px_rgba(40,20,0,0.35)]"
          style={{ height: Math.min(TABLE_H, vh * 0.42) }}
        />
      )}
      {open && (
        <div className="pointer-events-none absolute z-[12]" style={{ left: HEAP.side, right: HEAP.side, bottom: HEAP.bottom, height: HEAP.h }}>
          {heap.map((b, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: b.x, top: b.y, zIndex: i + 1 }}
              initial={{ x: b.sx, y: b.sy, rotate: 0, opacity: 0 }}
              animate={{
                x: [b.sx, b.sx * 0.55 + b.sw, 0, 0, 0],
                y: [b.sy, b.sy * 0.5, 5, -4, 0],
                rotate: [0, -b.r * 0.6, b.r, b.r, b.r],
                opacity: [0, 1, 1, 1, 1],
              }}
              transition={{ duration: 1, delay: b.delay, times: [0, 0.4, 0.74, 0.87, 1], ease: 'easeInOut' }}
            >
              {billImg(b.value, cur, HEAP.bw, { boxShadow: '0 1px 1px rgba(0,0,0,0.24), 0 6px 9px -3px rgba(30,15,0,0.45)' })}
            </motion.div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-5 z-20" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        {phase === 'income' && (
          <button
            onClick={confirm}
            disabled={!total}
            className="h-14 w-full rounded-[18px] bg-accent text-[17px] font-semibold text-accent-ink shadow-[0_12px_26px_-14px_rgba(30,70,50,0.9)] disabled:opacity-40"
          >
            {total ? `Получил · ${moneyShort(total)} ${cur.code}` : 'Сначала натапай сумму'}
          </button>
        )}
        {phase === 'landed' && (
          <button
            onClick={toWall}
            className="h-14 w-full animate-[fade-up_.4s_ease_both] rounded-[18px] bg-accent text-[17px] font-semibold text-accent-ink shadow-[0_12px_26px_-14px_rgba(0,0,0,0.6)]"
          >
            Разложить по стене →
          </button>
        )}
      </div>
    </div>
  );
}
