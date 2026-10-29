// Skins for the board and the wallet. The first of each is free; the rest unlock with a donation.
import type { Theme } from '@/model/ui';

export type BoardSkinId = 'cork' | 'felt' | 'concrete';
export type PurseSkinId = 'leather' | 'croc' | 'glam';

type BoardLook = { frame: string; inner: string; cell: string; light: [string, number] };
export type BoardSkin = {
  id: BoardSkinId;
  name: string;
  blurb: string;
  /** Donation in RUB; 0 = free. */
  price: number;
  frameTexture: 'wood' | 'metal';
  cellTexture: 'cork' | 'felt' | 'concrete';
  look: Record<Theme, BoardLook>;
  /** CSS background for the shop thumbnail. */
  swatch: string;
};

export type PurseSkin = {
  id: PurseSkinId;
  name: string;
  blurb: string;
  price: number;
  texture: 'leather' | 'croc' | 'glam';
  look: Record<Theme, { back: string; front: string; coin: string; stitch: string }>;
  swatch: string;
};

export const BOARD_SKINS: BoardSkin[] = [
  {
    id: 'cork',
    name: 'Пробка',
    blurb: 'Классика: дерево и пробка, как у бабушки в прихожей',
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
    id: 'felt',
    name: 'Казино',
    blurb: 'Зелёное сукно и красное дерево. Ставки сделаны',
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
    id: 'concrete',
    name: 'Лофт',
    blurb: 'Бетон и сталь. Деньги в индустриальном стиле',
    price: 149,
    frameTexture: 'metal',
    cellTexture: 'concrete',
    look: {
      light: { frame: '#8e9399', inner: '#4a4e53', cell: '#b9b6b0', light: ['rgba(255,255,255,0.14)', 0] },
      dark: { frame: '#55595e', inner: '#25282b', cell: '#7a7873', light: ['rgba(200,220,255,0.08)', 0.35] },
    },
    swatch: 'radial-gradient(circle at 30% 30%, #cfccc6, #9d9a94)',
  },
];

export const PURSE_SKINS: PurseSkin[] = [
  {
    id: 'leather',
    name: 'Кожа',
    blurb: 'Коричневая кожа со строчкой. Надёжно и скучно',
    price: 0,
    texture: 'leather',
    look: {
      light: { back: '#5b3420', front: '#8a5232', coin: '#7a4429', stitch: 'rgba(250,224,180,0.75)' },
      dark: { back: '#3a2214', front: '#653a22', coin: '#58321d', stitch: 'rgba(240,210,160,0.55)' },
    },
    swatch: 'linear-gradient(160deg, #9a5d38, #5b3420)',
  },
  {
    id: 'croc',
    name: 'Крокодил',
    blurb: 'Тиснение под рептилию. Деньги чувствуют себя хищно',
    price: 99,
    texture: 'croc',
    look: {
      light: { back: '#1f3a2c', front: '#2f5a41', coin: '#284d38', stitch: 'rgba(220,235,200,0.6)' },
      dark: { back: '#132519', front: '#1f3d2c', coin: '#1a3326', stitch: 'rgba(200,220,180,0.45)' },
    },
    swatch: 'linear-gradient(160deg, #3d7353, #1f3a2c)',
  },
  {
    id: 'glam',
    name: 'Гламур',
    blurb: 'Розовый с блёстками. Тратить в нём неловко — и это работает',
    price: 99,
    texture: 'glam',
    look: {
      light: { back: '#b8547d', front: '#e07aa5', coin: '#cc6892', stitch: 'rgba(255,225,150,0.9)' },
      dark: { back: '#7a3152', front: '#a84f78', coin: '#924266', stitch: 'rgba(255,215,130,0.75)' },
    },
    swatch: 'linear-gradient(160deg, #f19bc0, #b8547d)',
  },
];

export const boardSkin = (id: string) => BOARD_SKINS.find(s => s.id === id) ?? BOARD_SKINS[0];
export const purseSkin = (id: string) => PURSE_SKINS.find(s => s.id === id) ?? PURSE_SKINS[0];
