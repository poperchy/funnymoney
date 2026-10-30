'use client';

import { useUnit } from 'effector-react';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { money, moneyShort, plural } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import { MAX_CATEGORIES } from '@/model/defaults';
import { sheetOpened } from '@/model/mobile';
import { billsIn, coinsIn, crumpledInWallet, piggyCoins } from '@/model/ops';
import { coinLocation, type Bill, type BillLocation, type Coin } from '@/model/types';
import { $skins } from '@/model/skins';
import { $draftBillIds, $theme, categoryEditOpened, pigOpened, toastShown } from '@/model/ui';
import { $balance, $currency, $piggyTotal, $wallet, spreadRequested } from '@/model/wallet';
import { CoinFace } from '@/components/money/BillImg';
import { packCells } from '@/scene/layout';
import { crumpledUrl } from '@/scene/paint';
import { dropItem, type DropKey, type Item } from './actions';
import { boardSkin, purseSkin, type BoardSkin } from '@/scene/skins';
import { usePig } from './pig';
import { askMotion } from './PigSheet';
import { billImg, FlatCoin, MBH, MBW, PigArt, seeded, setLive, TAG_TOP, WallBill } from './parts';

const COLS = 4, ROW_H = 82, GAP = 7;
const ADD_ID = '__add';
/** Long press that lifts a bill on touch screens; a shorter press is a tap, a move before it is a scroll. */
const LONG_PRESS_MS = 260;
/** On touch the bill rides above the finger, so it isn't hidden under it. */
const LIFT = 28;

const PIN = 'radial-gradient(circle at 35% 30%, #ff8a6a, #b8321b)';
/** SVG fractal noise as a CSS background: grains of one colour (r g b in 0..1). */
const noise = (freq: number, octaves: number, [r, g, b]: number[], alpha: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 0 0 0 ${alpha} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const SHEEN = 'radial-gradient(ellipse at 30% 15%, rgba(255,255,255,0.14), transparent 60%)';
/** Cell surfaces per board skin, in CSS (the desktop paints the same three on a canvas). */
const SURFACE: Record<BoardSkin['cellTexture'], string> = {
  cork: `${noise(0.9, 3, [0.22, 0.12, 0.04], 0.75)}, ${SHEEN}`,
  felt: `${noise(1.8, 2, [0, 0.05, 0.02], 0.5)}, ${SHEEN}`,
  concrete: `${noise(0.55, 4, [0.2, 0.2, 0.2], 0.45)}, ${SHEEN}`,
};
const FRAME: Record<BoardSkin['frameTexture'], string> = {
  wood: 'repeating-linear-gradient(92deg, rgba(0,0,0,0.07) 0 1px, transparent 1px 6px, rgba(255,255,255,0.04) 6px 7px, transparent 7px 13px), linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.18))',
  metal: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px, rgba(0,0,0,0.05) 3px 4px), linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.18), rgba(0,0,0,0.12))',
};

