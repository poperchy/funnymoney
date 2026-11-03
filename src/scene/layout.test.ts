import { describe, expect, it } from 'vitest';
import { defaultCategories } from '@/model/defaults';
import { ADD_SIZE, computeLayout, packCells } from './layout';

describe('packCells', () => {
  it('reproduces the 8×4 wall from the design with the default categories', () => {
    const { positions, rows } = packCells(defaultCategories('small'));
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

  it('packs the default categories into the 4-column phone wall without gaps', () => {
    const cats = defaultCategories('small');
    const { positions, rows } = packCells(cats, 4);
    expect(rows).toBe(8);
    const used = cats.reduce((n, c) => n + Math.min(4, c.colSpan) * c.rowSpan, 0);
    expect(used).toBe(4 * rows);
    expect(positions.get('cafe')).toEqual({ col: 3, row: 0 });
  });

  it('grows the board and pushes the shelf down when cells do not fit', () => {
    const base = computeLayout(defaultCategories('small'), false);
    const more = computeLayout([...defaultCategories('small'), { id: 'cat', name: 'Котик', budget: 100, colSpan: 2, rowSpan: 2 }], false);
    expect(more.rows).toBe(6);
    expect(more.h - base.h).toBe(2 * 128);
    expect(more.piggy.y - base.piggy.y).toBe(2 * 128);
    expect(more.cells.get('cat')).toMatchObject({ x: 26, y: 26 + 4 * 128 });
  });

  it('shrinks the board to the cells it holds', () => {
    const three = defaultCategories('small').filter(c => ['cafe', 'health', 'phone'].includes(c.id));
    expect(computeLayout(three, false).rows).toBe(2);
  });
});

describe('add-a-cell card', () => {
  it('takes a low row of its own when the grid is full', () => {
    const cats = defaultCategories('small');
    const L = computeLayout(cats);
    expect(L.rows).toBe(4);
    expect(L.addCell).toMatchObject({ x: (1060 - ADD_SIZE) / 2, y: 26 + 4 * 128, w: ADD_SIZE, h: ADD_SIZE });
    expect(L.board.h).toBe(computeLayout(cats, false).board.h + ADD_SIZE + 10);
  });

  it('fills the first free gap when there is one', () => {
    const cats = defaultCategories('small').filter(c => c.id !== 'gifts');
    const L = computeLayout(cats);
    expect(L.rows).toBe(4);
    expect(L.addCell).toMatchObject({ x: 26 + 5 * 127.25 + (117.25 - ADD_SIZE) / 2, y: 26 + 3 * 128 + (118 - ADD_SIZE) / 2, w: ADD_SIZE });
    expect(L.board.h).toBe(computeLayout(cats, false).board.h);
  });

  it('is all there is on a wall with no cells', () => {
    const L = computeLayout([]);
    expect(L.rows).toBe(0);
    expect(L.board.h).toBe(26 + ADD_SIZE + 26);
  });
});
