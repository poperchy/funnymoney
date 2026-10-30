'use client';

import { useUnit } from 'effector-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useSyncExternalStore } from 'react';
import { $stop, $toast, toastHidden } from '@/model/ui';
import { $layout } from '@/model/wallet';
import { SCENE_W } from '@/scene/layout';

const subscribeView = (cb: () => void) => {
  window.addEventListener('scroll', cb, { passive: true });
  window.addEventListener('resize', cb);
  return () => {
    window.removeEventListener('scroll', cb);
    window.removeEventListener('resize', cb);
  };
};
/** Changes whenever the page scrolls or resizes, so the bubble can follow the pig. */
const useViewKey = () => useSyncExternalStore(subscribeView, () => `${window.scrollY}|${window.innerWidth}|${window.innerHeight}`, () => '');

/** Where the bubble's tail points: just above the pig's head, in screen px. Null when the pig is off screen. */
function pigAnchor(onWall: boolean, piggy: { x: number; y: number }) {
  if (!onWall) return null;
  const canvas = document.querySelector('canvas');
  if (!canvas) return null;
  const r = canvas.getBoundingClientRect(), k = r.width / SCENE_W;
  const x = r.left + (piggy.x + 150) * k, y = r.top + (piggy.y + 16) * k;
  // Under the fixed header or below the fold, the pig can't be seen talking.
  return y > 150 && y < window.innerHeight - 8 ? { x, y } : null;
}

/** Little pig face for when the pig itself is out of sight. */
export function PigFace() {
  return (
    <svg viewBox="0 0 32 32" width={30} height={30} className="shrink-0" aria-hidden>
      <path d="M7 9 4 3l8 3M25 9l3-6-8 3" fill="#f5adc0" stroke="#d97692" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx={16} cy={17} r={12} fill="#f5adc0" stroke="#d97692" strokeWidth={1.8} />
      <circle cx={11} cy={14} r={1.6} fill="#3a2328" />
      <circle cx={21} cy={14} r={1.6} fill="#3a2328" />
      <ellipse cx={16} cy={20.5} rx={5.5} ry={4} fill="#f8c3d1" stroke="#d97692" strokeWidth={1.4} />
      <ellipse cx={14} cy={20.5} rx={1.1} ry={1.6} fill="#8a3f55" />
      <ellipse cx={18} cy={20.5} rx={1.1} ry={1.6} fill="#8a3f55" />
    </svg>
  );
}

/** Notifications are the pig talking: a speech bubble over its head, or in the corner when it's out of view. */
export function Toast() {
  const [toast, stop, layout] = useUnit([$toast, $stop, $layout]);
  useViewKey();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => toastHidden(), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const anchor = toast ? pigAnchor(stop === 'wall', layout.piggy) : null;
  const TAIL = 28;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          role="status"
          className="pointer-events-none fixed z-[250] max-w-[360px]"
          style={
            anchor
              ? { left: Math.max(12, anchor.x - TAIL), bottom: window.innerHeight - anchor.y + 12, transformOrigin: `${TAIL}px 100%` }
              : { left: 24, bottom: 24, transformOrigin: '0 100%' }
          }
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 22 } }}
          exit={{ opacity: 0, scale: 0.9, y: -4, transition: { duration: 0.2 } }}
        >
          <div className="relative flex items-center gap-2.5 rounded-[18px] bg-modal px-4 py-3 text-sm leading-snug text-ink shadow-[0_18px_36px_-16px_rgba(30,15,0,0.55),0_0_0_1px_var(--line)]">
            {!anchor && <PigFace />}
            <span>{toast.text}</span>
            {anchor && (
              // The tail, pointing down at the pig.
              <span
                className="absolute -bottom-[7px] h-4 w-4 rotate-45 rounded-[3px] bg-modal shadow-[1px_1px_0_0_var(--line)]"
                style={{ left: TAIL - 8 }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
