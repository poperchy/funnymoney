// Board skins drawn in CSS: the phone wall and the landing page. The desktop paints the same textures on a canvas.
import type { CSSProperties } from 'react';
import { cellColor, type BoardLook, type BoardSkin, type PurseLook } from './skins';

/** SVG fractal noise as a CSS background: grains of one colour (r g b in 0..1). */
const noise = (freq: number, octaves: number, [r, g, b]: number[], alpha: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${alpha} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const SHEEN = 'radial-gradient(ellipse at 30% 15%, rgba(255,255,255,0.14), transparent 60%)';

export const SURFACE: Record<BoardSkin['cellTexture'], string> = {
  cork: `${noise(0.9, 3, [0.22, 0.12, 0.04], 0.75)}, ${SHEEN}`,
  felt: `${noise(1.8, 2, [0, 0.05, 0.02], 0.5)}, ${SHEEN}`,
  concrete: `${noise(0.55, 4, [0.2, 0.2, 0.2], 0.45)}, ${SHEEN}`,
  // The back of an envelope: the flap on top and the seams meeting under it.
  envelope: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpolygon points='0,0 100,0 50,42' fill='%23582f0a' fill-opacity='.13'/%3E%3Cpath d='M0 0L50 42L100 0M0 100L50 42L100 100' fill='none' stroke='%23582f0a' stroke-opacity='.3' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E"), ${SHEEN}`,
  flat: 'none',
  pegboard: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='2.3' fill='%230a100c' fill-opacity='.75'/%3E%3C/svg%3E"), ${SHEEN}`,
  stars: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cg fill='white'%3E%3Ccircle cx='12' cy='18' r='.8'/%3E%3Ccircle cx='47' cy='9' r='.5'/%3E%3Ccircle cx='76' cy='31' r='.9'/%3E%3Ccircle cx='29' cy='52' r='.6'/%3E%3Ccircle cx='63' cy='70' r='.7'/%3E%3Ccircle cx='8' cy='79' r='.5'/%3E%3C/g%3E%3C/svg%3E"), radial-gradient(ellipse at 30% 30%, rgba(140,110,255,0.25), transparent 65%)`,
};

export const FRAME: Record<BoardSkin['frameTexture'], string> = {
  wood: 'repeating-linear-gradient(92deg, rgba(0,0,0,0.07) 0 1px, transparent 1px 6px, rgba(255,255,255,0.04) 6px 7px, transparent 7px 13px), linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.18))',
  metal: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px, rgba(0,0,0,0.05) 3px 4px), linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(0,0,0,0.12))',
  linen: 'repeating-linear-gradient(0deg, rgba(120,95,60,0.08) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(120,95,60,0.07) 0 1px, transparent 1px 3px)',
  flat: 'none',
};

const sunken = (board: BoardSkin) => board.frameTexture === 'wood' || board.frameTexture === 'metal';

/** Pale captions by default; a light board needs them dark. Set on any element around the cells. */
export const boardVars = (look: BoardLook) => (look.ink ? ({ '--dash': look.ink + '99', '--dash-ink': look.ink } as CSSProperties) : undefined);

/** The board's frame and the recess the cells sit in. */
export const boardCss = (board: BoardSkin, look: BoardLook) => ({
  frame: {
    ...boardVars(look),
    backgroundColor: look.frame,
    backgroundImage: FRAME[board.frameTexture],
    boxShadow: look.outline ? `inset 0 0 0 3px ${look.outline}` : sunken(board) ? 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(0,0,0,0.25)' : 'none',
  } as CSSProperties,
  inner: {
    backgroundColor: look.inner,
    backgroundImage: sunken(board) ? 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 5px)' : undefined,
    boxShadow: sunken(board) ? 'inset 0 3px 10px rgba(0,0,0,0.45)' : 'none',
  } as CSSProperties,
});

/** A cell's background and edge; its surface texture goes on top (`SURFACE`). */
export function cellCss(board: BoardSkin, look: BoardLook, id: string): CSSProperties {
  const edge = look.outline
    ? `inset 0 0 0 2px ${look.outline}`
    : board.cellTexture === 'envelope'
      ? 'inset 0 0 0 1px rgba(90,55,20,0.3)'
      : 'inset 0 2px 6px rgba(50,25,5,0.45), inset 0 0 0 1px rgba(0,0,0,0.12)';
  return { backgroundColor: cellColor(look, id), boxShadow: edge, borderRadius: look.outline ? 9 : undefined };
}

/** A wallet drawn in the DOM (the phone, the landing page); `hot` when money hovers over it. */
export function purseCss(look: PurseLook, hot = false): CSSProperties {
  const ring = hot ? '0 0 0 3px var(--accent), ' : '';
  return look.outline
    ? { background: look.front, color: look.ink, boxShadow: `${ring}inset 0 0 0 3px ${look.outline}` }
    : { background: `linear-gradient(170deg, ${look.front}, ${look.back})`, color: '#fbf1e1', boxShadow: `${ring}0 14px 26px -16px rgba(30,15,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)` };
}

/** The red pin on a cell's paper tag. */
export const PIN = 'radial-gradient(circle at 35% 30%, #ff8a6a, #b8321b)';
