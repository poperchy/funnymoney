// Skins for the board and the wallet. The first of each is free; the rest unlock with a donation.
import { tr } from '@/lib/i18n';
import type { Theme } from '@/model/ui';

export type BoardSkinId = 'cork' | 'felt' | 'concrete' | 'envelope' | 'fridge' | 'pegboard' | 'cosmos';
export type PurseSkinId = 'leather' | 'croc' | 'glam' | 'bifold' | 'glutton' | 'canvas' | 'nebula';

export type BoardLook = {
  frame: string;
  inner: string;
  cell: string;
  light: [string, number];
  /** Cells take turns in these colours instead of `cell`. */
  tints?: string[];
  /** A flat skin draws thick contours instead of depth. */
  outline?: string;
  /** Captions on a light board: dark instead of the usual pale ones. */
  ink?: string;
};
export type BoardSkin = {
  id: BoardSkinId;
  name: string;
  blurb: string;
  /** Donation, shown with `PigMark`; 0 = free. */
  price: number;
  frameTexture: 'wood' | 'metal' | 'linen' | 'flat';
  cellTexture: 'cork' | 'felt' | 'concrete' | 'envelope' | 'flat' | 'pegboard' | 'stars';
  look: Record<Theme, BoardLook>;
  /** CSS background for the shop thumbnail. */
  swatch: string;
};

export type PurseLook = {
  back: string;
  front: string;
  coin: string;
  stitch: string;
  /** The strap or the clasp. */
  accent?: string;
  /** A flat skin: thick contours instead of leather and stitches. */
  outline?: string;
  /** Captions on a light wallet: dark instead of the usual pale ones. */
  ink?: string;
};

export type PurseSkin = {
  id: PurseSkinId;
  name: string;
  blurb: string;
  price: number;
  texture: 'leather' | 'croc' | 'glam' | 'flat';
  /** Strap: card slots and a strap with a snap. Clasp: a clasp on the opening and a face (`PurseTrim`). */
  trim?: 'strap' | 'clasp';
  look: Record<Theme, PurseLook>;
};

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'cork', ...tr.skins.board.cork,
    price: 0,
    frameTexture: 'wood',
    cellTexture: 'cork',
    look: {
      light: { frame: '#9c6b40', inner: '#6c4628', cell: '#c99967', light: ['rgba(255,240,210,0.16)', 0] },
      dark: { frame: '#55391f', inner: '#2c1d10', cell: '#86603a', light: ['rgba(255,200,130,0.12)', 0.38] },
    },
    swatch: 'radial-gradient(circle at 30% 30%, #d9ab79, #b9875a)',
  },
  {
    id: 'felt', ...tr.skins.board.felt,
    price: 149,
    frameTexture: 'wood',
    cellTexture: 'felt',
    look: {
      light: { frame: '#6e2a1c', inner: '#3a130c', cell: '#2f7a4f', light: ['rgba(255,240,200,0.14)', 0.12] },
      dark: { frame: '#4a1a10', inner: '#200a05', cell: '#1d5236', light: ['rgba(255,220,150,0.1)', 0.4] },
    },
    swatch: 'radial-gradient(circle at 30% 30%, #3f9a66, #22613d)',
  },
  {
    id: 'concrete', ...tr.skins.board.concrete,
    price: 149,
    frameTexture: 'metal',
    cellTexture: 'concrete',
    look: {
      light: { frame: '#8e9399', inner: '#4a4e53', cell: '#b9b6b0', light: ['rgba(255,255,255,0.14)', 0] },
      dark: { frame: '#55595e', inner: '#25282b', cell: '#7a7873', light: ['rgba(200,220,255,0.08)', 0.35] },
    },
    swatch: 'radial-gradient(circle at 30% 30%, #cfccc6, #9d9a94)',
  },
  {
    id: 'envelope', ...tr.skins.board.envelope,
    price: 149,
    frameTexture: 'linen',
    cellTexture: 'envelope',
    look: {
      light: { frame: '#e7dfd0', inner: '#ded4c1', cell: '#d2a874', light: ['rgba(255,250,235,0.1)', 0], ink: '#3a2410' },
      dark: { frame: '#4a4136', inner: '#3b332a', cell: '#a67f52', light: ['rgba(255,220,170,0.06)', 0.25], ink: '#2b1c0e' },
    },
    swatch: 'linear-gradient(to bottom right, #c49a66 49%, #8a6a42 50%, #d2a874 51%)',
  },
  {
    id: 'fridge', ...tr.skins.board.fridge,
    price: 149,
    frameTexture: 'flat',
    cellTexture: 'flat',
    look: {
      light: {
        frame: '#fffaf0',
        inner: '#fffaf0',
        cell: '#f3f0ea',
        light: ['rgba(0,0,0,0)', 0],
        tints: ['#e6f4ff', '#fff0d6', '#efe8ff', '#e3f7ec', '#ffe6ee', '#fff6c9'],
        outline: '#1a1a1a',
        ink: '#1a1a1a',
      },
      dark: {
        frame: '#3a3833',
        inner: '#3a3833',
        cell: '#4a4740',
        light: ['rgba(0,0,0,0)', 0],
        tints: ['#36505f', '#5c5030', '#473d63', '#2f5443', '#5f3c4a', '#5a5530'],
        outline: '#0e0e0e',
        ink: '#f1ece3',
      },
    },
    swatch: 'linear-gradient(135deg, #e6f4ff 50%, #ffe6ee 50%)',
  },
  {
    id: 'pegboard', ...tr.skins.board.pegboard,
    price: 149,
    frameTexture: 'metal',
    cellTexture: 'pegboard',
    look: {
      light: { frame: '#3b463f', inner: '#2f3832', cell: '#4a5a51', light: ['rgba(255,255,255,0.08)', 0] },
      dark: { frame: '#2a322d', inner: '#1f2521', cell: '#36423b', light: ['rgba(255,255,255,0.05)', 0.3] },
    },
    swatch: 'radial-gradient(circle, #1a221d 22%, transparent 26%) 0 0 / 10px 10px, #4a5a51',
  },
  {
    id: 'cosmos', ...tr.skins.board.cosmos,
    price: 149,
    frameTexture: 'metal',
    cellTexture: 'stars',
    look: {
      light: { frame: '#2b2f55', inner: '#171a3a', cell: '#1f2352', light: ['rgba(170,150,255,0.14)', 0] },
      dark: { frame: '#1d2040', inner: '#0e1028', cell: '#161a40', light: ['rgba(170,150,255,0.1)', 0.3] },
    },
    swatch: 'radial-gradient(circle at 25% 30%, #fff 2%, transparent 4%), radial-gradient(circle at 70% 60%, #cfc6ff 2%, transparent 4%), linear-gradient(160deg, #2c2f6e, #161a40)',
  },
];

