// Scene geometry in design px. The DOM overlay uses the same numbers, so tags line up with cells.
// Cells are packed onto an 8-column grid in category order; the board grows by rows as cells are added.
import { MAX_CATEGORIES } from '@/model/defaults';
import type { BillLocation, Category, Pose } from '@/model/types';

export const SCENE_W = 1060;
export const BW = 100;
export const BH = 50;

const GRID_X = 26, GRID_Y = 26, COL_W = 117.25, ROW_H = 118, GAP = 10;
export const GRID_COLS = 8;
// The board is as tall as its cells; the design numbers below are for 4 rows and shift by `dy`.
const MIN_ROWS = 1;
const DESIGN_ROWS = 4;
/** Board height for 4 rows; everything below the board shifts by the extra rows. */
const BASE_BOARD_H = 554;
// The shelf sits 24px lower than in the design, so bills sticking out of the wallet clear its caption.
const SHELF_DROP = 24;
const BASE_SCENE_H = 802 + SHELF_DROP;

/** Shelf objects relative to the piggy, which never change. */
export const PIG_FLOOR_Y = 184; // plank top, in piggy coordinates
export const PIG_PILE_X = 440; // pile left edge, in piggy coordinates

/** Cell bills keep below the paper tag. */
export const TAG_H = 46;

export type Rect = { x: number; y: number; w: number; h: number };

export type Layout = {
  rows: number;
  /** Scene height. */
  h: number;
  board: Rect;
  plank: Rect;
  piggy: Rect;
  pigInfo: { x: number; y: number; w: number };
  pile: Rect;
  /** The big leather wallet that holds the pile: back panel, front pocket, and a coin pocket sewn on the right. */
  purse: { back: Rect; pocket: Rect; coinPocket: Rect };
  /** The "add a cell" card on the board, if there is room for more cells. */
  addCell: Rect | null;
  cells: Map<string, Rect>;
};

type Span = Pick<Category, 'colSpan' | 'rowSpan'>;

/** First-fit dense packing, row by row, like CSS grid with `grid-auto-flow: dense`. */
export function packCells(cats: (Span & { id: string })[]) {
  const taken: boolean[][] = [];
  const free = (r: number, c: number) => !taken[r]?.[c];
  const out = new Map<string, { col: number; row: number }>();
  let rows = 0;
  for (const cat of cats) {
    const cs = Math.min(GRID_COLS, Math.max(1, cat.colSpan)), rs = Math.max(1, cat.rowSpan);
    for (let r = 0; ; r++) {
      let placed = false;
      for (let c = 0; c + cs <= GRID_COLS; c++) {
        let fits = true;
        for (let dr = 0; dr < rs && fits; dr++) for (let dc = 0; dc < cs && fits; dc++) fits = free(r + dr, c + dc);
        if (!fits) continue;
        for (let dr = 0; dr < rs; dr++) for (let dc = 0; dc < cs; dc++) (taken[r + dr] ??= [])[c + dc] = true;
        out.set(cat.id, { col: c, row: r });
        rows = Math.max(rows, r + rs);
        placed = true;
        break;
      }
      if (placed) break;
    }
  }
  return { positions: out, rows };
}

const ADD_ID = '__add';

/**
 * `withAdd` reserves a spot for the "add a cell" card: the first free 1×1 gap among the cells,
 * or, when the grid is full, a whole new row (the card then stretches across it).
 */
