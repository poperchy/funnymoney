'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

const SPRING = 'transform .35s cubic-bezier(.3,1.4,.5,1)';

/** Illustrated hand poking out from the top edge, holding the stack until it opens. */
export function Hand({
  open,
  children,
  left = 590,
  top = { closed: -36, open: -190 },
}: {
  open: boolean;
  children: ReactNode;
  left?: number | string;
  /** Where the hand hangs while holding the wad, and where it retreats once it lets go. */
  top?: { closed: number; open: number };
}) {
  return (
    <motion.div
      className="absolute z-10 h-[340px] w-[260px]"
      style={{ left }}
      initial={{ top: -340 }}
      animate={{ top: open ? top.open : top.closed }}
      transition={{ duration: open ? 0.8 : 0.9, delay: open ? 0.35 : 0.1, ease: [0.5, 0, 0.3, 1] }}
    >
      <svg viewBox="0 0 260 340" width={260} height={340} className="absolute inset-0 overflow-visible">
        <rect x={82} y={-60} width={96} height={210} rx={20} fill="var(--sleeve)" />
        <rect x={82} y={-60} width={22} height={210} rx={11} fill="rgba(255,255,255,0.08)" />
        <rect x={76} y={124} width={108} height={34} rx={12} fill="var(--cuff)" />
        <rect x={76} y={148} width={108} height={6} fill="rgba(0,0,0,0.08)" />
        <path d="M80 152 C70 186 78 214 130 218 C182 214 190 186 180 152 Z" fill="var(--skin)" />
        <path d="M92 170 C104 182 156 182 168 170" fill="none" stroke="var(--skin-shade)" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      </svg>
      <motion.div className="absolute top-[192px] left-5" animate={{ opacity: open ? 0 : 1 }} transition={{ duration: 0.15 }}>
        {children}
      </motion.div>
      <svg viewBox="0 0 260 340" width={260} height={340} className="pointer-events-none absolute inset-0 overflow-visible">
        {/* Plain CSS transforms: SVG transform-origin here is in viewBox units, as in the design. */}
        <g style={{ transformOrigin: '130px 176px', transform: open ? 'translateY(-34px) scaleY(0.45)' : 'none', transition: SPRING }}>
          {[
            [84, 176, 24, 64],
            [107, 178, 24, 70],
            [130, 178, 24, 68],
            [153, 176, 22, 58],
          ].map(([x, y, w, h]) => (
            <rect key={x} x={x} y={y} width={w} height={h} rx={w / 2} fill="var(--skin)" stroke="var(--skin-shade)" strokeWidth={1.5} />
          ))}
          <path d="M90 228 h12 M113 236 h12 M136 234 h12 M158 222 h11" stroke="var(--skin-shade)" strokeWidth={1.5} strokeLinecap="round" opacity={0.55} />
        </g>
        <g style={{ transformOrigin: '84px 168px', transform: open ? 'rotate(-58deg) translate(-10px,-10px)' : 'none', transition: SPRING }}>
          <ellipse cx={74} cy={196} rx={15} ry={32} transform="rotate(-22 74 196)" fill="var(--skin)" stroke="var(--skin-shade)" strokeWidth={1.5} />
        </g>
      </svg>
    </motion.div>
  );
}