/** A cell's colour. Tinted skins pick by id, so a cell keeps its colour when the wall is rearranged. */
export function cellColor(look: BoardLook, id: string) {
  if (!look.tints) return look.cell;
  const h = [...id].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) | 0, 7);
  return look.tints[Math.abs(h) % look.tints.length];
}

export const PURSE_SKINS: PurseSkin[] = [
  {
    id: 'leather', ...tr.skins.purse.leather,
    price: 0,
    texture: 'leather',
    look: {
      light: { back: '#5b3420', front: '#8a5232', coin: '#7a4429', stitch: 'rgba(250,224,180,0.75)' },
      dark: { back: '#3a2214', front: '#653a22', coin: '#58321d', stitch: 'rgba(240,210,160,0.55)' },
    },
  },
  {
    id: 'croc', ...tr.skins.purse.croc,
    price: 99,
    texture: 'croc',
    look: {
      light: { back: '#1f3a2c', front: '#2f5a41', coin: '#284d38', stitch: 'rgba(220,235,200,0.6)' },
      dark: { back: '#132519', front: '#1f3d2c', coin: '#1a3326', stitch: 'rgba(200,220,180,0.45)' },
    },
  },
  {
    id: 'glam', ...tr.skins.purse.glam,
    price: 99,
    texture: 'glam',
    look: {
      light: { back: '#b8547d', front: '#e07aa5', coin: '#cc6892', stitch: 'rgba(255,225,150,0.9)' },
      dark: { back: '#7a3152', front: '#a84f78', coin: '#924266', stitch: 'rgba(255,215,130,0.75)' },
    },
  },
  {
    id: 'bifold', ...tr.skins.purse.bifold,
    price: 99,
    texture: 'leather',
    trim: 'strap',
    look: {
      light: { back: '#5c321a', front: '#a2622f', coin: '#8a4f2a', stitch: 'rgba(247,230,200,0.6)', accent: '#4a2814' },
      dark: { back: '#3b2010', front: '#7a4823', coin: '#65391c', stitch: 'rgba(240,215,175,0.5)', accent: '#2e180b' },
    },
  },
  {
    id: 'glutton', ...tr.skins.purse.glutton,
    price: 129,
    texture: 'flat',
    trim: 'clasp',
    look: {
      light: { back: '#ee6a97', front: '#ff7aa8', coin: '#ff93b9', stitch: 'transparent', accent: '#ffd34d', outline: '#1a1a1a', ink: '#1a1a1a' },
      dark: { back: '#a8456b', front: '#d0608a', coin: '#bb5079', stitch: 'transparent', accent: '#e6b93a', outline: '#0e0e0e', ink: '#1a1a1a' },
    },
  },
  {
    id: 'canvas', ...tr.skins.purse.canvas,
    price: 99,
    texture: 'leather',
    trim: 'strap',
    look: {
      light: { back: '#3f4a33', front: '#6b7a4f', coin: '#5a6842', stitch: 'rgba(235,235,200,0.6)', accent: '#2d3528' },
      dark: { back: '#2a3222', front: '#4b5738', coin: '#3f4a2f', stitch: 'rgba(225,225,190,0.45)', accent: '#1e2419' },
    },
  },
  {
    id: 'nebula', ...tr.skins.purse.nebula,
    price: 99,
    texture: 'glam',
    look: {
      light: { back: '#232659', front: '#3a3f8f', coin: '#30347a', stitch: 'rgba(205,200,255,0.7)' },
      dark: { back: '#161a40', front: '#282c6b', coin: '#20245a', stitch: 'rgba(190,185,245,0.55)' },
    },
  },
];

