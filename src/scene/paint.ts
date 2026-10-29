// Canvas2D painters. Bills and coins are drawn once per value and reused by Pixi (as textures)
// and by the DOM (as data URLs), so a bill looks the same everywhere.
import { billIndex, type Currency } from '@/lib/money/currency';
import { faceLabel } from '@/lib/money/format';
import { rng } from '@/lib/rng';
import type { Theme } from '@/model/ui';
import { BH, BW, SCENE_W, type Layout } from './layout';
import { BILL_PAL, METAL } from './palette';
import { boardSkin, purseSkin, type BoardSkin, type PurseSkin } from './skins';

export const RES = 3;

/** Stable seed per cell, so its cork pattern survives adding other cells. */
const hash = (s: string) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

const fontFamily = () =>
  typeof document === 'undefined' ? 'sans-serif' : getComputedStyle(document.body).fontFamily || 'sans-serif';

function canvas(w: number, h: number, res = RES) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * res);
  c.height = Math.ceil(h * res);
  const ctx = c.getContext('2d')!;
  ctx.scale(res, res);
  return { c, ctx };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function paintBill(value: number, cur: Currency, res = RES): HTMLCanvasElement {
  const { c, ctx } = canvas(BW, BH, res);
  const [p0, p1, p2] = BILL_PAL[billIndex(cur, value)];
  const font = fontFamily();

  roundRect(ctx, 0, 0, BW, BH, 4);
  ctx.save();
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, BW, BH);
  g.addColorStop(0, p0);
  g.addColorStop(1, p1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, BW, BH);

  // Fine diagonal hatching.
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  for (let i = -BH; i < BW + BH; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, BH);
    ctx.lineTo(i + BH, 0);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, 3.5, 3.5, BW - 7, BH - 7, 3);
  ctx.stroke();

  // Medallion: sun over two hills.
  ctx.save();
  ctx.beginPath();
  ctx.arc(24, 24, 17, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(23, 18, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = p2;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(17, 41, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(33, 43, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(24, 24, 17, 0, Math.PI * 2);
  ctx.stroke();

  // Guilloche rings.
  ctx.save();
  roundRect(ctx, 46, 9, 30, 30, 4);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.32)';
  ctx.lineWidth = 1;
  for (let r = 3.5; r < 46; r += 4) {
    ctx.beginPath();
    ctx.arc(46, 39, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const label = faceLabel(value);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `700 7px ${font}`;
  ctx.textAlign = 'right';
  ctx.letterSpacing = '0.7px';
  ctx.fillText(cur.code, BW - 7, 12);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `700 8px ${font}`;
  ctx.fillText(label, 7, BH - 5);

  let size = 20;
  ctx.font = `700 ${size}px ${font}`;
  while (ctx.measureText(label).width > 46 && size > 12) ctx.font = `700 ${--size}px ${font}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillText(label, BW - 7, BH - 4);
  ctx.fillStyle = '#fff';
  ctx.fillText(label, BW - 7, BH - 5);

  const gloss = ctx.createLinearGradient(0, 0, BW * 0.6, BH * 1.2);
  gloss.addColorStop(0, 'rgba(255,255,255,0.3)');
  gloss.addColorStop(0.42, 'rgba(255,255,255,0)');
  gloss.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, BW, BH);
  ctx.restore();
  return c;
}

const urlCache = new Map<string, string>();
/** Bill image for the DOM (modals, onboarding, drag ghost). */
export function billUrl(value: number, cur: Currency): string {
  const key = cur.code + value;
  let url = urlCache.get(key);
  if (!url) {
    url = paintBill(value, cur, 3).toDataURL();
    urlCache.set(key, url);
  }
  return url;
}

/** Soft shadow under a bill; drawn bigger than the bill so the blur fits. */
export const SHADOW_PAD = 16;
export function paintShadow(): HTMLCanvasElement {
  const { c, ctx } = canvas(BW + SHADOW_PAD * 2, BH + SHADOW_PAD * 2, 2);
  ctx.shadowColor = 'rgba(40,20,0,0.55)';
  ctx.shadowBlur = 9;
  ctx.fillStyle = 'rgba(40,20,0,0.35)';
  roundRect(ctx, SHADOW_PAD, SHADOW_PAD, BW, BH, 4);
  ctx.fill();
  return c;
}

export type CoinLook = { size: number; bg: string[]; edge: string; bimetal: boolean };

export function coinLook(value: number, cur: Currency): CoinLook {
  const i = Math.max(0, cur.coins.indexOf(value));
  const n = cur.coins.length;
  const f = n > 1 ? i / (n - 1) : 0;
  const bimetal = n >= 6 && i === n - 1;
  const m = bimetal || f >= 0.7 ? METAL.ag : f >= 0.35 ? METAL.br : METAL.cu;
  return { size: 13 + i * 1.15, bg: [m[0], m[1]], edge: m[2], bimetal };
}

/** Coin lying flat, seen at an angle: an ellipse with a visible rim. */
export function paintCoin(value: number, cur: Currency): HTMLCanvasElement {
  const { size, bg, edge, bimetal } = coinLook(value, cur);
  const h = size * 0.5, rim = Math.max(1.5, size * 0.12);
  const { c, ctx } = canvas(size, h + rim, 4);
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.ellipse(size / 2, h / 2 + rim, size / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(0, h / 2, size, rim);
  const g = ctx.createRadialGradient(size * 0.35, h * 0.3, 0, size * 0.35, h * 0.3, size * 0.7);
  if (bimetal) {
    g.addColorStop(0, '#f6e09a');
    g.addColorStop(0.3, '#b8933c');
    g.addColorStop(0.36, '#eeeeea');
    g.addColorStop(1, '#9e9e97');
  } else {
    g.addColorStop(0, bg[0]);
    g.addColorStop(0.72, bg[1]);
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(size / 2, h / 2, size / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

/** Round coin face for change buttons in the DOM. */
export function coinFaceCss(value: number, cur: Currency) {
  const { bg, edge, bimetal } = coinLook(value, cur);
  const background = bimetal
    ? 'radial-gradient(circle at 40% 35%, #f6e09a 0 30%, #b8933c 44%, #eeeeea 47%, #9e9e97 80%)'
    : `radial-gradient(circle at 35% 30%, ${bg[0]}, ${bg[1]} 72%)`;
  return { background, boxShadow: `inset 0 -3px 0 ${edge}, 0 3px 6px rgba(0,0,0,0.25)` };
}

function woodGrain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let i = x; i < x + w; i += 1 + r() * 5) {
    ctx.fillStyle = r() > 0.5 ? `rgba(0,0,0,${0.03 + r() * 0.06})` : `rgba(255,255,255,${0.02 + r() * 0.04})`;
    ctx.fillRect(i, y, 0.6 + r() * 1.2, h);
  }
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

function cork(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, seed: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.clip();
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  // Large soft blotches, then fine grains.
  for (let i = 0; i < (w * h) / 900; i++) {
    const bx = x + r() * w, by = y + r() * h, br = 6 + r() * 18;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const dark = r() > 0.45;
    g.addColorStop(0, dark ? 'rgba(70,35,8,0.16)' : 'rgba(255,235,200,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  for (let i = 0; i < (w * h) / 7; i++) {
    const v = r();
    ctx.fillStyle = v > 0.5 ? `rgba(60,30,8,${0.15 + r() * 0.35})` : `rgba(255,240,215,${0.08 + r() * 0.18})`;
    const s = 0.4 + r() * 1.3;
    ctx.fillRect(x + r() * w, y + r() * h, s, s);
  }
  const hl = ctx.createRadialGradient(x + w * 0.3, y + h * 0.15, 0, x + w * 0.3, y + h * 0.15, Math.max(w, h) * 0.8);
  hl.addColorStop(0, 'rgba(255,255,255,0.14)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(x, y, w, h);
  // Inner shadow: the cork sits a bit deeper than the frame.
  ctx.shadowColor = 'rgba(50,25,5,0.55)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 7);
  ctx.stroke();
  ctx.restore();
}

/** Static backdrop: wooden board with cork cells. */
/** Brushed steel: fine horizontal streaks over a vertical sheen. */
function metal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let i = y; i < y + h; i += 0.7 + r() * 1.6) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.03 + r() * 0.06})` : `rgba(0,0,0,${0.03 + r() * 0.06})`;
    ctx.fillRect(x, i, w, 0.6);
  }
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.08)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

/** Card-table felt: dense short fibres, a soft spotlight. */
function felt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 4; i++) {
    ctx.fillStyle = r() > 0.5 ? `rgba(0,0,0,${0.06 + r() * 0.08})` : `rgba(255,255,255,${0.03 + r() * 0.05})`;
    ctx.fillRect(x + r() * w, y + r() * h, 0.5 + r() * 1.6, 0.5);
  }
}

/** Poured concrete: speckles, a few pores and faint stains. */
function concrete(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 1400; i++) {
    const bx = x + r() * w, by = y + r() * h, br = 10 + r() * 30;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, `rgba(0,0,0,${0.04 + r() * 0.06})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  for (let i = 0; i < (w * h) / 9; i++) {
    ctx.fillStyle = r() > 0.6 ? `rgba(0,0,0,${0.1 + r() * 0.2})` : `rgba(255,255,255,${0.06 + r() * 0.12})`;
    const sz = 0.4 + r() * 1.1;
    ctx.fillRect(x + r() * w, y + r() * h, sz, sz);
  }
  for (let i = 0; i < (w * h) / 2500; i++) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.arc(x + r() * w, y + r() * h, 0.8 + r() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A cell's surface for the skin, with the same sunken edge for all of them. */
function cellSurface(ctx: CanvasRenderingContext2D, skin: BoardSkin, x: number, y: number, w: number, h: number, base: string, seed: number) {
  if (skin.cellTexture === 'cork') return cork(ctx, x, y, w, h, base, seed);
  ctx.save();
  roundRect(ctx, x, y, w, h, 5);
  ctx.clip();
  (skin.cellTexture === 'felt' ? felt : concrete)(ctx, x, y, w, h, base, seed);
  const hl = ctx.createRadialGradient(x + w * 0.3, y + h * 0.15, 0, x + w * 0.3, y + h * 0.15, Math.max(w, h) * 0.8);
  hl.addColorStop(0, 'rgba(255,255,255,0.1)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.fillRect(x, y, w, h);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 6;
  roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 7);
  ctx.stroke();
  ctx.restore();
}

export function paintBackground(theme: Theme, L: Layout, skinId = 'cork'): HTMLCanvasElement {
  const skin = boardSkin(skinId);
  const frame = skin.frameTexture === 'metal' ? metal : woodGrain;
  const BOARD = L.board;
  const S = skin.look[theme];
  const T = { wood: S.frame, woodDark: S.inner, cork: S.cell, light: S.light };
  const { c, ctx } = canvas(SCENE_W, L.h, 2);

  ctx.save();
  ctx.shadowColor = 'rgba(40,20,0,0.6)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 26;
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 20);
  ctx.fillStyle = T.wood;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 20);
  ctx.clip();
  frame(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, T.wood, 11);
  ctx.restore();

  ctx.save();
  roundRect(ctx, 16, 16, SCENE_W - 32, BOARD.h - 32, 8);
  ctx.clip();
  frame(ctx, 16, 16, SCENE_W - 32, BOARD.h - 32, T.woodDark, 23);
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 8;
  roundRect(ctx, 12, 12, SCENE_W - 24, BOARD.h - 24, 10);
  ctx.stroke();
  ctx.restore();

  [...L.cells].forEach(([id, r]) => {
    cellSurface(ctx, skin, r.x, r.y, r.w, r.h, T.cork, hash(id));
  });

  // Warm lamp light, and a vignette at night.
  ctx.save();
  roundRect(ctx, 16, 16, SCENE_W - 32, BOARD.h - 32, 8);
  ctx.clip();
  const lamp = ctx.createRadialGradient(SCENE_W * 0.45, BOARD.h * 0.2, 0, SCENE_W * 0.45, BOARD.h * 0.2, SCENE_W * 0.6);
  lamp.addColorStop(0, T.light[0]);
  lamp.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, SCENE_W, BOARD.h);
  if (T.light[1]) {
    const v = ctx.createRadialGradient(SCENE_W / 2, BOARD.h / 2, BOARD.h * 0.3, SCENE_W / 2, BOARD.h / 2, SCENE_W * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(0,0,0,${T.light[1]})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, SCENE_W, BOARD.h);
  }
  ctx.restore();

  // No shelf plank: the bottom stays see-through. A soft contact shadow keeps the pig from floating.
  const P = L.piggy;
  ctx.save();
  ctx.filter = 'blur(5px)';
  ctx.fillStyle = theme === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(60,30,5,0.2)';
  ctx.beginPath();
  ctx.ellipse(P.x + 106, P.y + 166, 84, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return c;
}

/** A small bill balled up and smoothed out again: squashed, jagged outline, creases. */
export function paintCrumpled(value: number, cur: Currency): HTMLCanvasElement {
  const W = 82, H = 44;
  const { c, ctx } = canvas(W, H, RES);
  const r = rng(value * 7 + 3);
  // Jagged blob outline.
  const pts: [number, number][] = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.72 + r() * 0.28;
    pts.push([W / 2 + Math.cos(a) * (W / 2 - 2) * k, H / 2 + Math.sin(a) * (H / 2 - 2) * k]);
  }
  ctx.save();
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.shadowColor = 'rgba(40,20,0,0.45)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = BILL_PAL[billIndex(cur, value)][1];
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.clip();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.12);
  ctx.drawImage(paintBill(value, cur, 2), -W * 0.62, -H * 0.62, W * 1.24, H * 1.24);
  ctx.setTransform(RES, 0, 0, RES, 0, 0);
  // Facets: light and dark triangles, like paper that's been squeezed.
  for (let i = 0; i < 14; i++) {
    const x = r() * W, y = r() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 34, y + (r() - 0.5) * 24);
    ctx.lineTo(x + (r() - 0.5) * 34, y + (r() - 0.5) * 24);
    ctx.closePath();
    ctx.fillStyle = r() > 0.5 ? `rgba(0,0,0,${0.05 + r() * 0.08})` : `rgba(255,255,255,${0.06 + r() * 0.1})`;
    ctx.fill();
  }
  // Creases: a bright ridge with a dark fold next to it.
  for (let i = 0; i < 7; i++) {
    let x = r() * W, y = r() * H;
    const seg: [number, number][] = [[x, y]];
    for (let j = 0; j < 3; j++) seg.push([(x += (r() - 0.5) * 30), (y += (r() - 0.5) * 20)]);
    for (const [dx, color] of [[0, 'rgba(255,255,255,0.45)'], [0.8, 'rgba(0,0,0,0.28)']] as const) {
      ctx.beginPath();
      seg.forEach(([px, py], j) => (j ? ctx.lineTo(px + dx, py + dx) : ctx.moveTo(px + dx, py + dx)));
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }
  const shade = ctx.createRadialGradient(W * 0.4, H * 0.35, 2, W / 2, H / 2, W * 0.6);
  shade.addColorStop(0, 'rgba(255,255,255,0.12)');
  shade.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  return c;
}

function leather(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, base: string, seed: number, light = 0.14, texture: PurseSkin['texture'] = 'leather') {
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  if (texture === 'croc') {
    // Embossed scales: rows of rounded tiles, each with a highlight on top and a shadow below.
    for (let row = 0, ty = y - 4; ty < y + h; row++, ty += 13 + r() * 4) {
      for (let tx = x - 10 + (row % 2) * 9; tx < x + w; tx += 15 + r() * 6) {
        const tw = 12 + r() * 7, th = 10 + r() * 4;
        roundRect(ctx, tx, ty, tw, th, 4);
        ctx.fillStyle = `rgba(0,0,0,${0.18 + r() * 0.1})`;
        ctx.fill();
        roundRect(ctx, tx + 1, ty + 0.5, tw - 2, th - 2.5, 3.5);
        ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.06})`;
        ctx.fill();
      }
    }
  } else {
    for (let i = 0; i < (w * h) / 6; i++) {
      ctx.fillStyle = r() > 0.5 ? `rgba(0,0,0,${0.05 + r() * 0.1})` : `rgba(255,235,210,${0.03 + r() * 0.06})`;
      const s = 0.5 + r() * 1.4;
      ctx.fillRect(x + r() * w, y + r() * h, s, s);
    }
  }
  if (texture === 'glam') {
    // Glitter: tiny bright specks and a few four-point sparkles.
    for (let i = 0; i < (w * h) / 40; i++) {
      ctx.fillStyle = `rgba(255,${235 + r() * 20},${200 + r() * 55},${0.35 + r() * 0.5})`;
      ctx.fillRect(x + r() * w, y + r() * h, 0.8, 0.8);
    }
    for (let i = 0; i < (w * h) / 2600; i++) {
      const sx = x + r() * w, sy = y + r() * h, sz = 2.5 + r() * 3;
      ctx.fillStyle = 'rgba(255,250,235,0.9)';
      ctx.beginPath();
      ctx.moveTo(sx, sy - sz);
      ctx.quadraticCurveTo(sx, sy, sx + sz, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + sz);
      ctx.quadraticCurveTo(sx, sy, sx - sz, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - sz);
      ctx.fill();
    }
  }
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgba(255,240,220,${light})`);
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function stitches(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, color: string) {
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.3;
  ctx.strokeStyle = color;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

/** Back panel of the wallet, drawn behind the bills. Canvas origin is the pile's top-left. */
export function paintPurseBack(theme: Theme, L: Layout, skinId = 'leather'): HTMLCanvasElement {
  const skin = purseSkin(skinId), P = skin.look[theme], { back } = L.purse, o = L.pile;
  const { c, ctx } = canvas(o.w, o.h + 8, 2);
  const x = back.x - o.x, y = back.y - o.y;
  ctx.save();
  ctx.shadowColor = 'rgba(30,15,0,0.5)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, back.w, back.h, 20);
  ctx.fillStyle = P.back;
  ctx.fill();
  ctx.restore();
  leather(ctx, x, y, back.w, back.h, 20, P.back, 51, 0.1, skin.texture);
  // The opening: darker lining just under the top edge.
  const lining = ctx.createLinearGradient(0, y + 6, 0, y + 46);
  lining.addColorStop(0, 'rgba(0,0,0,0.35)');
  lining.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lining;
  roundRect(ctx, x + 8, y + 6, back.w - 16, 46, 12);
  ctx.fill();
  stitches(ctx, x + 6, y + 6, back.w - 12, back.h - 12, 15, P.stitch);
  return c;
}

/** Front pocket and coin pocket, drawn over the bills. */
export function paintPurseFront(theme: Theme, L: Layout, skinId = 'leather'): HTMLCanvasElement {
  const skin = purseSkin(skinId), P = skin.look[theme], { pocket, coinPocket } = L.purse, o = L.pile;
  const { c, ctx } = canvas(o.w, o.h + 8, 2);
  const px = pocket.x - o.x, py = pocket.y - o.y;
  ctx.save();
  ctx.shadowColor = 'rgba(30,15,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = -2;
  roundRect(ctx, px, py, pocket.w, pocket.h, 16);
  ctx.fillStyle = P.front;
  ctx.fill();
  ctx.restore();
  leather(ctx, px, py, pocket.w, pocket.h, 16, P.front, 73, 0.14, skin.texture);
  // Rolled top edge of the pocket.
  ctx.fillStyle = 'rgba(255,235,205,0.16)';
  roundRect(ctx, px + 2, py + 1, pocket.w - 4, 5, 3);
  ctx.fill();
  stitches(ctx, px + 7, py + 9, pocket.w - 14, pocket.h - 16, 11, P.stitch);

  const cx = coinPocket.x - o.x, cy = coinPocket.y - o.y;
  ctx.save();
  ctx.shadowColor = 'rgba(30,15,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = -3;
  roundRect(ctx, cx, cy, coinPocket.w, coinPocket.h, 14);
  ctx.fillStyle = P.coin;
  ctx.fill();
  ctx.restore();
  leather(ctx, cx, cy, coinPocket.w, coinPocket.h, 14, P.coin, 97, 0.18, skin.texture);
  stitches(ctx, cx + 6, cy + 8, coinPocket.w - 12, coinPocket.h - 14, 9, P.stitch);
  // Snap button.
  const bx = cx + coinPocket.w / 2, by = cy + 22;
  const metal = ctx.createRadialGradient(bx - 2, by - 2, 0, bx, by, 7);
  metal.addColorStop(0, '#fff6dc');
  metal.addColorStop(0.5, '#cfb274');
  metal.addColorStop(1, '#7d6330');
  ctx.fillStyle = metal;
  ctx.beginPath();
  ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
  ctx.fill();
  return c;
}