export function computeLayout(cats: Category[], withAdd = cats.length < MAX_CATEGORIES): Layout {
  const packed = packCells(cats);
  let addCell: Rect | null = null;
  let used = packed.rows;
  if (withAdd) {
    const withTile = packCells([...cats, { id: ADD_ID, colSpan: 1, rowSpan: 1 }]);
    const p = withTile.positions.get(ADD_ID)!;
    const ownRow = p.row >= packed.rows;
    addCell = {
      x: GRID_X + (ownRow ? 0 : p.col * (COL_W + GAP)),
      y: GRID_Y + p.row * (ROW_H + GAP),
      w: ownRow ? GRID_COLS * COL_W + (GRID_COLS - 1) * GAP : COL_W,
      h: ROW_H,
    };
    used = Math.max(used, p.row + 1);
  }
  const positions = packed.positions;
  const rows = Math.max(MIN_ROWS, used);
  const dy = (rows - DESIGN_ROWS) * (ROW_H + GAP);
  const cells = new Map<string, Rect>();
  for (const c of cats) {
    const p = positions.get(c.id);
    if (!p) continue;
    const cs = Math.min(GRID_COLS, c.colSpan);
    cells.set(c.id, {
      x: GRID_X + p.col * (COL_W + GAP),
      y: GRID_Y + p.row * (ROW_H + GAP),
      w: cs * COL_W + (cs - 1) * GAP,
      h: c.rowSpan * ROW_H + (c.rowSpan - 1) * GAP,
    });
  }
  const shelfY = 566 + dy;
  return {
    rows,
    h: BASE_SCENE_H + dy,
    board: { x: 0, y: 0, w: SCENE_W, h: BASE_BOARD_H + dy },
    plank: { x: 0, y: 786 + SHELF_DROP + dy, w: SCENE_W, h: 16 },
    piggy: { x: 14, y: 602 + SHELF_DROP + dy, w: 232, h: 182 },
    pigInfo: { x: 266, y: 640 + SHELF_DROP + dy, w: 168 },
    pile: { x: 454, y: shelfY, w: 592, h: 214 + SHELF_DROP },
    purse: {
      back: { x: 474, y: shelfY + SHELF_DROP + 66, w: 552, h: 152 },
      pocket: { x: 466, y: shelfY + SHELF_DROP + 128, w: 568, h: 92 },
      coinPocket: { x: 858, y: shelfY + SHELF_DROP + 108, w: 158, h: 108 },
    },
    addCell,
    cells,
  };
}

/** Changes whenever cells move or the board resizes. */
export const layoutKey = (L: Layout) => L.rows + '|' + [...L.cells].map(([id, r]) => `${id}:${r.x},${r.y},${r.w},${r.h}`).join(';');

/** Area where the top-left corner of a bill may land. */
function freeArea(loc: BillLocation, L: Layout): Rect | null {
  if (loc.type === 'pile') {
    // Bills stick out of the wallet: their tops above the pocket, the rest tucked inside.
    const { back, coinPocket } = L.purse;
    return { x: back.x + 4, y: back.y - 22, w: coinPocket.x + 30 - BW - (back.x + 4), h: 44 };
  }
  if (loc.type === 'piggy') return null;
  const r = L.cells.get(loc.cellId);
  if (!r) return null;
  return { x: r.x + 4, y: r.y + TAG_H, w: Math.max(0, r.w - BW - 8), h: Math.max(0, r.h - BH - TAG_H - 6) };
}

/** Centre of a bill in scene coordinates. */
export function poseToPoint(loc: BillLocation, pose: Pose, L: Layout) {
  const a = freeArea(loc, L);
  if (!a) return { x: L.piggy.x + L.piggy.w / 2, y: L.piggy.y + L.piggy.h / 2 };
  return { x: a.x + pose.x * a.w + BW / 2, y: a.y + pose.y * a.h + BH / 2 };
}

/** Inverse of poseToPoint for a dropped bill; clamps into the free area. */
export function pointToPose(loc: BillLocation, cx: number, cy: number, r: number, L: Layout): Pose {
  const a = freeArea(loc, L);
  if (!a) return { x: 0.5, y: 0.5, r };
  const nx = a.w ? (cx - BW / 2 - a.x) / a.w : 0.5;
  const ny = a.h ? (cy - BH / 2 - a.y) / a.h : 0.5;
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return { x: clamp(nx), y: clamp(ny), r };
}

export const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