/** The till: the "Потрачено" block that swallows money. Same in both themes, except the default one that follows the page. */
export type TillSkin = {
  id: string;
  name: string;
  blurb: string;
  price: number;
  look: {
    background: string;
    ink: string;
    inkSoft: string;
    /** The recess around the slot. */
    well: string;
    slit: string;
    outline?: string;
  };
  deco?: 'keys' | 'hazard' | 'eyes' | 'trays';
};

const PALE = { ink: '#f6efe3', inkSoft: 'rgba(246,239,227,0.7)' };

export const TILL_SKINS: TillSkin[] = [
  { id: 'register', ...tr.skins.till.register, price: 0, look: { background: 'var(--till)', ...PALE, well: 'rgba(0,0,0,0.35)', slit: '#0b0806' } },
  {
    id: 'retro', ...tr.skins.till.retro,
    price: 99,
    look: { background: 'linear-gradient(160deg, #efe3c8, #d8c7a2)', ink: '#3a2a18', inkSoft: 'rgba(58,42,24,0.72)', well: 'rgba(90,60,25,0.22)', slit: '#3a2a18' },
    deco: 'keys',
  },
  {
    id: 'shredder', ...tr.skins.till.shredder,
    price: 99,
    look: {
      background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px), linear-gradient(160deg, #a6abb0, #6d7277)',
      ink: '#17191b',
      inkSoft: 'rgba(23,25,27,0.72)',
      well: 'rgba(0,0,0,0.28)',
      slit: '#0e0f10',
    },
    deco: 'hazard',
  },
  {
    id: 'workshop', ...tr.skins.till.workshop,
    price: 99,
    look: { background: 'linear-gradient(180deg, #5c615c, #3a3e3a)', ...PALE, well: 'rgba(0,0,0,0.42)', slit: '#141614' },
    deco: 'trays',
  },
  {
    id: 'croupier', ...tr.skins.till.croupier,
    price: 99,
    look: { background: 'radial-gradient(circle at 30% 20%, #2f7a4f, #174a2e)', ...PALE, well: 'rgba(0,0,0,0.32)', slit: '#0b1f13', outline: '#c9a24a' },
  },
  {
    id: 'mouth', ...tr.skins.till.mouth,
    price: 129,
    look: { background: '#7be0b0', ink: '#1a1a1a', inkSoft: 'rgba(26,26,26,0.72)', well: 'rgba(255,255,255,0.45)', slit: '#1a1a1a', outline: '#1a1a1a' },
    deco: 'eyes',
  },
  {
    id: 'blackhole', ...tr.skins.till.blackhole,
    price: 129,
    look: {
      background:
        'radial-gradient(circle at 18% 22%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 74% 16%, #cfc6ff 0 1px, transparent 1.5px), radial-gradient(circle at 90% 44%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 42% 34%, #fff 0 0.7px, transparent 1.2px), radial-gradient(ellipse at 50% 72%, #000 22%, #3a2a8f 38%, #15123a 62%, #090818)',
      ...PALE,
      well: 'rgba(0,0,0,0.5)',
      slit: '#000',
    },
  },
];
export const tillSkin = (id: string) => TILL_SKINS.find(s => s.id === id) ?? TILL_SKINS[0];

