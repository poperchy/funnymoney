import { describe, expect, it } from 'vitest';
import { BOARD_SKINS, HAT_SKINS, NECK_SKINS, packPrice, PAGE_SKINS, packSkinIds, PURSE_SKINS, SKIN_PACKS, TILL_SKINS } from './skins';

describe('skin packs', () => {
  // A typo here would silently dress the pack in the default skin.
  it('every pack wears skins that exist', () => {
    for (const { skins } of SKIN_PACKS) {
      expect(BOARD_SKINS.map(s => s.id)).toContain(skins.board);
      expect(PURSE_SKINS.map(s => s.id)).toContain(skins.purse);
      expect(TILL_SKINS.map(s => s.id)).toContain(skins.till);
      expect(HAT_SKINS.map(s => s.id)).toContain(skins.hat);
      expect(NECK_SKINS.map(s => s.id)).toContain(skins.neck);
    }
  });

  it('a pack is cheaper than its parts, and you only pay for what you lack', () => {
    const pack = SKIN_PACKS[0];
    const fresh = packPrice(pack, []);
    expect(fresh.price).toBeLessThan(fresh.full);
    const [first] = packSkinIds(pack);
    expect(packPrice(pack, [first]).full).toBeLessThan(fresh.full);
    expect(packPrice(pack, packSkinIds(pack))).toEqual({ full: 0, price: 0 });
  });

  it('page backgrounds are sold on their own', () => {
    for (const { skins } of SKIN_PACKS) expect(skins).not.toHaveProperty('page');
    for (const s of PAGE_SKINS) expect(packSkinIds(SKIN_PACKS[0])).not.toContain(s.id);
  });

  it('skin ids are unique across kinds, since ownership is one list', () => {
    const paid = [...BOARD_SKINS, ...PURSE_SKINS, ...TILL_SKINS, ...PAGE_SKINS, ...HAT_SKINS, ...NECK_SKINS].filter(s => s.price > 0).map(s => s.id);
    expect(new Set(paid).size).toBe(paid.length);
  });
});
