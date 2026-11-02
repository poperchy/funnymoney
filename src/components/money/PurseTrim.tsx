'use client';

import { motion } from 'motion/react';
import type { PurseLook, PurseSkin } from '@/scene/skins';

const INK = '#1a1a1a';

/** The hungry wallet's face. Opens its mouth while money is carried, and squints for a moment after a meal. */
function Face({ open, wide, meals = 0, width = 64 }: { open?: boolean; wide?: boolean; meals?: number; width?: number }) {
  const eyes = (
    <>
      <ellipse cx={20} cy={12} rx={4.5} ry={5.5} fill={INK} />
      <ellipse cx={44} cy={12} rx={4.5} ry={5.5} fill={INK} />
    </>
  );
  // `key` restarts the squint on every meal; `meals` only grows while the app is open, so a fresh page stays calm.
  const fade = (from: number, to: number) => ({ initial: { opacity: from }, animate: { opacity: [from, from, to] }, transition: { duration: 1.4, times: [0, 0.75, 1] } });
  return (
    <svg viewBox="0 0 64 42" width={width} height={(width * 42) / 64} aria-hidden className="block">
      {meals > 0 ? (
        <>
          <motion.g key={'eyes' + meals} {...fade(0, 1)}>
            {eyes}
          </motion.g>
          <motion.path key={'squint' + meals} {...fade(1, 0)} d="M14 13Q20 5 26 13M38 13Q44 5 50 13" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        eyes
      )}
      {open ? (
        <ellipse cx={32} cy={28} rx={wide ? 12 : 8} ry={wide ? 11 : 7} fill={INK} />
      ) : (
        <path d="M22 25Q32 36 42 25" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      )}
    </svg>
  );
}

/** What a skin adds to a wallet drawn in the DOM: a strap with a snap, or a clasp and a face. */
export function PurseTrim({ skin, look, open, wide, meals, faceWidth = 56 }: { skin: PurseSkin; look: PurseLook; open?: boolean; wide?: boolean; meals?: number; faceWidth?: number }) {
  if (skin.trim === 'strap') {
    return (
      <span className="pointer-events-none absolute top-3 -right-1 block h-10 w-8 rounded-l-[10px]" style={{ background: look.accent }}>
        <span className="absolute top-3.5 left-2 block h-3.5 w-3.5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#f3dca0,#a8812f)]" />
      </span>
    );
  }
  if (skin.trim === 'clasp') {
    const ball = 'absolute -top-[7px] block h-4 w-4 rounded-full border-[2.5px]';
    return (
      <>
        <span className={ball} style={{ left: 'calc(50% - 20px)', background: look.accent, borderColor: look.outline }} />
        <span className={ball} style={{ left: 'calc(50% + 4px)', background: look.accent, borderColor: look.outline }} />
        <span className="pointer-events-none absolute top-3 right-3">
          <Face open={open} wide={wide} meals={meals} width={faceWidth} />
        </span>
      </>
    );
  }
  return null;
}

export { Face as PurseFace };
