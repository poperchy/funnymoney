'use client';

import { useUnit } from 'effector-react';
import { $layout } from '@/model/wallet';
import { SCENE_W } from '@/scene/layout';
import { Receipts } from './Receipts';
import { SceneHost } from './SceneHost';
import { SpentTill } from './SpentTill';
import { WallOverlay } from './WallOverlay';

/** The header is fixed on top of the page (see MoneyApp); the wall only keeps room for it. */
export const HEADER_H = 84;

/** Header + top padding + bottom padding around the scene. */
export const wallHeight = (sceneH: number) => HEADER_H + 24 + sceneH + 28;

export function Wall() {
  const L = useUnit($layout);
  return (
    <div>
      <div style={{ height: HEADER_H }} />
      <div className="flex items-start gap-6 px-7 pt-6 pb-7">
        <div className="relative shrink-0" style={{ width: SCENE_W, height: L.h }}>
          <SceneHost />
          <WallOverlay />
        </div>
        <aside className="flex min-w-0 flex-1 flex-col gap-4" style={{ height: L.h }}>
          <SpentTill />
          <Receipts />
        </aside>
      </div>
    </div>
  );
}
