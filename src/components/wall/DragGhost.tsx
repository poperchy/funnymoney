'use client';

import { useUnit } from 'effector-react';
import { createPortal } from 'react-dom';
import { $drag } from '@/model/ui';
import { COIN_GHOST } from '@/scene/WallScene';
import { BillImg, CoinFace } from '@/components/money/BillImg';

/** The bill (or coin) under the cursor. Lives in the DOM so it can fly over both the canvas and the till. */
export function DragGhost() {
  const drag = useUnit($drag);
  if (!drag) return null;
  return createPortal(
    <div
      className="pointer-events-none fixed z-[1000] cursor-grabbing"
      style={{ left: drag.x - drag.ox, top: drag.y - drag.oy, transform: 'rotate(-4deg) scale(1.1)', transformOrigin: `${drag.ox}px ${drag.oy}px` }}
    >
      {drag.kind === 'coin' ? (
        <span className="block rounded-full shadow-[0_14px_18px_-6px_rgba(30,15,0,0.55)]">
          <CoinFace value={drag.value} size={COIN_GHOST * drag.k} />
        </span>
      ) : (
        <BillImg value={drag.value} scale={drag.k} style={{ boxShadow: '0 3px 3px rgba(0,0,0,0.2), 0 30px 34px -10px rgba(30,15,0,0.55)' }} />
      )}
    </div>,
    document.body,
  );
}
