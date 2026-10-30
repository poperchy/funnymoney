'use client';

import { combine, type Subscription } from 'effector';
import { useEffect, useRef } from 'react';
import { WallScene } from '@/scene/WallScene';
import { $draftBillIds, $editingCategory, $editingReceipt, $exchangeAt, $manualSpendOpen, $pigFlow, $spendDraft, $statsOpen, $theme, pigShaken, toastShown } from '@/model/ui';
import { $layout, $wallet } from '@/model/wallet';
import { $shopOpen, $skins } from '@/model/skins';

const $locked = combine([$spendDraft, $manualSpendOpen, $pigFlow, $editingCategory, $editingReceipt, $exchangeAt, $shopOpen, $statsOpen], list => list.some(Boolean));

/** Mounts the Pixi scene and feeds it model updates. */
export function SceneHost() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scene: WallScene | null = null;
    let cancelled = false;
    const subs: Subscription[] = [];
    WallScene.create(ref.current!, $layout.getState().h).then(s => {
      if (cancelled) return s.destroy();
      scene = s;
      s.setSkins($skins.getState());
      s.setTheme($theme.getState());
      s.setHidden($draftBillIds.getState());
      s.apply($wallet.getState());
      subs.push(
        $wallet.updates.watch(next => s.apply(next)),
        $theme.updates.watch(t => s.setTheme(t)),
        $skins.updates.watch(sk => s.setSkins(sk)),
        $draftBillIds.updates.watch(ids => s.setHidden(ids)),
        $locked.watch(l => s.setLocked(l)),
        $pigFlow.watch(f => s.setPigStep(f?.step ?? null)),
        pigShaken.watch(() => s.shakePig()),
        toastShown.watch(() => s.pigTalk()),
      );
    });
    return () => {
      cancelled = true;
      subs.forEach(u => u());
      scene?.destroy();
    };
  }, []);

  return <div ref={ref} className="absolute inset-0" />;
}
