import { describe, expect, it } from 'vitest';
import { defaultCategories } from '@/model/defaults';
import { computeLayout, packCells } from './layout';

describe('packCells', () => {
  it('reproduces the 8×4 wall from the design with the default categories', () => {
    const { positions, rows } = packCells(defaultCategories('BYN'));
    expect(rows).toBe(4);
    expect(Object.fromEntries(positions)).toEqual({
      podushka: { col: 0, row: 0 },
      arenda: { col: 3, row: 0 },
      eda: { col: 5, row: 0 },
      transport: { col: 0, row: 2 },
      fun: { col: 2, row: 2 },
      cafe: { col: 4, row: 2 },
      health: { col: 5, row: 2 },
      phone: { col: 7, row: 2 },
      gifts: { col: 5, row: 3 },
    });
  });

  it('grows the board and pushes the shelf down when cells do not fit', () => {
    const base = computeLayout(defaultCategories('BYN'), false);
    const more = computeLayout([...defaultCategories('BYN'), { id: 'cat', name: 'Котик', budget: 100, colSpan: 2, rowSpan: 2 }], false);
    expect(more.rows).toBe(6);
    expect(more.h - base.h).toBe(2 * 128);
    expect(more.piggy.y - base.piggy.y).toBe(2 * 128);
    expect(more.cells.get('cat')).toMatchObject({ x: 26, y: 26 + 4 * 128 });
  });

  it('shrinks the board to the cells it holds', () => {
    const three = defaultCategories('BYN').filter(c => ['cafe', 'health', 'phone'].includes(c.id));
    expect(computeLayout(three, false).rows).toBe(2);
  });
});

describe('add-a-cell card', () => {
  it('takes a whole new row when the grid is full', () => {
    const L = computeLayout(defaultCategories('BYN'));
    expect(L.rows).toBe(5);
    expect(L.addCell).toMatchObject({ x: 26, y: 26 + 4 * 128, h: 118 });
    expect(L.addCell!.w).toBeGreaterThan(1000);
  });

  it('fills the first free gap when there is one', () => {
    const cats = defaultCategories('BYN').filter(c => c.id !== 'gifts');
    const L = computeLayout(cats);
    expect(L.rows).toBe(4);
    expect(L.addCell).toMatchObject({ x: 26 + 5 * 127.25, y: 26 + 3 * 128, w: 117.25 });
  });
});
