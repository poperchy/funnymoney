'use client';

import { useUnit } from 'effector-react';
import { useState } from 'react';
import { moneyShort } from '@/lib/money/format';
import { CELL_SIZES } from '@/model/defaults';
import { totalIn } from '@/model/ops';
import { $editingCategory, categoryEditOpened, toastShown } from '@/model/ui';
import { $currency, $wallet, categoryAdded, categoryRemoved, categoryUpdated } from '@/model/wallet';
import type { Category } from '@/model/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

/** `$editingCategory` holds a category id, or 'new' to create one. */
export function CategoryDialog() {
  const [id, w] = useUnit([$editingCategory, $wallet]);
  if (id === 'new') return <CategoryForm key="new" />;
  const cat = w.categories.find(c => c.id === id);
  return cat ? <CategoryForm key={cat.id} cat={cat} /> : null;
}

/** Tiny grid sketch of a cell size. */
function SizeIcon({ cs, rs, on }: { cs: number; rs: number; on: boolean }) {
  return (
    <span className="grid grid-cols-3 grid-rows-2 gap-[3px]" style={{ width: 42, height: 28 }}>
      <span
        className="rounded-[3px]"
        style={{ gridColumn: `1 / span ${cs}`, gridRow: `1 / span ${rs}`, background: on ? 'var(--accent)' : 'var(--ink2)', opacity: on ? 1 : 0.45 }}
      />
    </span>
  );
}

function CategoryForm({ cat }: { cat?: Category }) {
  const [cur, w] = useUnit([$currency, $wallet]);
  const [name, setName] = useState(cat?.name ?? '');
  const [budget, setBudget] = useState(cat?.budget ? String(cat.budget / 100) : '');
  const [size, setSize] = useState(() => CELL_SIZES.find(s => s.colSpan === cat?.colSpan && s.rowSpan === cat?.rowSpan)?.id ?? 'square');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const close = () => categoryEditOpened(null);
  // Budget is optional: empty means "no limit", and auto-spread skips the cell.
  const typed = Math.round(parseFloat(budget.replace(/\s/g, '').replace(',', '.')) * 100);
  const parsed = Number.isFinite(typed) ? typed : 0;
  const valid = name.trim().length > 0 && parsed >= 0;
  const spans = CELL_SIZES.find(s => s.id === size)!;
  const inside = cat ? totalIn(w, { type: 'cell', cellId: cat.id }) : 0;

  const save = () => {
    if (!valid) return;
    const data = { name: name.trim().slice(0, 24), budget: parsed, colSpan: spans.colSpan, rowSpan: spans.rowSpan };
    if (cat) categoryUpdated({ id: cat.id, ...data });
    else {
      categoryAdded(data);
      toastShown(`Новая ячейка «${data.name}». Пустая, но это ненадолго`);
    }
    close();
  };

  const remove = () => {
    if (!cat) return;
    categoryRemoved(cat.id);
    toastShown(inside ? `Ячейки «${cat.name}» больше нет. ${moneyShort(inside)} ${cur.symbol} вернулись в кошелёк` : `Ячейки «${cat.name}» больше нет. Было и прошло`);
    close();
  };

  if (confirmDelete && cat) {
    return (
      <Modal open onClose={() => setConfirmDelete(false)} title="Удалить ячейку" width={460}>
        <span className="text-[26px] leading-tight font-bold tracking-[-0.025em]">Снять «{cat.name}» со стены?</span>
        <span className="text-[15px] leading-normal text-ink2">
          {inside ? `Там лежит ${moneyShort(inside)} ${cur.symbol} — всё вернётся в кошелёк, ничего не пропадёт.` : 'Там пусто, так что никто не пострадает.'} Чеки останутся.
        </span>
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" size="lg" onClick={() => setConfirmDelete(false)}>
            Не, пусть висит
          </Button>
          <Button variant="primary" size="lg" className="!bg-danger" onClick={remove}>
            Снять
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={close} title={cat ? 'Ячейка' : 'Новая ячейка'} width={480}>
      <span className="text-[26px] font-bold tracking-[-0.025em]">{cat ? `Ячейка «${cat.name}»` : 'Новая ячейка'}</span>
      <label className="flex flex-col gap-2 text-sm text-ink2">
        Как называется
        <input
          autoFocus
          value={name}
          maxLength={24}
          placeholder="Например, Котик"
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="h-[46px] rounded-[14px] border border-line bg-field px-4 text-[15px] text-ink"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-ink2">
        <span>
          Бюджет на месяц <span className="opacity-70">— необязательно</span>
        </span>
        <span className="flex h-[46px] items-center gap-2 rounded-[14px] border border-line bg-field px-4">
          <input
            value={budget}
            inputMode="decimal"
            placeholder="без бюджета"
            onChange={e => setBudget(e.target.value.replace(/[^\d.,]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full bg-transparent text-[15px] font-semibold text-ink"
          />
          <span className="text-[13px]">{cur.symbol}</span>
        </span>
      </label>
      <div className="flex flex-col gap-2 text-sm text-ink2">
        Размер на стене
        <div className="grid grid-cols-4 gap-2">
          {CELL_SIZES.map(s => (
            <button
              key={s.id}
              onClick={() => setSize(s.id)}
              className={`flex flex-col items-center gap-2 rounded-[14px] border-2 px-2 py-3 text-[13px] font-semibold text-ink ${size === s.id ? 'border-accent bg-accent-wash' : 'border-line'}`}
            >
              <SizeIcon cs={s.colSpan} rs={s.rowSpan} on={size === s.id} />
              {s.label}
            </button>
          ))}
        </div>
        {!cat && <span className="text-[13px]">Места не хватит — доска подрастёт вниз.</span>}
      </div>
      <div className="flex items-center gap-2.5">
        {cat && (
          <Button variant="link" className="!text-danger mr-auto" onClick={() => setConfirmDelete(true)}>
            Снять со стены
          </Button>
        )}
        <div className="ml-auto flex gap-2.5">
          <Button variant="outline" size="lg" onClick={close}>
            Отмена
          </Button>
          <Button variant="primary" size="lg" disabled={!valid} onClick={save}>
            {cat ? 'Сохранить' : 'Повесить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
