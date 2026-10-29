'use client';

import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { moneyShort, plural } from '@/lib/money/format';
import { payout, sum } from '@/lib/money/math';
import { gauss, rng } from '@/lib/rng';
import { budgetsInFillOrder } from '@/model/ops';
import { tableReached, wallOpened } from '@/model/ui';
import { $currency, $wallet, incomeReceived } from '@/model/wallet';
import { BillImg, CoinFace, CountButton } from '@/components/money/BillImg';
import { Button } from '@/components/ui/Button';
import { CurrencySelect, SoundControl, ThemeButton } from '@/components/wall/Header';
import { BH, BW } from '@/scene/layout';
import { pageHref } from '@/lib/paths';
import { play } from '@/sound/sfx';
import { Hand } from './Hand';
import { Stack } from './Stack';

const HEAP = { left: 305, w: 692, h: 170, scale: 1.2 };
const TABLE_H = 220;
/** Centre of the wad in the hand, in stage coordinates. */
const HAND_AT = { x: 720, y: 230 };
/** How long the camera takes to follow the money down to the table. */
export const FALL_PAN_S = 1.1;

type Phase = 'income' | 'falling' | 'landed';

/**
 * The income ritual as two stacked stops of the stage, each one viewport tall (`hd`, design px):
 * the hand with the wad on top, the table below. Bills fall from the hand and the camera follows.
 */
