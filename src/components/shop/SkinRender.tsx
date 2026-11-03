'use client';

import { useUnit } from 'effector-react';
import { useEffect, useState } from 'react';
import { useFontsReady } from '@/lib/useFontsReady';
import { useMobile } from '@/lib/useMobile';
import { $skins } from '@/model/skins';
import { $theme } from '@/model/ui';
import { $denoms, $wallet, coinMoved, incomeReceived, scaleChanged, spent } from '@/model/wallet';
import { SKIN_PACKS } from '@/scene/skins';
import { previewItems, type PreviewItem } from './previewBox';
import { SkinPreview } from './SkinPreview';
import { tr } from '@/lib/i18n';

/** The money every picture shows: the demo bills on the wall, plus a fed pig and one purchase. */
function seedDemoMoney() {
  // Pictures show the same bills to everyone, wherever they were rendered.
  scaleChanged('small');
  const [a, b, c, d, e] = [...$denoms.getState().coins].reverse();
  incomeReceived({ bills: [], coins: [a, a, b, b, c, c, d, d, e, e, a] });
  const [paid, ...rest] = $wallet.getState().coins;
  for (const c of rest) coinMoved({ id: c.id, to: { type: 'piggy' } });
  spent({ source: 'pile', billIds: [paid.id], change: [], label: tr.common.coffee });
}

declare global {
  interface Window {
    /** For `scripts/gen-skin-previews.mjs`. */
    __skinItems?: PreviewItem[];
    __showSkin?: (item: PreviewItem) => void;
  }
}

/** Draws one shop picture at a time for the generator to photograph. Only ever runs under `next dev`, see `RenderClient`. */
export function SkinRender() {
  const [theme, worn] = useUnit([$theme, $skins]);
  const ready = useFontsReady();
  const mobile = useMobile();
  const [item, setItem] = useState<PreviewItem | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    seedDemoMoney();
    window.__skinItems = previewItems();
    window.__showSkin = setItem;
  }, [theme]);

  if (!ready || !item) return null;
  const pack = SKIN_PACKS.find(p => p.id === item.id);
  const skins = item.part === 'pack' && pack ? pack.skins : item.part === 'page' ? worn : { ...worn, [item.part]: item.id };
  return (
    // Away from the viewport's corners, where the dev tools sit. Two pixels per CSS pixel come from the generator.
    <div id="skin-shot" key={`${item.part}-${item.id}`} style={{ position: 'absolute', left: 20, top: 20, width: mobile ? 310 : 340 }}>
      <SkinPreview skins={skins} part={item.part} pageId={item.part === 'page' ? item.id : undefined} />
    </div>
  );
}
