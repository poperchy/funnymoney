// Board skins drawn in CSS: the phone wall and the landing page. The desktop paints the same textures on a canvas.
import type { BoardSkin } from './skins';

/** SVG fractal noise as a CSS background: grains of one colour (r g b in 0..1). */
const noise = (freq: number, octaves: number, [r, g, b]: number[], alpha: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${alpha} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const SHEEN = 'radial-gradient(ellipse at 30% 15%, rgba(255,255,255,0.14), transparent 60%)';

export const SURFACE: Record<BoardSkin['cellTexture'], string> = {
  cork: `${noise(0.9, 3, [0.22, 0.12, 0.04], 0.75)}, ${SHEEN}`,
  felt: `${noise(1.8, 2, [0, 0.05, 0.02], 0.5)}, ${SHEEN}`,
  concrete: `${noise(0.55, 4, [0.2, 0.2, 0.2], 0.45)}, ${SHEEN}`,
};

export const FRAME: Record<BoardSkin['frameTexture'], string> = {
  wood: 'repeating-linear-gradient(92deg, rgba(0,0,0,0.07) 0 1px, transparent 1px 6px, rgba(255,255,255,0.04) 6px 7px, transparent 7px 13px), linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.18))',
  metal: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px, rgba(0,0,0,0.05) 3px 4px), linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(0,0,0,0.12))',
};

/** The red pin on a cell's paper tag. */
export const PIN = 'radial-gradient(circle at 35% 30%, #ff8a6a, #b8321b)';