export function Onboarding({ hd }: { hd: number }) {
  const [w, cur] = useUnit([$wallet, $currency]);
  const [phase, setPhase] = useState<Phase>('income');
  const [bills, setBills] = useState<number[]>([]);
  const [coins, setCoins] = useState<number[]>([]);
  const [manual, setManual] = useState<string | null>(null);
  const total = sum(bills) + sum(coins);
  const budgets = budgetsInFillOrder(w);
  const heapTop = 2 * hd - TABLE_H + 10;

  const heap = useMemo(() => {
    const r = rng(bills.length * 13 + 5);
    return bills.map((value, i) => {
      const x = Math.max(0, Math.min(HEAP.w - BW, HEAP.w / 2 - BW / 2 + gauss(r) * 230));
      const y = Math.max(0, Math.min(HEAP.h - BH, HEAP.h / 2 - BH / 2 + gauss(r) * 42));
      // Start offset from the hand, in the heap's own (scaled) units.
      const sx = (HAND_AT.x - (HEAP.left + (x + BW / 2) * HEAP.scale)) / HEAP.scale;
      const sy = (HAND_AT.y - (heapTop + (y + BH / 2) * HEAP.scale)) / HEAP.scale;
      return { value, x, y, r: (r() - 0.5) * 80, sx, sy, sw: (r() - 0.5) * 160, delay: 0.1 + i * 0.05 };
    });
  }, [bills, heapTop]);

  useEffect(() => {
    if (phase !== 'falling') return;
    play('flutter', 0.5);
    const t = setTimeout(() => setPhase('landed'), heap.length * 50 + 1700);
    return () => clearTimeout(t);
  }, [phase, heap.length]);

  const add = (v: number) => {
    setBills(b => [...b, v]);
    setManual(null);
    play('rustle');
  };
  const removeLast = (list: number[], v: number) => {
    const i = list.lastIndexOf(v);
    return i < 0 ? list : list.filter((_, j) => j !== i);
  };
  const remove = (v: number) => setBills(b => removeLast(b, v));
  const addCoin = (v: number) => {
    setCoins(c => [...c, v]);
    setManual(null);
    play('clink');
  };
  // The three biggest coins are enough to round any salary.
  const handCoins = cur.coins.slice(-3).reverse();
  const fill = (amount: number) => {
    const p = payout(amount, cur, budgets);
    setBills(p.bills);
    setCoins(p.coins);
  };
  const confirm = () => {
    if (!bills.length && !coins.length) return;
    setPhase('falling');
    tableReached();
  };
  const toWall = () => {
    wallOpened();
    // Bills land in the pile as the camera arrives at the wall.
    setTimeout(() => incomeReceived({ bills, coins }), 750);
  };

  const rich = total >= 2000 * 100 * cur.scale, poor = total < 700 * 100 * cur.scale;
  const handTitleTop = Math.min(330, hd * 0.37);

  return (
    <div className="relative" style={{ height: 2 * hd }}>
      {/* ── Stop 1: the hand ── */}
      <div className="absolute inset-x-0 top-0" style={{ height: hd, background: 'radial-gradient(ellipse 760px 520px at 50% 0%, var(--spot), transparent 70%)' }}>
        <div className="absolute inset-x-7 top-6 z-20 flex items-center justify-between">
          <a href={pageHref('/')} className="text-lg font-bold tracking-[-0.02em] text-ink">
            наличка
          </a>
          <div className="flex gap-2.5">
            <CurrencySelect size="sm" />
            <ThemeButton size="sm" />
            <SoundControl size="sm" />
            {w.onboarded && phase === 'income' && (
              <Button variant="secondary" size="sm" className="font-medium" onClick={() => wallOpened()}>
                Не сейчас
              </Button>
            )}
          </div>
        </div>

        <Hand open={phase !== 'income'}>{phase === 'income' && <Stack bills={bills} />}</Hand>

        <div className="absolute inset-x-0 z-[15] flex flex-col items-center gap-3.5 text-center" style={{ top: handTitleTop }}>
          <h1 className="m-0 text-[54px] leading-[1.02] font-bold tracking-[-0.04em]">Сколько получил?</h1>
          <div className="text-lg text-ink2">
            {total
              ? `В пачке ${moneyShort(total)} ${cur.symbol} · ${bills.length} ${plural(bills.length, 'купюра', 'купюры', 'купюр')}` +
                (coins.length ? ` и ${coins.length} ${plural(coins.length, 'монета', 'монеты', 'монет')}` : '')
              : 'Пока пусто. Накидай купюр в руку'}
          </div>
          <div className="mt-1 flex items-start justify-center gap-4">
            {cur.bills.map(v => (
              <CountButton key={v} big label={'Добавить ' + moneyShort(v)} count={bills.filter(x => x === v).length} onAdd={() => add(v)} onRemove={() => remove(v)}>
                <BillImg value={v} scale={1.5} />
              </CountButton>
            ))}
            <div className="flex flex-col items-center gap-1.5 border-l border-line pl-4">
              <div className="flex gap-2.5 pt-1">
                {handCoins.map(v => (
                  <CountButton
                    key={v}
                    label={'Добавить монету ' + moneyShort(v)}
                    count={coins.filter(x => x === v).length}
                    onAdd={() => addCoin(v)}
                    onRemove={() => setCoins(c => removeLast(c, v))}
                  >
                    <CoinFace value={v} size={40} />
                  </CountButton>
                ))}
              </div>
              <span className="text-xs text-ink2">мелочь — в кошелёк</span>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <Button variant="primary" className="!h-[54px] !px-[30px] !text-[17px]" disabled={!total || phase !== 'income'} onClick={confirm}>
              Получил
            </Button>
            {w.lastIncome > 0 && (
              <Button variant="secondary" className="!h-[54px] !px-[22px] border-[1.5px] border-line !text-[15px]" onClick={() => fill(w.lastIncome)}>
                Как в прошлый раз · {moneyShort(w.lastIncome)}
              </Button>
            )}
            {total > 0 && (
              <Button
                variant="link"
                className="!no-underline !text-[15px] px-2"
                onClick={() => {
                  setBills([]);
                  setCoins([]);
                  setManual(null);
                }}
              >
                Сбросить
              </Button>
            )}
            {manual === null ? (
              <Button variant="link" onClick={() => setManual('')}>
                ввести вручную
              </Button>
            ) : (
              <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-field px-3.5">
                <input
                  autoFocus
                  value={manual}
                  inputMode="numeric"
                  placeholder="сумма"
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 7);
                    setManual(raw);
                    fill(parseInt(raw || '0', 10) * 100);
                  }}
                  onKeyDown={e => e.key === 'Enter' && confirm()}
                  className="w-[90px] bg-transparent text-base font-semibold text-ink"
                />
                <span className="text-[13px] text-ink2">{cur.symbol}</span>
              </label>
            )}
          </div>
          <div className="text-[13px] text-ink2">Клик по купюре добавляет её в пачку, правый клик или «−» убирает</div>
        </div>
      </div>

      {/* ── Stop 2: the table ── */}
      <div className="absolute inset-x-0" style={{ top: hd, height: hd }}>
        <div className="absolute inset-x-0 flex flex-col items-center gap-[18px] text-center" style={{ top: Math.max(90, (hd - TABLE_H) * 0.38) }}>
          {phase !== 'income' && (
            <h2 className="m-0 text-[54px] leading-[1.02] font-bold tracking-[-0.04em]">
              {phase === 'landed' ? `${moneyShort(total)} ${cur.symbol} на столе` : 'Лови!'}
            </h2>
          )}
          {phase === 'landed' && (
            <motion.div className="flex flex-col items-center gap-[18px]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <span className="max-w-[560px] text-xl text-balance text-ink2">
                {rich ? 'Ого, богач! Ну давай раскладывать, пока не разлетелось' : poor ? 'Ну… бывает. Зато раскладывать быстро' : 'Неплохо! Давай разложим, пока ветер не поднялся'}
              </span>
              <Button variant="primary" className="!h-[54px] !px-[30px] !text-[17px]" onClick={toWall}>
                К стене ↓
              </Button>
            </motion.div>
          )}
        </div>
        <div className="wood absolute inset-x-0 bottom-0 shadow-[inset_0_2px_0_rgba(255,255,255,0.18),0_-20px_40px_-20px_rgba(40,20,0,0.35)]" style={{ height: TABLE_H }} />
      </div>

      {phase !== 'income' && (
        // Above the hand screen's controls, so the money falls in front of everything.
        <div className="pointer-events-none absolute z-30" style={{ left: HEAP.left, top: heapTop, width: HEAP.w, height: HEAP.h, transform: `scale(${HEAP.scale})`, transformOrigin: '0 0' }}>
          {heap.map((b, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: b.x, top: b.y, zIndex: i + 1 }}
              initial={{ x: b.sx, y: b.sy, rotate: 0, opacity: 0 }}
              animate={{
                x: [b.sx, b.sx * 0.6 + b.sw, b.sw * 0.3, 0, 0],
                y: [b.sy, b.sy * 0.55, 6, -4, 0],
                rotate: [0, -b.r * 0.8, b.r * 1.2, b.r, b.r],
                opacity: [0, 1, 1, 1, 1],
              }}
              transition={{ duration: 1.5, delay: b.delay, times: [0, 0.45, 0.78, 0.9, 1], ease: 'easeInOut' }}
            >
              <BillImg value={b.value} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