/** What the pig wears: one thing on the head, one on the neck. Painted in `pigWear.ts`, by id. */
export type PigWear = { id: string; name: string; blurb: string; price: number };
export const NO_WEAR = 'none';

export const HAT_SKINS: PigWear[] = [
  { id: NO_WEAR, ...tr.skins.hat.none, price: 0 },
  { id: 'tophat', ...tr.skins.hat.tophat, price: 79 },
  { id: 'ushanka', ...tr.skins.hat.ushanka, price: 79 },
  { id: 'crown', ...tr.skins.hat.crown, price: 129 },
];

export const NECK_SKINS: PigWear[] = [
  { id: NO_WEAR, ...tr.skins.neck.none, price: 0 },
  { id: 'bow', ...tr.skins.neck.bow, price: 79 },
  { id: 'pearls', ...tr.skins.neck.pearls, price: 99 },
  { id: 'chain', ...tr.skins.neck.chain, price: 129 },
];

/**
 * The page behind the wall. Sold on its own, never in a pack. Captions sit right on it, so every look keeps
 * the lightness of its theme: light with a faint pattern by day, dark at night.
 */
export type PageLook = { color: string; image: string; size: string };
export type PageSkin = { id: string; name: string; blurb: string; price: number; look: Record<Theme, PageLook> };

const svg = (w: number, h: number, body: string) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'%3E${body}%3C/svg%3E")`;
/** A faint bill, tilted: the pattern of the "Денежки" wallpaper. */
const billTile = (color: string) =>
  svg(
    92,
    92,
    `%3Cg fill='none' stroke='${color}' stroke-width='1.5'%3E%3Cg transform='rotate(-14 26 26)'%3E%3Crect x='8' y='16' width='36' height='19' rx='2'/%3E%3Ccircle cx='26' cy='25.5' r='4.5'/%3E%3C/g%3E%3Cg transform='rotate(11 68 70)'%3E%3Crect x='50' y='60' width='36' height='19' rx='2'/%3E%3Ccircle cx='68' cy='69.5' r='4.5'/%3E%3C/g%3E%3C/g%3E`,
  );
