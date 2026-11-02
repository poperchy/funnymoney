// What the pig wears, painted in the pig's own coordinates (the 232×182 box both pigs are drawn in).
// One picture goes to Pixi (texture) and the DOM (data URL), so it sits in the same spot on every pig.
import { canvas, RES } from './paint';
import { NO_WEAR } from './skins';

/** The picture covers the pig and some air above it: hats stick out of the box. */
export const WEAR_BOX = { x: -10, y: -50, w: 260, h: 240 };

type Ctx = CanvasRenderingContext2D;

/** Where a hat sits: on top of the head, between the ears, tipped towards the snout. */
function onHead(ctx: Ctx, draw: () => void) {
  ctx.save();
  ctx.translate(160, 27);
  ctx.rotate(0.2);
  draw();
  ctx.restore();
}

function topHat(ctx: Ctx) {
  onHead(ctx, () => {
    ctx.fillStyle = '#2b2528';
    ctx.beginPath();
    ctx.roundRect(-20, -40, 40, 40, 3);
    ctx.fill();
    ctx.fillStyle = '#c23a3f';
    ctx.fillRect(-20, -11, 40, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(-14, -38, 6, 26);
    ctx.fillStyle = '#2b2528';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function crown(ctx: Ctx) {
  onHead(ctx, () => {
    const g = ctx.createLinearGradient(0, -30, 0, 4);
    g.addColorStop(0, '#ffe08a');
    g.addColorStop(1, '#d9a02e');
    ctx.fillStyle = g;
    ctx.strokeStyle = '#a8741a';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-26, 3);
    ctx.lineTo(-30, -20);
    ctx.lineTo(-14, -8);
    ctx.lineTo(0, -28);
    ctx.lineTo(14, -8);
    ctx.lineTo(30, -20);
    ctx.lineTo(26, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const [x, y, color] of [[-30, -21, '#e0506b'], [0, -29, '#4f8fe0'], [30, -21, '#e0506b'], [-13, -3, '#46b080'], [13, -3, '#46b080']] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function ushanka(ctx: Ctx) {
  onHead(ctx, () => {
    const fur = '#8a6242', edge = '#5e3f28';
    ctx.lineWidth = 2;
    ctx.strokeStyle = edge;
    // The flaps hang down over the ears.
    for (const x of [-27, 27]) {
      ctx.fillStyle = fur;
      ctx.beginPath();
      ctx.roundRect(x - 9, -6, 18, 30, 8);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#6d4c33';
    ctx.beginPath();
    ctx.roundRect(-26, -32, 52, 32, [20, 20, 4, 4]);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.roundRect(-32, -13, 64, 17, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e8c15a';
    ctx.beginPath();
    ctx.arc(0, -5, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** The line a necklace follows: from the nape, down to the chest under the snout. */
const NECK = { from: [136, 31], via: [122, 108], to: [178, 126] };
function neckPoint(t: number) {
  const { from, via, to } = NECK;
  const a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
  const x = a * from[0] + b * via[0] + c * to[0], y = a * from[1] + b * via[1] + c * to[1];
  const dx = 2 * (1 - t) * (via[0] - from[0]) + 2 * t * (to[0] - via[0]);
  const dy = 2 * (1 - t) * (via[1] - from[1]) + 2 * t * (to[1] - via[1]);
  return { x, y, angle: Math.atan2(dy, dx) };
}

function chain(ctx: Ctx) {
  const links = 20;
  for (let i = 0; i <= links; i++) {
    const p = neckPoint(i / links);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.strokeStyle = i % 2 ? '#c48f22' : '#f2c84f';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, i % 2 ? 2 : 3.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const { to } = NECK;
  const g = ctx.createRadialGradient(to[0] - 3, to[1] + 5, 2, to[0], to[1] + 8, 13);
  g.addColorStop(0, '#ffe9a6');
  g.addColorStop(1, '#d9a02e');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#a8741a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(to[0], to[1] + 8, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8a5f12';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', to[0], to[1] + 9);
}

function pearls(ctx: Ctx) {
  const beads = 14;
  for (let i = 0; i <= beads; i++) {
    const p = neckPoint(i / beads);
    const r = i === beads ? 7 : 5;
    const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, 0.5, p.x, p.y, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#d8cfd2');
    ctx.fillStyle = g;
    ctx.strokeStyle = 'rgba(120,90,100,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function bowTie(ctx: Ctx) {
  ctx.save();
  ctx.translate(170, 124);
  ctx.rotate(0.1);
  ctx.fillStyle = '#c23a3f';
  ctx.strokeStyle = '#8a2226';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * 24, -13);
    ctx.lineTo(side * 24, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.roundRect(-6, -7, 12, 14, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

const PAINTERS: Record<string, (ctx: Ctx) => void> = { tophat: topHat, crown, ushanka, chain, pearls, bow: bowTie };

/** Draws one item; `null` when there is nothing to wear. */
export function paintWear(id: string): HTMLCanvasElement | null {
  const paint = id === NO_WEAR ? undefined : PAINTERS[id];
  if (!paint) return null;
  const { c, ctx } = canvas(WEAR_BOX.w, WEAR_BOX.h);
  ctx.translate(-WEAR_BOX.x, -WEAR_BOX.y);
  paint(ctx);
  return c;
}

const urls = new Map<string, string | null>();
export function wearUrl(id: string): string | null {
  let url = urls.get(id);
  if (url === undefined) {
    url = paintWear(id)?.toDataURL() ?? null;
    urls.set(id, url);
  }
  return url;
}

export { RES as WEAR_RES };
