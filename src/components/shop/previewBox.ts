// What the shop's pictures show. Shared by the renderer that makes them and the shop that shows them,
// so a card knows its size before its picture arrives and nothing jumps.
import type { Locale } from '@/lib/i18n';
import type { Theme } from '@/model/ui';
import { SCENE_W, type Layout, type Rect } from '@/scene/layout';
import { BOARD_SKINS, HAT_SKINS, NECK_SKINS, PAGE_SKINS, PURSE_SKINS, SKIN_PACKS, TILL_SKINS } from '@/scene/skins';

export type PreviewPart = 'board' | 'purse' | 'till' | 'page' | 'hat' | 'neck' | 'pack';
export type PreviewDevice = 'desktop' | 'phone';

/** The till's column on the desktop wall: the gap next to the scene and its width. */
export const TILL_X = SCENE_W + 24;
export const TILL_W = 300;
export const PHONE_W = 366;

/** The piece of the desktop wall a picture shows, in scene px. */
export function desktopRegion(part: PreviewPart, L: Layout): Rect {
  switch (part) {
    // The frame's rounded corners stay inside the rounded picture.
    case 'board':
      return { x: -10, y: -10, w: L.board.w + 20, h: L.board.h + 20 };
    case 'purse':
      return { x: L.pile.x, y: L.pile.y, w: L.pile.w, h: L.pile.h + 8 };
    case 'till':
      return { x: TILL_X - 12, y: -12, w: TILL_W + 24, h: 192 };
    case 'hat':
    case 'neck':
      return { x: L.piggy.x - 8, y: L.piggy.y - 34, w: L.piggy.w + 16, h: L.piggy.h + 40 };
    // A patch of the wall close up: shrunk to the whole screen, a pattern this faint would vanish.
    case 'page':
      return { x: 0, y: L.board.h - 40, w: 480, h: L.h - L.board.h + 40 };
    case 'pack':
      return { x: 0, y: 0, w: TILL_X + TILL_W, h: L.h };
  }
}

/** Height of a phone picture, at `PHONE_W` wide. */
export const PHONE_H: Record<PreviewPart, number> = { board: 300, purse: 210, till: 96, hat: 190, neck: 190, page: 500, pack: 500 };

export type PreviewItem = { part: PreviewPart; id: string };

/** Everything the shop sells, with its picture. */
export const previewItems = (): PreviewItem[] => [
  ...SKIN_PACKS.map(s => ({ part: 'pack' as const, id: s.id })),
  ...BOARD_SKINS.map(s => ({ part: 'board' as const, id: s.id })),
  ...PURSE_SKINS.map(s => ({ part: 'purse' as const, id: s.id })),
  ...TILL_SKINS.map(s => ({ part: 'till' as const, id: s.id })),
  ...PAGE_SKINS.map(s => ({ part: 'page' as const, id: s.id })),
  ...HAT_SKINS.map(s => ({ part: 'hat' as const, id: s.id })),
  ...NECK_SKINS.map(s => ({ part: 'neck' as const, id: s.id })),
];

/** Where a picture lives under `public/`. */
export const picturePath = (lang: Locale, device: PreviewDevice, theme: Theme, { part, id }: PreviewItem) => `skins/${lang}/${device}-${theme}/${part}-${id}.webp`;