const damask = (color: string) => svg(72, 72, `%3Cpath fill='${color}' d='M36 14c6 7 9 13 0 22-9-9-6-15 0-22zM36 58c-6-7-9-13 0-22 9 9 6 15 0 22z'/%3E`);
const grid = (color: string) => `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
const checks = (color: string) => `conic-gradient(${color} 25%, transparent 0 50%, ${color} 0 75%, transparent 0)`;
/** Boards laid in courses, each row shifted by half a board, some a touch darker. Colours go in URL-escaped. */
const planks = (line: string, tone: string) =>
  svg(
    240,
    72,
    `%3Cg fill='${tone}'%3E%3Crect x='120' width='120' height='36'/%3E%3Crect x='60' y='36' width='60' height='36'/%3E%3Crect x='180' y='36' width='60' height='36'/%3E%3C/g%3E%3Cpath fill='none' stroke='${line}' d='M0 .5H240M0 36.5H240M120 0V36M60 36V72M180 36V72'/%3E`,
  );
const peas = (color: string) => `radial-gradient(circle, ${color} 0 5px, transparent 5.5px)`;

export const PAGE_SKINS: PageSkin[] = [
  {
    id: 'plain', ...tr.skins.page.plain,
    price: 0,
    look: { light: { color: '#f1ece3', image: 'none', size: 'auto' }, dark: { color: '#17130f', image: 'none', size: 'auto' } },
  },
  {
    id: 'notebook', ...tr.skins.page.notebook,
    price: 79,
    look: {
      light: { color: '#f8f7f1', image: grid('rgba(70,120,190,0.3)'), size: '24px 24px' },
      dark: { color: '#14181f', image: grid('rgba(130,170,230,0.18)'), size: '24px 24px' },
    },
  },
  {
    id: 'wallpaper', ...tr.skins.page.wallpaper,
    price: 79,
    look: {
      light: { color: '#efe6d6', image: `${damask('%23a07a4a33')}, repeating-linear-gradient(90deg, rgba(150,110,70,0.08) 0 36px, transparent 36px 72px)`, size: '72px 72px, auto' },
      dark: { color: '#1f1913', image: `${damask('%23e6c79a1a')}, repeating-linear-gradient(90deg, rgba(255,230,190,0.03) 0 36px, transparent 36px 72px)`, size: '72px 72px, auto' },
    },
  },
  {
    id: 'tiles', ...tr.skins.page.tiles,
    price: 79,
    look: {
      light: { color: '#eef1ee', image: checks('rgba(70,110,110,0.08)'), size: '72px 72px' },
      dark: { color: '#141a1a', image: checks('rgba(160,210,210,0.05)'), size: '72px 72px' },
    },
  },
  {
    id: 'parquet', ...tr.skins.page.parquet,
    price: 79,
    look: {
      light: { color: '#e9dcc6', image: planks('%236e461e44', '%236e461e12'), size: '240px 72px' },
      dark: { color: '#21180f', image: planks('%23ffd7a01f', '%23ffd7a00a'), size: '240px 72px' },
    },
  },
  {
    id: 'peas', ...tr.skins.page.peas,
    price: 79,
    look: {
      light: { color: '#faeee8', image: peas('rgba(225,110,120,0.16)'), size: '44px 44px' },
      dark: { color: '#1f1518', image: peas('rgba(240,130,150,0.09)'), size: '44px 44px' },
    },
  },
  {
    id: 'cash', ...tr.skins.page.cash,
    price: 99,
    look: {
      light: { color: '#eef1e3', image: billTile('%234f7a4a33'), size: '92px 92px' },
      dark: { color: '#151a12', image: billTile('%23a4d29a22'), size: '92px 92px' },
    },
  },
];
export const pageSkin = (id: string) => PAGE_SKINS.find(s => s.id === id) ?? PAGE_SKINS[0];

export type SkinSet = { board: string; purse: string; till: string; hat: string; neck: string };
/** A whole outfit, sold together at a discount. The landing page shows the same ones. */
export type SkinPack = { id: string; name: string; blurb: string; skins: SkinSet };

export const SKIN_PACKS: SkinPack[] = [
  { id: 'granny', ...tr.skins.pack.granny, skins: { board: 'envelope', purse: 'bifold', till: 'retro', hat: 'ushanka', neck: 'pearls' } },
  { id: 'cartoon', ...tr.skins.pack.cartoon, skins: { board: 'fridge', purse: 'glutton', till: 'mouth', hat: NO_WEAR, neck: 'bow' } },
  { id: 'garage', ...tr.skins.pack.garage, skins: { board: 'pegboard', purse: 'canvas', till: 'workshop', hat: 'ushanka', neck: 'chain' } },
  { id: 'vegas', ...tr.skins.pack.vegas, skins: { board: 'felt', purse: 'croc', till: 'croupier', hat: 'tophat', neck: 'bow' } },
  { id: 'loft', ...tr.skins.pack.loft, skins: { board: 'concrete', purse: 'glam', till: 'shredder', hat: 'crown', neck: 'chain' } },
  { id: 'space', ...tr.skins.pack.space, skins: { board: 'cosmos', purse: 'nebula', till: 'blackhole', hat: 'crown', neck: NO_WEAR } },
];

const PACK_DISCOUNT = 0.7;
const packParts = (p: SkinPack) => [boardSkin(p.skins.board), purseSkin(p.skins.purse), tillSkin(p.skins.till), hatSkin(p.skins.hat), neckSkin(p.skins.neck)];

/** What the pack costs you: only the parts you don't have yet, at a discount. 0 once you own them all. */
export function packPrice(p: SkinPack, owned: string[]) {
  const rest = packParts(p).filter(s => !owned.includes(s.id)).reduce((a, s) => a + s.price, 0);
  return { full: rest, price: rest ? Math.max(49, Math.round((rest * PACK_DISCOUNT) / 10) * 10 - 1) : 0 };
}
export const packSkinIds = (p: SkinPack) => packParts(p).filter(s => s.price > 0).map(s => s.id);

export const hatSkin = (id: string) => HAT_SKINS.find(s => s.id === id) ?? HAT_SKINS[0];
export const neckSkin = (id: string) => NECK_SKINS.find(s => s.id === id) ?? NECK_SKINS[0];

export const boardSkin = (id: string) => BOARD_SKINS.find(s => s.id === id) ?? BOARD_SKINS[0];
export const purseSkin = (id: string) => PURSE_SKINS.find(s => s.id === id) ?? PURSE_SKINS[0];