type Drag = Item & { x: number; y: number; ox: number; oy: number; lift: number; target: DropKey | null };
type Grab = { item: Item; sx: number; sy: number; cx: number; cy: number; ox: number; oy: number; touch: boolean; timer: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function targetAt(x: number, y: number): DropKey | null {
  const el = document.elementFromPoint(x, y);
  return (el?.closest('[data-drop]') as HTMLElement | null)?.dataset.drop ?? null;
}

/**
 * Touch: hold still for a moment and the bill lifts; moving earlier is a normal scroll.
 * Mouse: drag starts after a few pixels. Near the top and bottom edges the wall scrolls by itself.
 */
function useDrag(scrollRef: RefObject<HTMLDivElement | null>, dockRef: RefObject<HTMLDivElement | null>) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const grab = useRef<Grab | null>(null);
  const live = useRef<Drag | null>(null);
  const lastDrop = useRef(0);
  const lift = useRef<() => void>(() => undefined);

  useEffect(() => {
    let auto = 0;
    const set = (d: Drag | null) => {
      live.current = d;
      setDrag(d);
    };
    const follow = () => {
      const g = grab.current, d = live.current;
      if (!g || !d) return;
      set({ ...d, x: g.cx, y: g.cy, target: targetAt(g.cx, g.cy) });
    };
    const start = () => {
      const g = grab.current;
      if (!g) return;
      set({ ...g.item, x: g.cx, y: g.cy, ox: g.ox, oy: g.oy, lift: g.touch ? LIFT : 0, target: targetAt(g.cx, g.cy) });
      navigator.vibrate?.(12);
      auto = window.setInterval(() => {
        const d = live.current, sc = scrollRef.current;
        if (!d || !sc) return;
        const y = d.y - d.lift, top = sc.getBoundingClientRect().top;
        const dock = dockRef.current?.getBoundingClientRect().top ?? window.innerHeight;
        const dy = y < top + 50 ? -9 : y > dock - 60 && y < dock + 10 ? 9 : 0;
        if (dy) {
          sc.scrollTop += dy;
          follow();
        }
      }, 16);
    };
    const end = (drop: boolean) => {
      const g = grab.current, d = live.current;
      if (g) clearTimeout(g.timer);
      clearInterval(auto);
      grab.current = null;
      if (!d) return;
      set(null);
      lastDrop.current = Date.now();
      if (!drop || !d.target) return;
      let pose;
      const cell = d.target !== 'pile' && document.querySelector<HTMLElement>(`[data-drop="${CSS.escape(d.target)}"]`);
      if (cell && d.kind === 'bill') {
        const r = cell.getBoundingClientRect();
        const gx = d.x - d.ox, gy = d.y - d.oy - d.lift;
        pose = {
          x: clamp01((gx - r.left) / Math.max(1, r.width - MBW)),
          y: clamp01((gy - r.top - TAG_TOP) / Math.max(1, r.height - MBH - TAG_TOP - 3)),
          r: (Math.random() - 0.5) * 20,
        };
      }
      dropItem(d, d.target, pose);
    };
    const move = (e: PointerEvent) => {
      const g = grab.current;
      if (!g) return;
      g.cx = e.clientX;
      g.cy = e.clientY;
      if (live.current) return follow();
      const dist = Math.hypot(g.cx - g.sx, g.cy - g.sy);
      if (g.touch) {
        // Moved before the long press: it's a scroll, let it go.
        if (dist > 8) {
          clearTimeout(g.timer);
          grab.current = null;
        }
      } else if (dist >= 4) start();
    };
    const up = () => end(true);
    const cancel = () => end(false);
    // Once a bill is lifted the finger drags it, not the page.
    const touchMove = (e: TouchEvent) => {
      if (live.current && e.cancelable) e.preventDefault();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', touchMove, { passive: false });
    lift.current = start;
    return () => {
      clearInterval(auto);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', touchMove);
    };
  }, [scrollRef, dockRef]);

  const down = (e: React.PointerEvent, item: Item) => {
    if (e.button > 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    const touch = e.pointerType !== 'mouse';
    if (!touch) e.preventDefault();
    const g: Grab = {
      item,
      sx: e.clientX,
      sy: e.clientY,
      cx: e.clientX,
      cy: e.clientY,
      ox: Math.min(MBW, Math.max(0, e.clientX - r.left)),
      oy: Math.min(MBH, Math.max(0, e.clientY - r.top)),
      touch,
      timer: 0,
    };
    if (touch) g.timer = window.setTimeout(() => grab.current === g && lift.current(), LONG_PRESS_MS);
    grab.current = g;
  };

  /** A tap right after a drop is the tail of the drag, not a tap. */
  const justDropped = () => Date.now() - lastDrop.current < 350;

  return { drag, down, justDropped };
}

function Ghost({ d }: { d: Drag }) {
  const cur = useUnit($currency);
  return (
    <div
      className="pointer-events-none fixed z-[140]"
      style={{ left: d.x - d.ox, top: d.y - d.oy - d.lift, transform: 'rotate(-5deg) scale(1.16)', transformOrigin: `${d.ox}px ${d.oy}px` }}
    >
      {d.kind === 'coin' ? (
        <span className="block rounded-full shadow-[0_14px_18px_-6px_rgba(30,15,0,0.55)]">
          <CoinFace value={d.value} size={30} />
        </span>
      ) : (
        billImg(d.value, cur, MBW, { boxShadow: '0 3px 3px rgba(0,0,0,0.2), 0 26px 30px -10px rgba(30,15,0,0.6)' })
      )}
    </div>
  );
}

const billItem = (b: Bill): Item => ({ kind: 'bill', id: b.id, value: b.value, from: b.location });
const coinItem = (c: Coin): Item => ({ kind: 'coin', id: c.id, value: c.value, from: coinLocation(c) });

/** "Октябрь · ещё 3 дня": the desktop header's month line, short enough for a phone. */
function monthNote(now = new Date()) {
  const name = now.toLocaleString('ru-RU', { month: 'long' });
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  const left = days === 0 ? 'последний день' : `ещё ${days} ${plural(days, 'день', 'дня', 'дней')}`;
  return name[0].toUpperCase() + name.slice(1) + ' · ' + left;
}

function spentThisMonth(receipts: { amount: number; at: string }[]) {
  const now = new Date();
  return sum(receipts.filter(r => {
    const d = new Date(r.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).map(r => r.amount));
}

export function MobileWall() {
  const [w, cur, balance, pigTotal, draftIds] = useUnit([$wallet, $currency, $balance, $piggyTotal, $draftBillIds]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const { drag, down, justDropped } = useDrag(scrollRef, dockRef);
  const { ref: pigRef, jolt, poke } = usePig();
  const [theme, skins] = useUnit([$theme, $skins]);
  const board = boardSkin(skins.board);
  const look = board.look[theme];
  const purse = purseSkin(skins.purse).look[theme];

  // Money that arrives from now on drops in.
  useEffect(() => {
    setLive(true);
    return () => setLive(false);
  }, []);

  const cats = w.categories;
  const grid = useMemo(() => {
    const withAdd = cats.length < MAX_CATEGORIES;
    const packed = packCells(withAdd ? [...cats, { id: ADD_ID, colSpan: 1, rowSpan: 1 }] : cats, COLS);
    const plain = withAdd ? packCells(cats, COLS) : packed;
    const add = withAdd ? packed.positions.get(ADD_ID)! : null;
    // No gap left for the card: it gets a row of its own, across the board.
    const addOwnRow = !!add && add.row >= plain.rows;
    return { positions: packed.positions, rows: Math.max(1, packed.rows), add, addOwnRow };
  }, [cats]);

  // The oldest small bills lie crumpled on the wallet, as on the desktop.
  const crumpled = crumpledInWallet(w);
  const allPileBills = billsIn(w, { type: 'pile' });
  const pileBills = allPileBills.filter(b => !crumpled.has(b.id));
  const crumpledBills = allPileBills.filter(b => crumpled.has(b.id));
  const pileCoins = coinsIn(w, { type: 'pile' });
  const pileTotal = sum([...allPileBills, ...pileCoins].map(b => b.value));
  const spent = spentThisMonth(w.receipts);
  const dragging = !!drag;
  const hot = (key: string) => !!drag && drag.target === key && drag.target !== (drag.from.type === 'cell' ? drag.from.cellId : drag.from.type);
  const openCell = (loc: BillLocation, e: React.MouseEvent) => {
    if (justDropped() || dragging) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-bill],[data-coin]');
    sheetOpened({ type: 'cell', loc, sel: el ? (el.dataset.bill ?? el.dataset.coin ?? null) : null });
  };
  const zoneH = dragging ? 112 : 70;

  return (
    <div className="fixed inset-0 overflow-hidden bg-page" style={{ overscrollBehavior: 'none' }}>
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2.5 bg-page pr-3.5 pl-5"
        style={{ paddingTop: 'max(10px, env(safe-area-inset-top))', height: 'calc(max(10px, env(safe-area-inset-top)) + 64px)' }}
      >
        <div className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-xs text-ink2">{monthNote()}</span>
          <span className="text-[28px] leading-[1.05] font-bold tracking-[-0.035em] whitespace-nowrap">
            {money(balance)} <span className="text-[15px] font-medium text-ink2">{cur.symbol}</span>
          </span>
        </div>
        <div className="flex flex-none gap-2">
          {/* Typing is the everyday path on a phone; dragging stays for when you feel like it. Salary lives in "⋯". */}
          <button
            onClick={() => sheetOpened({ type: 'spend' })}
            className="h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink shadow-[0_8px_18px_-10px_rgba(30,70,50,0.9)]"
          >
            Потратить
          </button>
          <button onClick={() => sheetOpened({ type: 'menu' })} aria-label="Настройки" className="h-11 w-11 rounded-full bg-btn2 text-lg text-ink">
            ⋯
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="no-scrollbar absolute inset-x-0 bottom-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        style={{ top: 'calc(max(10px, env(safe-area-inset-top)) + 64px)', paddingTop: 6, paddingBottom: 'calc(150px + env(safe-area-inset-bottom))' }}
      >
        {(allPileBills.length > 0 || pileCoins.length > 0) && (
          <div
            data-drop="pile"
            onClick={e => openCell({ type: 'pile' }, e)}
            className="relative mx-3 mb-3 cursor-pointer rounded-[20px] px-3.5 pt-3.5 pb-2.5 text-[#fbf1e1] transition-shadow duration-200"
            style={{
              background: `linear-gradient(170deg, ${purse.front}, ${purse.back})`,
              boxShadow: hot('pile') ? '0 0 0 3px var(--accent), 0 14px 26px -16px rgba(30,15,0,0.7)' : '0 14px 26px -16px rgba(30,15,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {/* The wallet's stitching, in the colours of the chosen wallet skin. */}
            <div className="pointer-events-none absolute inset-[5px] rounded-[16px] border-[1.5px] border-dashed" style={{ borderColor: purse.stitch }} />
            <div className="relative flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px]">
                В кошельке: <b className="whitespace-nowrap">{moneyShort(pileTotal)} {cur.symbol}</b>
              </span>
              <span className="text-[13px] text-[rgba(251,241,225,0.75)]">{allPileBills.length ? 'Грустят без дела. Разложи их' : 'Мелочь — свинке'}</span>
            </div>
            <div className="relative mt-2.5 flex gap-2">
              {allPileBills.length > 0 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    spreadRequested();
                  }}
                  className="h-9 rounded-full bg-[rgba(255,248,235,0.94)] px-3 text-[13px] font-semibold text-[#2a231b]"
                >
                  Как в прошлый раз
                </button>
              )}
              <button
                onClick={e => {
                  e.stopPropagation();
                  sheetOpened({ type: 'distribute', source: 'pile' });
                }}
                className="h-9 rounded-full border-[1.5px] border-[rgba(255,240,220,0.5)] px-3 text-[13px] font-semibold"
              >
                Вписать суммы
              </button>
            </div>
            <div className="relative mt-2.5 h-[58px]">
              <div className="absolute inset-y-0 left-0" style={{ right: (pileCoins.length ? 76 : 0) + crumpledBills.length * 46 }}>
                {pileBills.map((b, i, all) => (
                  <WallBill
                    key={b.id}
                    bill={b}
                    hidden={drag?.id === b.id || draftIds.has(b.id)}
                    pos={{
                      left: all.length > 1 ? `calc(min(34px, (100% - ${MBW}px) / ${all.length - 1}) * ${i})` : '0px',
                      top: 8 + (i % 2) * 5 + 'px',
                      r: (((i * 37) % 7) - 3) * 2,
                    }}
                    onPointerDown={e => down(e, billItem(b))}
                  />
                ))}
              </div>
              {crumpledBills.map((b, i) => (
                <div
                  key={b.id}
                  data-bill={b.id}
                  onPointerDown={e => down(e, billItem(b))}
                  onContextMenu={e => e.preventDefault()}
                  aria-label={`${moneyShort(b.value)} ${cur.code}, скомканная`}
                  className="absolute cursor-grab select-none [-webkit-touch-callout:none]"
                  style={{
                    right: (pileCoins.length ? 70 : 0) + i * 44,
                    bottom: 2 + (i % 2) * 6,
                    transform: `rotate(${(seeded(b.id)() - 0.5) * 50}deg)`,
                    filter: 'drop-shadow(0 3px 3px rgba(20,8,0,0.45))',
                    opacity: drag?.id === b.id || draftIds.has(b.id) ? 0 : 1,
                    touchAction: 'pan-y',
                    zIndex: 50,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                  <img src={crumpledUrl(b.value, cur)} alt="" width={58} height={31} draggable={false} className="pointer-events-none block" />
                </div>
              ))}
              {pileCoins.slice(-24).map((c, i) => (
                <FlatCoin
                  key={c.id}
                  coin={c}
                  fall
                  style={{ right: 4 + (i % 4) * 17, bottom: 6 + Math.floor(i / 4) * 6, opacity: drag?.id === c.id ? 0 : 1, zIndex: i }}
                  onPointerDown={e => down(e, coinItem(c))}
                />
              ))}
            </div>
          </div>
        )}

        <div
          className="mx-3 rounded-[18px] p-[9px]"
          style={{
            backgroundColor: look.frame,
            backgroundImage: FRAME[board.frameTexture],
            boxShadow: '0 24px 40px -26px rgba(40,20,0,0.75), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(0,0,0,0.25)',
          }}
        >
          <div
            className="relative grid rounded-lg p-[7px]"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${grid.rows}, ${ROW_H}px)`,
              gap: GAP,
              backgroundColor: look.inner,
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 5px)',
              boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.45)',
            }}
          >
            {cats.map((c, i) => {
              const p = grid.positions.get(c.id);
              if (!p) return null;
              const cs = Math.min(COLS, c.colSpan);
              const loc: BillLocation = { type: 'cell', cellId: c.id };
              const bills = billsIn(w, loc);
              const coins = coinsIn(w, loc);
              const k = sum([...bills, ...coins].map(b => b.value));
              const low = k > 0 && c.budget > 0 && k <= c.budget * 0.15;
              return (
                <div
                  key={c.id}
                  data-drop={c.id}
                  onClick={e => openCell(loc, e)}
                  className="relative cursor-pointer overflow-hidden rounded-[5px]"
                  style={{
                    gridColumn: `${p.col + 1} / span ${cs}`,
                    gridRow: `${p.row + 1} / span ${c.rowSpan}`,
                    backgroundColor: look.cell,
                    boxShadow: 'inset 0 2px 6px rgba(50,25,5,0.45), inset 0 0 0 1px rgba(0,0,0,0.12)',
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: SURFACE[board.cellTexture] }} />
                  {k === 0 && (
                    <div className="absolute inset-[36px_6px_6px_6px] flex items-center justify-center rounded-md border-2 border-dashed border-[var(--dash)] px-1 py-0.5 text-center text-[11px] leading-[1.25] text-[var(--dash-ink)]">
                      Тут было что-то. Было.
                    </div>
                  )}
                  {/* Own stacking context: bill z-orders keep growing and must stay under the tag. */}
                  <div className="absolute inset-0 z-[1]">
                    {bills.map(b => (
                      <WallBill key={b.id} bill={b} hidden={drag?.id === b.id || draftIds.has(b.id)} onPointerDown={e => down(e, billItem(b))} />
                    ))}
                    {coins.map(co => {
                      const r = seeded(co.id);
                      return (
                        <FlatCoin
                          key={co.id}
                          coin={co}
                          fall
                          style={{ left: `calc((100% - 22px) * ${r().toFixed(3)})`, bottom: 4 + r() * 10, opacity: drag?.id === co.id ? 0 : 1, zIndex: 900 }}
                          onPointerDown={e => down(e, coinItem(co))}
                        />
                      );
                    })}
                  </div>
                  <div
                    className="pointer-events-none absolute top-[5px] left-[5px] z-[2] max-w-[calc(100%-10px)] rounded-[3px] bg-tag py-1 pr-[7px] pl-3.5 text-tag-ink shadow-[0_1px_1px_rgba(0,0,0,0.2),0_4px_8px_-4px_rgba(0,0,0,0.35)]"
                    style={{ transform: `rotate(${(((i * 37) % 5) - 2) * 0.8}deg)` }}
                  >
                    <span className="absolute top-2 left-1 h-1.5 w-1.5 rounded-full" style={{ background: PIN }} />
                    <div className="truncate text-[11.5px] leading-[1.2] font-semibold">{c.name}</div>
                    <div className="text-[10.5px] leading-[1.3] whitespace-nowrap" style={{ color: low ? 'var(--danger)' : undefined }}>
                      <span className="font-semibold">{moneyShort(k)}</span>
                      {c.budget > 0 && <span className="opacity-55">/{moneyShort(c.budget)}</span>}
                      {low && cs > 1 && <span> · на донышке</span>}
                    </div>
                  </div>
                  {hot(c.id) && <div className="pointer-events-none absolute inset-0 z-[3] rounded-[5px] border-2 border-[rgba(255,250,235,0.95)] bg-[rgba(255,250,235,0.16)]" />}
                </div>
              );
            })}
            {grid.add && (
              <button
                onClick={() => categoryEditOpened('new')}
                className="flex items-center justify-center rounded-[5px] border-2 border-dashed border-[var(--dash)] text-[13px] font-semibold text-[var(--dash-ink)]"
                style={{ gridColumn: grid.addOwnRow ? `1 / span ${COLS}` : `${grid.add.col + 1} / span 1`, gridRow: `${grid.add.row + 1} / span 1` }}
              >
                + Ячейка
              </button>
            )}
            <div
              className="pointer-events-none absolute inset-0 z-10 rounded-lg"
              style={{
                background:
                  `radial-gradient(ellipse at 45% 20%, ${look.light[0]}, transparent 60%)` +
                  (look.light[1] ? `, radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,${look.light[1]}))` : ''),
              }}
            />
          </div>
        </div>
        <div className="mx-7 mt-3.5 text-center text-xs leading-[1.45] text-balance text-ink2">
          Трату проще вписать кнопкой «Потратить». А можно по-старому: зажми купюру и тащи в другую ячейку, в «Потрачено» или в свинку. Или тапни по ячейке
        </div>
      </div>

      <div
        ref={dockRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end gap-2.5 px-3 pt-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 18px)', background: 'linear-gradient(180deg, transparent, var(--page) 30%)' }}
      >
        <div
          data-drop="spent"
          onClick={() => !justDropped() && sheetOpened({ type: 'receipts' })}
          className="pointer-events-auto relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-[22px] px-4 py-3 text-[#f6efe3]"
          style={{
            height: zoneH,
            background: 'var(--till)',
            boxShadow:
              drag?.target === 'spent'
                ? '0 0 0 3px var(--accent), 0 18px 30px -12px rgba(0,0,0,0.6)'
                : dragging
                  ? '0 0 0 2px rgba(246,239,227,0.25)'
                  : '0 10px 20px -14px rgba(0,0,0,0.6)',
            transition: 'height .25s cubic-bezier(.22,.8,.3,1), box-shadow .2s ease',
          }}
        >
          <div className="absolute inset-x-4 top-[9px] h-1 rounded-sm bg-[rgba(0,0,0,0.5)] shadow-[0_1px_0_rgba(255,255,255,0.1)]" />
          <div className="relative mt-2 flex flex-col gap-0.5">
            <span className="text-[17px] font-bold">Потрачено</span>
            <span className="truncate text-[13px] text-[rgba(246,239,227,0.75)]">
              {dragging
                ? drag.target === 'spent'
                  ? 'Отпускай. Прощай, дружок'
                  : 'Тащи сюда, чтобы потратить'
                : spent
                  ? `−${money(spent)} за месяц · чеки, статистика ›`
                  : 'Пока ничего · чеки, статистика ›'}
            </span>
          </div>
        </div>
        <div
          data-drop="piggy"
          className="pointer-events-auto relative w-[176px] flex-none overflow-hidden rounded-[22px] bg-panel"
          style={{
            height: zoneH,
            boxShadow: drag?.target === 'piggy' ? '0 0 0 3px var(--accent)' : dragging ? 'inset 0 0 0 2px var(--line)' : 'none',
            transition: 'height .25s cubic-bezier(.22,.8,.3,1), box-shadow .2s ease',
          }}
        >
          {/* The pig itself: poke it, like on the desktop. */}
          <button aria-label="Потыкать свинку" onClick={() => !justDropped() && poke()} className="absolute inset-y-0 left-0 w-[86px]">
            <div ref={pigRef} data-pig className="pointer-events-none absolute bottom-[3px] left-0.5 h-[62px] w-[79px] origin-bottom">
              <div className="absolute top-0 left-0 h-[182px] w-[232px] origin-top-left scale-[0.34]">
                <PigArt coins={piggyCoins(w)} bills={billsIn(w, { type: 'piggy' })} target={drag?.target === 'piggy'} jolt={jolt} />
              </div>
            </div>
          </button>
          {/* The numbers: open the piggy ritual. */}
          <button
            onClick={() => {
              if (justDropped()) return;
              if (!pigTotal) {
                toastShown('Свинка голодает. Покорми её мелочью со сдачи');
                return;
              }
              askMotion();
              pigOpened();
            }}
            className="absolute inset-y-0 right-0 left-[86px] flex flex-col items-end gap-px pt-[9px] pr-3 text-right"
          >
            <span className="text-[11px] whitespace-nowrap text-ink2">Нужная мусорка</span>
            <span className="text-[15px] font-bold whitespace-nowrap">
              {moneyShort(pigTotal)} <span className="text-[11px] font-medium text-ink2">{cur.symbol}</span>
            </span>
            <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: pigTotal && !dragging ? 'var(--accent)' : 'var(--ink2)' }}>
              {dragging ? 'Хрю, сюда' : pigTotal ? 'Забрать ›' : 'Свинка голодает'}
            </span>
          </button>
        </div>
      </div>

      {drag && <Ghost d={drag} />}
    </div>
  );
}
