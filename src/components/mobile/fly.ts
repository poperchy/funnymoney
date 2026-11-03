// Money flying across the phone wall after a typed spend or move. The model changes at once; this is only the show.
import { $denoms } from '@/model/wallet';
import { billUrl } from '@/scene/paint';
import type { Denoms } from '@/lib/money/denominations';
import { coinBg, MBH, MBW, setLanding } from './parts';

const FLIGHT_MS = 480;
const STAGGER_MS = 70;
/** A stack of forty bills flies the same as six. */
const MAX_GHOSTS = 6;

export type Hop = {
  /** `data-drop` keys: a cell id, 'pile', 'spent' or 'piggy'. */
  from: string;
  to: string;
  values: number[];
  /** Delay before take-off, ms. */
  at?: number;
  /** Gets swallowed on arrival (the till) instead of landing among the money. */
  swallow?: boolean;
  /** Fires once, when the first piece arrives. */
  onLand?: () => void;
};

/** How long `count` pieces take: the next hop can start right after. */
export const flightTime = (count: number) => FLIGHT_MS + STAGGER_MS * (Math.min(count, MAX_GHOSTS) - 1);

const place = (key: string) => (key === 'piggy' ? document.querySelector('[data-pig]') : document.querySelector(`[data-drop="${CSS.escape(key)}"]`));

/** Centre of a place on screen, kept inside the screen when the place is scrolled away. */
function centerOf(key: string) {
  const r = place(key)?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  return { x, y: Math.min(window.innerHeight - 30, Math.max(70, y)) };
}

function ghostOf(value: number, denoms: Denoms) {
  if (value >= denoms.bills[0]) {
    const img = document.createElement('img');
    img.src = billUrl(value, denoms);
    img.alt = '';
    Object.assign(img.style, { width: `${MBW}px`, height: `${MBH}px`, borderRadius: '3px' });
    return { el: img as HTMLElement, w: MBW, h: MBH };
  }
  const { background, edge, size } = coinBg(value, denoms);
  const coin = document.createElement('div');
  Object.assign(coin.style, { width: `${size}px`, height: `${size}px`, borderRadius: '50%', background, boxShadow: `0 2px 0 ${edge}, 0 6px 8px -2px rgba(30,15,0,0.5)` });
  return { el: coin, w: size, h: size };
}

function launch(hop: Hop, start: { x: number; y: number }, denoms: Denoms) {
  const end = centerOf(hop.to);
  const rect = place(hop.to)?.getBoundingClientRect();
  // The biggest ones are what you remember.
  const values = [...hop.values].sort((a, b) => b - a).slice(0, MAX_GHOSTS);
  let landed = false;
  values.forEach((value, i) => {
    const { el, w, h } = ghostOf(value, denoms);
    Object.assign(el.style, { position: 'fixed', left: '0', top: '0', zIndex: '140', pointerEvents: 'none', opacity: '0', willChange: 'transform' });
    document.body.append(el);
    const jitter = (spread: number) => (Math.random() - 0.5) * spread;
    const toX = end.x + jitter((rect?.width ?? 0) * 0.4) - w / 2;
    const toY = end.y + jitter((rect?.height ?? 0) * 0.3) - h / 2;
    const fromX = start.x + jitter(24) - w / 2;
    const fromY = start.y + jitter(12) - h / 2;
    const midX = (fromX + toX) / 2 + jitter(50);
    const midY = (fromY + toY) / 2 - 46;
    const spin = jitter(30);
    const anim = el.animate(
      [
        { transform: `translate(${fromX}px, ${fromY}px) rotate(${spin}deg) scale(0.85)`, opacity: 0 },
        { transform: `translate(${(fromX * 3 + midX) / 4}px, ${(fromY * 3 + midY) / 4}px) rotate(${spin}deg) scale(1.05)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${midX}px, ${midY}px) rotate(${-spin}deg) scale(1.12)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${toX}px, ${toY}px) rotate(${jitter(16)}deg) scale(${hop.swallow ? 0.55 : 1})`, opacity: hop.swallow ? 0 : 1 },
      ],
      { duration: FLIGHT_MS, delay: (hop.at ?? 0) + i * STAGGER_MS, easing: 'cubic-bezier(.35,.1,.45,1)', fill: 'both' },
    );
    const done = () => el.remove();
    anim.oncancel = done;
    anim.onfinish = () => {
      done();
      if (landed) return;
      landed = true;
      hop.onLand?.();
      if (hop.swallow) place(hop.to)?.animate([{ transform: 'none' }, { transform: 'scale(1.03, 0.95)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
    };
  });
}

/**
 * Applies `commit`, then flies the money. Starts are measured before the commit (an emptied wallet leaves the
 * wall), ends after it (a wallet may just have appeared). What lands in a cell shows up as its ghost arrives.
 */
export function flyMoney(hops: Hop[], commit: () => void) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    commit();
    hops.forEach(h => h.onLand?.());
    return;
  }
  const denoms = $denoms.getState();
  const starts = hops.map(h => centerOf(h.from));
  const arrivals = hops.filter(h => !h.swallow);
  setLanding(Math.max(0, ...arrivals.map(h => (h.at ?? 0) + flightTime(h.values.length))));
  commit();
  requestAnimationFrame(() => {
    setLanding(0);
    // Bring the destination into view. With several, the first one: the wall can't jump around for each.
    if (arrivals[0] && arrivals[0].to !== 'piggy') place(arrivals[0].to)?.scrollIntoView({ block: 'nearest' });
    hops.forEach((h, i) => launch(h, starts[i], denoms));
  });
}
