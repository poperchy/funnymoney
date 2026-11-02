'use client';

import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import { BASE_PATH } from '@/lib/paths';
import { useMobile } from '@/lib/useMobile';
import { defaultCategories } from '@/model/defaults';
import { $theme } from '@/model/ui';
import { computeLayout } from '@/scene/layout';
import { desktopRegion, PHONE_H, PHONE_W, picturePath, type PreviewItem } from './previewBox';

/**
 * A ready-made picture of a skin or a pack: `npm run skins:previews` renders them all in advance, for each theme and device,
 * so opening the shop costs a phone nothing. They show the default wall, the same for everyone.
 */
export function SkinPicture({ part, id }: PreviewItem) {
  const theme = useUnit($theme);
  const mobile = useMobile();
  const aspect = useMemo(() => {
    if (mobile) return `${PHONE_W} / ${PHONE_H[part]}`;
    const r = desktopRegion(part, computeLayout(defaultCategories('BYN')));
    return `${r.w} / ${r.h}`;
  }, [mobile, part]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, and these are already sized for the card
    <img
      src={`${BASE_PATH}/${picturePath(mobile ? 'phone' : 'desktop', theme, { part, id })}`}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      className="block w-full rounded-xl bg-field select-none"
      style={{ aspectRatio: aspect }}
    />
  );
}
