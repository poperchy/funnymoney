'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { moneyShort } from '@/lib/money/format';
import { sum } from '@/lib/money/math';
import type { Bill, Coin } from '@/model/types';
import { FlatCoin, seeded, WallBill } from '@/components/mobile/parts';
import { packCells } from '@/scene/layout';
import { boardCss, cellCss, PIN, SURFACE } from '@/scene/skinCss';
import { boardSkin, type BoardSkinId } from '@/scene/skins';
import type { Theme } from '@/model/ui';

const COLS = 4, ROW_H = 82, GAP = 7;

export type DemoCell = { id: string; name: string; budget: number; colSpan: number; rowSpan: number };

/** A bill lying in a demo cell. The pose comes from its id, so it doesn't jump between renders. */
export function demoBill(id: string, value: number, cellId: string, z: number): Bill {
  const r = seeded(id);
  return { id, value, location: { type: 'cell', cellId }, pose: { x: r(), y: r(), r: (r() - 0.5) * 26 }, z };
}

/** Watches an element: whether it is on screen now, and whether it has ever been. */
export function useInView(threshold = 0.25) {
  const [el, ref] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, threshold]);
  return { ref, inView, seen };
}

/** A small wall in any skin, looking like the phone version of the real one. Bills stay away until `show`. */
export function MiniBoard({
  skin,
  theme = 'light',
  cells,
  bills,
  coins = [],
  show,
  cols = COLS,
  rowH = ROW_H,
  dropPrefix,
  onCell,
}: {
  skin: BoardSkinId;
  theme?: Theme;
  cells: DemoCell[];
  bills: Bill[];
  coins?: Coin[];
  show: boolean;
  cols?: number;
  rowH?: number;
  /** Marks cells as `data-drop` places, for `flyMoney`. */
  dropPrefix?: string;
  onCell?: (id: string, e: MouseEvent) => void;
}) {
  const board = boardSkin(skin);
  const look = board.look[theme];
  const { positions, rows } = packCells(cells, cols);
  const css = boardCss(board, look);
  return (
    <div
      className="rounded-[18px] p-[9px]"
      style={css.frame}
    >
      <div
        className="relative grid rounded-lg p-[7px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, ${rowH}px)`,
          gap: GAP,
          ...css.inner,
        }}
      >
        {cells.map((c, i) => {
          const p = positions.get(c.id);
          if (!p) return null;
          const inCell = bills.filter(b => b.location.type === 'cell' && b.location.cellId === c.id);
          const coinsHere = coins.filter(x => x.cellId === c.id);
          const k = sum([...inCell, ...coinsHere].map(b => b.value));
          const low = k > 0 && c.budget > 0 && k <= c.budget * 0.15;
          return (
            <div
              key={c.id}
              data-drop={dropPrefix ? dropPrefix + c.id : undefined}
              onClick={onCell ? e => onCell(c.id, e) : undefined}
              className={`relative overflow-hidden rounded-[5px] ${onCell ? 'cursor-pointer' : ''}`}
              style={{
                gridColumn: `${p.col + 1} / span ${c.colSpan}`,
                gridRow: `${p.row + 1} / span ${c.rowSpan}`,
                ...cellCss(board, look, c.id),
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: SURFACE[board.cellTexture] }} />
              {k === 0 && (
                <div className="absolute inset-[32px_6px_6px_6px] flex items-center justify-center rounded-md border-2 border-dashed border-[var(--dash)] px-1 py-0.5 text-center text-[11px] leading-[1.25] text-[var(--dash-ink)]">
                  Тут было что-то. Было.
                </div>
              )}
              {show && (
                <div className="absolute inset-0 z-[1]">
                  {inCell.map(b => (
                    <WallBill key={b.id} bill={b} onPointerDown={() => undefined} />
                  ))}
                  {coinsHere.map(co => {
                    const r = seeded(co.id);
                    return <FlatCoin key={co.id} coin={co} fall style={{ left: `calc((100% - 22px) * ${r().toFixed(3)})`, bottom: 4 + r() * 10, zIndex: 900 }} />;
                  })}
                </div>
              )}
              <div
                className="pointer-events-none absolute top-[5px] left-[5px] z-[2] max-w-[calc(100%-10px)] rounded-[3px] bg-tag py-1 pr-[7px] pl-3.5 text-left text-tag-ink shadow-[0_1px_1px_rgba(0,0,0,0.2),0_4px_8px_-4px_rgba(0,0,0,0.35)]"
                style={{ transform: `rotate(${(((i * 37) % 5) - 2) * 0.8}deg)` }}
              >
                <span className="absolute top-2 left-1 h-1.5 w-1.5 rounded-full" style={{ background: PIN }} />
                <div className="truncate text-[11.5px] leading-[1.2] font-semibold">{c.name}</div>
                <div className="text-[10.5px] leading-[1.3] whitespace-nowrap" style={{ color: low ? 'var(--danger)' : undefined }}>
                  <span className="font-semibold">{moneyShort(k)}</span>
                  {c.budget > 0 && <span className="opacity-55">/{moneyShort(c.budget)}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-lg"
          style={{ background: `radial-gradient(ellipse at 45% 20%, ${look.light[0]}, transparent 60%)` + (look.light[1] ? `, radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,${look.light[1]}))` : '') }}
        />
      </div>
    </div>
  );
}
