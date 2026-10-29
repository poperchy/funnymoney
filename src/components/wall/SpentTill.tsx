'use client';

import { useUnit } from 'effector-react';
import { motion, type TargetAndTransition } from 'motion/react';
import { useEffect, useRef } from 'react';
import { money } from '@/lib/money/format';
import { $drag, $shred, $tillBill, tillCleared, type TillBill } from '@/model/ui';
import { $currency, $wallet } from '@/model/wallet';
import { billIndex } from '@/lib/money/currency';
import { rng } from '@/lib/rng';
import { BILL_PAL } from '@/scene/palette';
import { setSpentZone } from '@/scene/WallScene';
import { BillImg } from '@/components/money/BillImg';

const sameMonth = (iso: string, now = new Date()) => {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export const monthName = () => new Date().toLocaleString('ru-RU', { month: 'long' }).toLowerCase();

const TILL_MOTION: Record<TillBill['state'], TargetAndTransition> = {
  // Hovers over the slot while you decide.
  // Half-tucked into the slot, so it doesn't cover the caption.
  waiting: { y: 14, rotate: 0, opacity: 1, transition: { duration: 0.45, ease: [0.22, 0.8, 0.3, 1] } },
  // Slides down into the slot and is gone.
  eaten: { y: [null, 18, 80], rotate: 0, opacity: 1, transition: { duration: 0.8, times: [0, 0.3, 1], ease: 'easeIn', delay: 0.1 } },
  // "Ой, верни обратно": pops up and out.
  returned: { y: -90, rotate: 12, opacity: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

/** The swallowed bill coming out under the slot as a shower of shredded strips and a few sparkles. */
function Shreds({ burst }: { burst: { key: number; value: number } }) {
  const cur = useUnit($currency);
  const [p0, p1, p2] = BILL_PAL[billIndex(cur, burst.value)];
  const r = rng(burst.key * 7919 + burst.value);
  const pieces = Array.from({ length: 22 }, (_, i) => {
    const strip = i < 15;
    return {
      strip,
      // Strips leave the slot side by side, like out of a shredder; sparkles scatter wider.
      x: strip ? (i / 14 - 0.5) * 92 : (r() - 0.5) * 120,
      w: strip ? 3 + r() * 2 : 3 + r() * 3,
      h: strip ? 9 + r() * 8 : 3 + r() * 3,
      color: strip ? [p0, p1, p2][i % 3] : r() > 0.5 ? '#fff6dc' : p0,
      fall: 34 + r() * 30,
      drift: (r() - 0.5) * (strip ? 26 : 60),
      spin: (r() - 0.5) * (strip ? 260 : 540),
      delay: 0.42 + (strip ? i * 0.012 : 0.1 + r() * 0.15),
    };
  });
  return (
    <div key={burst.key} className="pointer-events-none absolute top-5 left-1/2 z-[2]">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-[1px]"
          style={{ left: p.x, width: p.w, height: p.h, background: p.color, boxShadow: '0 1px 1px rgba(0,0,0,0.25)' }}
          initial={{ y: -6, opacity: 0, rotate: 0 }}
          animate={{ y: [-6, 4, p.fall], x: [0, p.drift * 0.3, p.drift], rotate: [0, p.spin * 0.2, p.spin], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.1, delay: p.delay, ease: 'easeIn', times: [0, 0.2, 1] }}
        />
      ))}
    </div>
  );
}

/** "Потрачено" — the cash register where bills are dropped to spend them. */
export function SpentTill() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, drag, till, shred] = useUnit([$wallet, $drag, $tillBill, $shred]);
  const over = drag?.target?.type === 'spent';
  const spentMonth = w.receipts.filter(r => sameMonth(r.at)).reduce((a, r) => a + r.amount, 0);

  useEffect(() => {
    setSpentZone(ref.current);
    return () => setSpentZone(null);
  }, []);

  return (
    <div
      ref={ref}
      className="relative h-[168px] overflow-hidden rounded-[20px] px-[18px] py-4 text-[#f6efe3] transition-[box-shadow,transform] duration-200"
      style={{
        background: 'var(--till)',
        boxShadow: over ? '0 0 0 3px var(--accent), 0 24px 40px -20px rgba(0,0,0,0.6)' : '0 24px 40px -24px rgba(0,0,0,0.55)',
        transform: over ? 'scale(1.02)' : 'none',
      }}
    >
      <div className="relative z-[3] flex flex-col gap-0.5">
        <span className="text-lg font-bold tracking-[-0.01em]">Потрачено</span>
        <span className="text-[13px] text-[rgba(246,239,227,0.7)]">{over ? 'Отпускай. Не бойся' : drag ? 'Сюда, сюда' : 'Брось сюда купюру из ячейки'}</span>
      </div>
      <div className="absolute inset-x-[22px] bottom-[30px] h-[62px] rounded-xl bg-[rgba(0,0,0,0.35)] shadow-[inset_0_3px_8px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-x-3.5 top-3 h-2 rounded-full bg-[#0b0806] shadow-[0_1px_0_rgba(255,255,255,0.12)]" />
        {/* Clipped at the slot line, so a bill sliding down disappears into the till. */}
        <div className="absolute inset-x-0 -top-[60px] h-[76px] overflow-hidden">
          {till && (
            <motion.div
              key={till.key}
              className="absolute top-[18px] left-1/2 -ml-[50px]"
              initial={{ y: -80, rotate: -6, opacity: 0 }}
              animate={TILL_MOTION[till.state]}
              onAnimationComplete={() => till.state !== 'waiting' && tillCleared()}
            >
              <BillImg value={till.value} />
            </motion.div>
          )}
        </div>
        <motion.div
          key={till?.state === 'eaten' ? 'glow' + till.key : 'idle'}
          className="absolute inset-x-3.5 top-3 h-2 rounded-full"
          initial={{ boxShadow: '0 0 0 0 rgba(255,214,140,0)' }}
          animate={till?.state === 'eaten' ? { boxShadow: ['0 0 0 0 rgba(255,214,140,0)', '0 0 14px 3px rgba(255,214,140,0.55)', '0 0 0 0 rgba(255,214,140,0)'] } : {}}
          transition={{ duration: 0.9, delay: 0.35 }}
        />
        {shred && <Shreds key={'shred' + shred.key} burst={shred} />}
        <div className="absolute bottom-2.5 left-3.5 text-xs text-[rgba(246,239,227,0.55)]">
          −{money(spentMonth)} за {monthName()}
        </div>
      </div>
    </div>
  );
}
