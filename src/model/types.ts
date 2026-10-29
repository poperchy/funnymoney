import type { CurrencyCode } from '@/lib/money/currency';

export type BillLocation = { type: 'cell'; cellId: string } | { type: 'pile' } | { type: 'piggy' };

/** Where a bill lies inside its container: x/y are 0..1 of the free space, r is degrees. */
export type Pose = { x: number; y: number; r: number };

export type Bill = {
  id: string;
  /** Minor units. */
  value: number;
  location: BillLocation;
  pose: Pose;
  /** Stacking order; newer bills lie on top. */
  z: number;
};

/**
 * Coins live in the wallet pocket, in a cell (`cellId`), or in the piggy (change).
 * Old saves have no location: piggy.
 */
export type Coin = { id: string; value: number; location?: 'wallet' | 'piggy' | 'cell'; cellId?: string };
export const inWallet = (c: Coin) => c.location === 'wallet';
export const inPiggy = (c: Coin) => !c.location || c.location === 'piggy';

/** Where a coin is, in the same terms as a bill's location. */
export function coinLocation(c: Coin): BillLocation {
  if (c.location === 'wallet') return { type: 'pile' };
  if (c.location === 'cell' && c.cellId) return { type: 'cell', cellId: c.cellId };
  return { type: 'piggy' };
}

export function coinPlace(loc: BillLocation): Pick<Coin, 'location' | 'cellId'> {
  if (loc.type === 'pile') return { location: 'wallet', cellId: undefined };
  if (loc.type === 'cell') return { location: 'cell', cellId: loc.cellId };
  return { location: 'piggy', cellId: undefined };
}

export type Category = {
  id: string;
  name: string;
  /** Minor units. */
  budget: number;
  /** Size on the 8-column wall grid. Position comes from packing categories in order. */
  colSpan: number;
  rowSpan: number;
};

export type Receipt = {
  id: string;
  label: string;
  /** Category id or 'pile'. */
  source: string;
  amount: number;
  paid: number;
  at: string;
};

export type Wallet = {
  version: 1;
  currency: CurrencyCode;
  categories: Category[];
  bills: Bill[];
  coins: Coin[];
  receipts: Receipt[];
  lastIncome: number;
  onboarded: boolean;
};

/** Spot a bill can be dragged to. */
export type DropTarget = { type: 'cell'; cellId: string } | { type: 'pile' } | { type: 'piggy' } | { type: 'spent' };

export const slotKey = (loc: BillLocation | DropTarget) => (loc.type === 'cell' ? loc.cellId : loc.type);
export const sameSlot = (a: BillLocation | DropTarget, b: BillLocation | DropTarget) => slotKey(a) === slotKey(b);
