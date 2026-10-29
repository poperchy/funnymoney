'use client';

import { useUnit } from 'effector-react';
import { motion } from 'motion/react';
import { billIndex } from '@/lib/money/currency';
import { $currency } from '@/model/wallet';
import { BILL_PAL } from '@/scene/palette';
import { BillImg } from '@/components/money/BillImg';

const W = 220, H = 110;

/** The wad in the hand: edges of the bills below, the latest bill on top, a paper band once it's thick. */
export function Stack({ bills }: { bills: number[] }) {
  const cur = useUnit($currency);
  if (!bills.length) return <div className="rounded-[10px] border-2 border-dashed border-[rgba(120,90,60,0.35)]" style={{ width: W, height: H }} />;
  const layers = Math.min(30, bills.length);
  const top = bills[bills.length - 1];
  return (
    <div className="relative" style={{ width: W + layers * 1.5, height: H + layers * 1.8, filter: 'drop-shadow(0 18px 18px rgba(30,15,0,0.35))' }}>
      {Array.from({ length: layers - 1 }, (_, j) => {
        const i = layers - 1 - j;
        const [p0, p1] = BILL_PAL[billIndex(cur, bills[(bills.length - 1 - i + bills.length) % bills.length])];
        return (
          <div
            key={i}
            className="absolute rounded-lg"
            style={{ left: i * 1.5, top: i * 1.8, width: W, height: H, background: `linear-gradient(135deg, ${p0}, ${p1})`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.14), 0 1px 0 rgba(0,0,0,0.12)' }}
          />
        );
      })}
      <motion.div key={bills.length} className="absolute top-0 left-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <BillImg value={top} scale={2.2} className="!rounded-lg" style={{ boxShadow: 'none' }} />
      </motion.div>
      {bills.length >= 10 && (
        <div
          className="absolute rounded-sm shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ left: 86, top: -3, width: 40, height: 116 + layers * 1.8, background: '#efe2c3', backgroundImage: 'repeating-linear-gradient(0deg, rgba(120,80,30,0.08) 0 1px, transparent 1px 4px)' }}
        />
      )}
    </div>
  );
}
